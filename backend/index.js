import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import cron from "node-cron";
import prisma from "./lib/prisma.js";
import { makeRequireAuth } from "./lib/auth.js";
import { captureSnapshot, countStatuses, getAnalytics, healthScore, logEvent } from "./lib/analytics.js";
import { runOnboardingNudge, runReminderSweep, runWeeklyDigest } from "./lib/reminders.js";
import { sendEmail } from "./lib/email.js";
import { ALLOW_REGISTRATION, BRAND_NAME, IS_PRIVATE } from "./lib/brand.js";
import { escapeHtml, rateLimit, safeEqual, securityHeaders } from "./lib/security.js";
import { applyBillingEvent, verifySignature } from "./lib/billing.js";
import { registerAccountRoutes } from "./routes/account.js";
import { registerDataRoutes } from "./routes/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Always absolute: res.sendFile() refuses relative paths.
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "uploads"));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".png", ".jpg", ".jpeg", ".webp"].includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed"));
  },
});

const requireAuth = makeRequireAuth(prisma);

const app = express();
const port = process.env.PORT || 3001;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(securityHeaders);

if (process.env.NODE_ENV === "production") {
  if (!process.env.FRONTEND_URL) console.warn("[security] FRONTEND_URL is not set: CORS is open to any origin.");
  if (!process.env.RESEND_API_KEY) console.warn("[email] RESEND_API_KEY is not set: no email will be delivered.");
  if (!process.env.CRON_SECRET && process.env.ENABLE_INTERNAL_CRON !== "1") {
    console.warn("[cron] Neither ENABLE_INTERNAL_CRON nor CRON_SECRET is set: reminders will not be sent.");
  }
}
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));

// Keep the raw body for webhook signature verification.
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// One line per request (no bodies, no query strings: they can hold tokens).
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    if (req.path === "/api/health") return;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
});

const limiters = {
  auth: rateLimit({ windowMs: 15 * 60 * 1000, max: 20, bucket: "auth" }),
  reset: rateLimit({ windowMs: 60 * 60 * 1000, max: 10, bucket: "reset" }),
  lead: rateLimit({ windowMs: 60 * 60 * 1000, max: 10, bucket: "lead" }),
  dot: rateLimit({ windowMs: 60 * 60 * 1000, max: 60, bucket: "dot" }),
};

app.get("/", (_req, res) => res.send(`${BRAND_NAME} API`));

// Public runtime config so the UI can adapt to the deployment mode.
app.get("/api/config", async (_req, res) => {
  let registrationOpen = !IS_PRIVATE || ALLOW_REGISTRATION;
  if (IS_PRIVATE && !ALLOW_REGISTRATION) {
    registrationOpen = (await prisma.company.count()) === 0; // first admin only
  }
  res.json({ mode: IS_PRIVATE ? "private" : "saas", brandName: BRAND_NAME, registrationOpen });
});

app.get("/api/health", async (_req, res) => {
  const checks = {
    jwtSecret: process.env.JWT_SECRET ? "ok" : "missing",
    databaseUrl: process.env.DATABASE_URL ? "ok" : "missing",
    database: "unknown",
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    checks.database = err instanceof Error ? err.message.slice(0, 120) : "error";
  }
  const ok = checks.jwtSecret === "ok" && checks.databaseUrl === "ok" && checks.database === "ok";
  res.status(ok ? 200 : 503).json({
    ok,
    checks,
    email: process.env.RESEND_API_KEY ? "configured" : "not configured",
    cron: process.env.ENABLE_INTERNAL_CRON === "1" ? "internal" : process.env.CRON_SECRET ? "external" : "off",
  });
});

// ---------- Routes ----------
registerAccountRoutes(app, { prisma, requireAuth, limiters, uploadDir: UPLOAD_DIR });
registerDataRoutes(app, { prisma, requireAuth, upload, uploadDir: UPLOAD_DIR, logEvent });

app.get("/api/dashboard", requireAuth, async (req, res) => {
  await captureSnapshot(req.companyId);
  const [documents, vehicleCount, driverCount, events] = await Promise.all([
    prisma.document.findMany({
      where: { companyId: req.companyId },
      include: { vehicle: true, driver: true },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.vehicle.count({ where: { companyId: req.companyId } }),
    prisma.driver.count({ where: { companyId: req.companyId } }),
    prisma.activityEvent.findMany({
      where: { companyId: req.companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const counts = countStatuses(documents);
  res.json({ counts, score: healthScore(counts), vehicleCount, driverCount, documents, events });
});

app.get("/api/analytics", requireAuth, async (req, res) => {
  await captureSnapshot(req.companyId);
  res.json(await getAnalytics(req.companyId));
});

// ---------- Leads (free tools on the marketing site) ----------
app.post("/api/leads", limiters.lead, async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return res.status(400).json({ error: "Please enter a valid email." });
  }
  const source = String(req.body.source ?? "web").slice(0, 60);
  const usdot = String(req.body.usdot ?? "").replace(/\D/g, "").slice(0, 10) || null;
  try {
    await prisma.lead.upsert({ where: { email }, update: { source, usdot }, create: { email, source, usdot } });
  } catch (err) {
    console.error("[lead] could not store lead:", err?.message ?? err);
  }
  if (process.env.CONTACT_TO_EMAIL) {
    sendEmail(
      process.env.CONTACT_TO_EMAIL,
      `[${BRAND_NAME} lead] ${email}`,
      `<p>New lead from <strong>${escapeHtml(source)}</strong>: ${escapeHtml(email)}${usdot ? ` (USDOT ${escapeHtml(usdot)})` : ""}</p>`
    ).catch(() => {});
  }
  res.status(201).json({ ok: true });
});

// ---------- Billing webhook (Lemon Squeezy) ----------
// Point the webhook at POST /api/billing/webhook and set LEMONSQUEEZY_WEBHOOK_SECRET.
app.post("/api/billing/webhook", async (req, res) => {
  // LEMON_WEBHOOK_SECRET is accepted too: it is the name used in older .env files.
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || process.env.LEMON_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "Webhook not configured" });
  if (!verifySignature(req.rawBody, req.headers["x-signature"], secret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  try {
    const result = await applyBillingEvent(prisma, req.body, { sendEmail });
    if (!result.handled && result.reason === "no_company") {
      console.warn(`[billing] ${result.event}: no account matches the buyer's email`);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[billing]", err?.message ?? err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

// ---------- Scheduled jobs (external trigger) ----------
function cronAuth(req, res, next) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: without a secret anyone could trigger sends (email spam).
  if (!secret) return res.status(503).send("CRON_SECRET is not configured");
  if (!safeEqual(String(req.headers.authorization ?? ""), `Bearer ${secret}`)) return res.status(401).send("Unauthorized");
  next();
}
app.post("/api/cron/reminders", cronAuth, async (_req, res) => res.json({ ok: true, ...(await runReminderSweep()) }));
app.post("/api/cron/digest", cronAuth, async (_req, res) => res.json({ ok: true, ...(await runWeeklyDigest()) }));
app.post("/api/cron/nudge", cronAuth, async (_req, res) => res.json({ ok: true, ...(await runOnboardingNudge()) }));

if (process.env.ENABLE_INTERNAL_CRON === "1") {
  const job = (name, fn) => async () => {
    try {
      console.log(`[cron] ${name}:`, JSON.stringify(await fn()));
    } catch (err) {
      console.error(`[cron] ${name} failed:`, err?.message ?? err);
    }
  };
  cron.schedule("0 8 * * *", job("reminders", runReminderSweep));
  cron.schedule("30 8 * * *", job("onboarding nudge", runOnboardingNudge));
  cron.schedule("15 8 * * 1", job("weekly digest", runWeeklyDigest));
  console.log("[cron] Internal jobs scheduled: reminders 08:00, nudge 08:30, weekly digest Mondays 08:15 (server time)");
}

// ---------- Errors ----------
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({ error: tooBig ? "The file is larger than 10 MB." : "Upload failed." });
  }
  if (err?.message === "Only PDF and image files are allowed") return res.status(400).json({ error: err.message });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
  if (err?.type === "entity.too.large") return res.status(413).json({ error: "Request too large." });
  console.error(`[error] ${req.method} ${req.path}:`, err?.stack ?? err);
  res.status(500).json({ error: "Server error" });
});

process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
process.on("uncaughtException", (err) => console.error("[uncaughtException]", err));

const server = app.listen(port, () => {
  console.log(`${BRAND_NAME} API on port ${port} (${IS_PRIVATE ? "private instance" : "SaaS"})`);
});

// Let in-flight requests finish when the platform restarts the service.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`[shutdown] ${signal} received`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
