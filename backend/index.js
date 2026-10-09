import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import cron from "node-cron";
import prisma from "./lib/prisma.js";
import { signToken, requireAuth } from "./lib/auth.js";
import {
  CURRENCIES,
  DOCUMENT_TYPES,
  DRIVER_STATUSES,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  VERTICALS,
  documentTypeLabel,
  expiryStatus,
  oneOf,
} from "./lib/expiry.js";
import { captureSnapshot, countStatuses, getAnalytics, healthScore, logEvent } from "./lib/analytics.js";
import { runReminderSweep } from "./lib/reminders.js";
import { sendEmail } from "./lib/email.js";
import { ALLOW_REGISTRATION, BRAND_NAME, IS_PRIVATE } from "./lib/brand.js";
import jwt from "jsonwebtoken";
import {
  escapeHtml,
  parseFloatOrNull,
  parseIntOrNull,
  rateLimit,
  safeEqual,
  securityHeaders,
} from "./lib/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".png", ".jpg", ".jpeg", ".webp"].includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed"));
  },
});

/** Delete an uploaded file from disk (best effort, never throws). */
function removeUpload(name) {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return;
  fs.promises.unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

const app = express();
const port = process.env.PORT || 3001;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(securityHeaders);

if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
  console.warn("[security] FRONTEND_URL is not set: CORS is open to any origin.");
}
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  })
);

// Keep the raw body for webhook signature verification.
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, bucket: "auth" });
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, bucket: "reset" });
const leadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, bucket: "lead" });

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
  res.status(ok ? 200 : 503).json({ ok, checks });
});

// ---------- Auth ----------
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    if (!name || !email || password.length < 8) {
      return res.status(400).json({ error: "Fill all fields. Password min 8 characters." });
    }
    if (IS_PRIVATE && !ALLOW_REGISTRATION && (await prisma.company.count()) > 0) {
      return res.status(403).json({ error: "Registration is closed for this installation." });
    }
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "An account with that email already exists." });

    const company = await prisma.company.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        vertical: oneOf(String(req.body.vertical ?? "trucking"), VERTICALS, "trucking"),
        // Column still exists in the schema; the product is free so the
        // value is never checked anywhere.
        trialEndsAt: new Date(),
      },
    });
    const token = signToken(company);
    return res.status(201).json({
      token,
      company: publicCompany(company),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const company = await prisma.company.findUnique({ where: { email } });
    if (!company || !(await bcrypt.compare(password, company.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    return res.json({ token: signToken(company), company: publicCompany(company) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------- Password reset (stateless signed token, 1h, single use) ----------
// The token is signed with JWT_SECRET + the current password hash, so it stops
// working as soon as the password changes. No extra DB columns needed.
function resetSecret(company) {
  return `${process.env.JWT_SECRET}:${company.passwordHash}`;
}

app.post("/api/auth/forgot", resetLimiter, async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  // Always answer the same way so the endpoint can't be used to find accounts.
  const generic = { ok: true };
  try {
    const company = email ? await prisma.company.findUnique({ where: { email } }) : null;
    if (!company) return res.json(generic);
    const token = jwt.sign({ companyId: company.id, purpose: "reset" }, resetSecret(company), {
      expiresIn: "1h",
    });
    const base = process.env.FRONTEND_URL ?? "http://localhost:3000";
    const link = `${base}/reset-password?token=${encodeURIComponent(token)}&id=${encodeURIComponent(company.id)}`;
    await sendEmail(
      company.email,
      `[${BRAND_NAME}] Reset your password`,
      `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:520px">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>We received a request to reset the password for ${escapeHtml(company.name)}.</p>
        <p><a href="${link}" style="display:inline-block;background:#101820;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Choose a new password</a></p>
        <p style="color:#666;font-size:13px">This link expires in 1 hour. If you didn't ask for it, you can ignore this email.</p>
      </div>`
    );
  } catch (err) {
    console.error("[forgot]", err);
  }
  return res.json(generic);
});

app.post("/api/auth/reset", resetLimiter, async (req, res) => {
  const id = String(req.body.id ?? "");
  const token = String(req.body.token ?? "");
  const password = String(req.body.password ?? "");
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  const company = id ? await prisma.company.findUnique({ where: { id } }) : null;
  const invalid = () => res.status(400).json({ error: "This reset link is invalid or has expired." });
  if (!company) return invalid();
  try {
    const payload = jwt.verify(token, resetSecret(company));
    if (payload.purpose !== "reset" || payload.companyId !== company.id) return invalid();
  } catch {
    return invalid();
  }
  await prisma.company.update({
    where: { id: company.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  return res.json({ token: signToken(company), company: publicCompany(company) });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const company = await prisma.company.findUnique({ where: { id: req.companyId } });
  if (!company) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ company: publicCompany(company) });
});

app.patch("/api/me", requireAuth, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Company name is required." });
  const company = await prisma.company.update({
    where: { id: req.companyId },
    data: {
      name,
      contactName: String(req.body.contactName ?? "").trim() || null,
      phone: String(req.body.phone ?? "").trim() || null,
      country: String(req.body.country ?? "").trim() || null,
      ...(req.body.vertical !== undefined
        ? { vertical: oneOf(String(req.body.vertical), VERTICALS, "trucking") }
        : {}),
    },
  });
  return res.json({ company: publicCompany(company) });
});

app.post("/api/me/password", requireAuth, async (req, res) => {
  const current = String(req.body.current ?? "");
  const next = String(req.body.next ?? "");
  if (next.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters." });
  const company = await prisma.company.findUnique({ where: { id: req.companyId } });
  if (!company || !(await bcrypt.compare(current, company.passwordHash))) {
    return res.status(400).json({ error: "Current password is incorrect." });
  }
  await prisma.company.update({
    where: { id: company.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  return res.json({ ok: true });
});

const FREE_LIMITS = { vehicles: 3, drivers: 3 };
const PAID_STATUSES = ["active", "on_trial", "past_due"];

function isPaid(c) {
  // Private installs are licensed as a whole: no per-account limits.
  return IS_PRIVATE || PAID_STATUSES.includes(c.subscriptionStatus);
}

/** Returns an error payload if the company can't add another vehicle/driver on the free plan. */
async function checkPlanLimit(companyId, kind) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || isPaid(company)) return null;
  const count =
    kind === "vehicles"
      ? await prisma.vehicle.count({ where: { companyId } })
      : await prisma.driver.count({ where: { companyId } });
  if (count < FREE_LIMITS[kind]) return null;
  return {
    code: "plan_limit",
    error: `The free plan includes up to ${FREE_LIMITS[kind]} ${kind}. Upgrade to FleetGuard ($29/month) for unlimited.`,
  };
}

function publicCompany(c) {
  return {
    plan: isPaid(c) ? "pro" : "free",
    limits: isPaid(c) ? null : FREE_LIMITS,
    id: c.id,
    name: c.name,
    email: c.email,
    contactName: c.contactName,
    phone: c.phone,
    country: c.country,
    vertical: c.vertical,
    createdAt: c.createdAt,
  };
}

// ---------- Dashboard / Analytics ----------
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
  res.json({
    counts,
    score: healthScore(counts),
    vehicleCount,
    driverCount,
    documents,
    events,
  });
});

app.get("/api/analytics", requireAuth, async (req, res) => {
  await captureSnapshot(req.companyId);
  res.json(await getAnalytics(req.companyId));
});

// ---------- Vehicles ----------
app.get("/api/vehicles", requireAuth, async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: req.companyId },
    include: {
      documents: { orderBy: { expiresAt: "asc" }, take: 1 },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ vehicles });
});

app.get("/api/vehicles/:id", requireAuth, async (req, res) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
    include: { documents: { orderBy: { expiresAt: "asc" } } },
  });
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  res.json({ vehicle });
});

app.post("/api/vehicles", requireAuth, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const plate = String(req.body.plate ?? "").trim();
  if (!name || !plate) return res.status(400).json({ error: "Name and plate required" });
  const blocked = await checkPlanLimit(req.companyId, "vehicles");
  if (blocked) return res.status(402).json(blocked);
  const vehicle = await prisma.vehicle.create({
    data: {
      companyId: req.companyId,
      name,
      plate,
      type: oneOf(String(req.body.type ?? "truck"), VEHICLE_TYPES, "truck"),
      status: oneOf(String(req.body.status ?? "active"), VEHICLE_STATUSES, "active"),
      make: req.body.make || null,
      model: req.body.model || null,
      year: parseIntOrNull(req.body.year),
      vin: req.body.vin || null,
      odometerKm: parseIntOrNull(req.body.odometerKm),
      notes: req.body.notes || null,
    },
  });
  await logEvent(req.companyId, "vehicle_added", `Added vehicle "${name}"`);
  res.status(201).json({ vehicle });
});

app.patch("/api/vehicles/:id", requireAuth, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const plate = String(req.body.plate ?? "").trim();
  if (!name || !plate) return res.status(400).json({ error: "Name and plate required" });
  const { count } = await prisma.vehicle.updateMany({
    where: { id: req.params.id, companyId: req.companyId },
    data: {
      name,
      plate,
      type: oneOf(String(req.body.type ?? "truck"), VEHICLE_TYPES, "truck"),
      status: oneOf(String(req.body.status ?? "active"), VEHICLE_STATUSES, "active"),
      make: req.body.make || null,
      model: req.body.model || null,
      year: parseIntOrNull(req.body.year),
      vin: req.body.vin || null,
      odometerKm: parseIntOrNull(req.body.odometerKm),
      notes: req.body.notes || null,
    },
  });
  if (!count) return res.status(404).json({ error: "Not found" });
  await logEvent(req.companyId, "vehicle_updated", `Updated vehicle "${name}"`);
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  res.json({ vehicle });
});

app.delete("/api/vehicles/:id", requireAuth, async (req, res) => {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  await prisma.vehicle.delete({ where: { id: vehicle.id } });
  await logEvent(req.companyId, "vehicle_deleted", `Deleted vehicle "${vehicle.name}"`);
  res.json({ ok: true });
});

// ---------- Drivers ----------
app.get("/api/drivers", requireAuth, async (req, res) => {
  const drivers = await prisma.driver.findMany({
    where: { companyId: req.companyId },
    include: {
      documents: { orderBy: { expiresAt: "asc" }, take: 1 },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ drivers });
});

app.get("/api/drivers/:id", requireAuth, async (req, res) => {
  const driver = await prisma.driver.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
    include: { documents: { orderBy: { expiresAt: "asc" } } },
  });
  if (!driver) return res.status(404).json({ error: "Not found" });
  res.json({ driver });
});

app.post("/api/drivers", requireAuth, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Name required" });
  const blocked = await checkPlanLimit(req.companyId, "drivers");
  if (blocked) return res.status(402).json(blocked);
  const driver = await prisma.driver.create({
    data: {
      companyId: req.companyId,
      name,
      status: oneOf(String(req.body.status ?? "active"), DRIVER_STATUSES, "active"),
      email: req.body.email || null,
      phone: req.body.phone || null,
      licenseNumber: req.body.licenseNumber || null,
      licenseClass: req.body.licenseClass || null,
      hiredAt: req.body.hiredAt ? new Date(`${req.body.hiredAt}T12:00:00`) : null,
      birthDate: req.body.birthDate ? new Date(`${req.body.birthDate}T12:00:00`) : null,
      notes: req.body.notes || null,
    },
  });
  await logEvent(req.companyId, "driver_added", `Added driver "${name}"`);
  res.status(201).json({ driver });
});

app.patch("/api/drivers/:id", requireAuth, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Name required" });
  const { count } = await prisma.driver.updateMany({
    where: { id: req.params.id, companyId: req.companyId },
    data: {
      name,
      status: oneOf(String(req.body.status ?? "active"), DRIVER_STATUSES, "active"),
      email: req.body.email || null,
      phone: req.body.phone || null,
      licenseNumber: req.body.licenseNumber || null,
      licenseClass: req.body.licenseClass || null,
      hiredAt: req.body.hiredAt ? new Date(`${req.body.hiredAt}T12:00:00`) : null,
      birthDate: req.body.birthDate ? new Date(`${req.body.birthDate}T12:00:00`) : null,
      notes: req.body.notes || null,
    },
  });
  if (!count) return res.status(404).json({ error: "Not found" });
  await logEvent(req.companyId, "driver_updated", `Updated driver "${name}"`);
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  res.json({ driver });
});

app.delete("/api/drivers/:id", requireAuth, async (req, res) => {
  const driver = await prisma.driver.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
  if (!driver) return res.status(404).json({ error: "Not found" });
  await prisma.driver.delete({ where: { id: driver.id } });
  await logEvent(req.companyId, "driver_deleted", `Deleted driver "${driver.name}"`);
  res.json({ ok: true });
});

// ---------- Documents ----------
app.get("/api/documents", requireAuth, async (req, res) => {
  const { status, type } = req.query;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  let expiresAt = undefined;
  if (status === "expired") expiresAt = { lt: now };
  else if (status === "expiring") expiresAt = { gte: now, lte: windowEnd };
  else if (status === "ok") expiresAt = { gt: windowEnd };

  const documents = await prisma.document.findMany({
    where: {
      companyId: req.companyId,
      ...(expiresAt ? { expiresAt } : {}),
      ...(type && DOCUMENT_TYPES.some((t) => t.value === type) ? { type } : {}),
    },
    include: { vehicle: true, driver: true },
    orderBy: { expiresAt: "asc" },
  });
  res.json({ documents });
});

app.get("/api/documents/:id", requireAuth, async (req, res) => {
  const document = await prisma.document.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
    include: { vehicle: true, driver: true },
  });
  if (!document) return res.status(404).json({ error: "Not found" });
  res.json({ document });
});

app.post("/api/documents", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const title = String(req.body.title ?? "").trim();
    const type = oneOf(String(req.body.type ?? "other"), DOCUMENT_TYPES, "other");
    const expiresAt = req.body.expiresAt ? new Date(`${req.body.expiresAt}T12:00:00`) : null;
    if (!title || !expiresAt || isNaN(expiresAt.getTime())) {
      return res.status(400).json({ error: "Title and expiry date are required." });
    }

    let vehicleId = null;
    let driverId = null;
    const owner = String(req.body.owner ?? "");
    if (owner.startsWith("vehicle:")) {
      const v = await prisma.vehicle.findFirst({
        where: { id: owner.slice(8), companyId: req.companyId },
      });
      if (!v) return res.status(400).json({ error: "Vehicle not found." });
      vehicleId = v.id;
    } else if (owner.startsWith("driver:")) {
      const d = await prisma.driver.findFirst({
        where: { id: owner.slice(7), companyId: req.companyId },
      });
      if (!d) return res.status(400).json({ error: "Driver not found." });
      driverId = d.id;
    }

    const currency = String(req.body.currency ?? "USD").toUpperCase();
    const document = await prisma.document.create({
      data: {
        companyId: req.companyId,
        title,
        type,
        expiresAt,
        issuedAt: req.body.issuedAt ? new Date(`${req.body.issuedAt}T12:00:00`) : null,
        vehicleId,
        driverId,
        referenceNumber: req.body.referenceNumber || null,
        issuer: req.body.issuer || null,
        cost: parseFloatOrNull(req.body.cost),
        currency: CURRENCIES.includes(currency) ? currency : "USD",
        notes: req.body.notes || null,
        fileName: req.file?.filename ?? null,
      },
    });
    await logEvent(req.companyId, "document_created", `Added document "${title}"`);
    res.status(201).json({ document });
  } catch (err) {
    res.status(400).json({ error: err.message || "Upload failed" });
  }
});

app.patch("/api/documents/:id", requireAuth, upload.single("file"), async (req, res) => {
  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const title = String(req.body.title ?? "").trim();
  const expiresAt = req.body.expiresAt ? new Date(`${req.body.expiresAt}T12:00:00`) : null;
  if (!title || !expiresAt) return res.status(400).json({ error: "Title and expiry required" });

  // Ownership must be validated: otherwise a document could be attached to
  // another company's vehicle/driver and leak its data through the includes.
  let vehicleId = null;
  let driverId = null;
  const owner = String(req.body.owner ?? "");
  if (owner.startsWith("vehicle:")) {
    const v = await prisma.vehicle.findFirst({
      where: { id: owner.slice(8), companyId: req.companyId },
    });
    if (!v) return res.status(400).json({ error: "Vehicle not found." });
    vehicleId = v.id;
  } else if (owner.startsWith("driver:")) {
    const d = await prisma.driver.findFirst({
      where: { id: owner.slice(7), companyId: req.companyId },
    });
    if (!d) return res.status(400).json({ error: "Driver not found." });
    driverId = d.id;
  }

  const currency = String(req.body.currency ?? "USD").toUpperCase();
  const document = await prisma.document.update({
    where: { id: existing.id },
    data: {
      title,
      type: oneOf(String(req.body.type ?? existing.type), DOCUMENT_TYPES, "other"),
      expiresAt,
      issuedAt: req.body.issuedAt ? new Date(`${req.body.issuedAt}T12:00:00`) : null,
      vehicleId,
      driverId,
      referenceNumber: req.body.referenceNumber || null,
      issuer: req.body.issuer || null,
      cost: parseFloatOrNull(req.body.cost),
      currency: CURRENCIES.includes(currency) ? currency : "USD",
      notes: req.body.notes || null,
      ...(req.file ? { fileName: req.file.filename } : {}),
      ...(existing.expiresAt.getTime() !== expiresAt.getTime() ? { sentReminders: "" } : {}),
    },
  });
  if (req.file && existing.fileName) removeUpload(existing.fileName);
  await logEvent(req.companyId, "document_updated", `Updated document "${title}"`);
  res.json({ document });
});

app.post("/api/documents/:id/renew", requireAuth, async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
  });
  if (!doc) return res.status(404).json({ error: "Not found" });
  const newExpiry = req.body.expiresAt ? new Date(`${req.body.expiresAt}T12:00:00`) : null;
  if (!newExpiry || isNaN(newExpiry.getTime())) {
    return res.status(400).json({ error: "New expiry date required" });
  }
  const now = Date.now();
  const onTime = now <= doc.expiresAt.getTime();
  const daysDelta = Math.ceil((doc.expiresAt.getTime() - now) / (1000 * 60 * 60 * 24));
  const document = await prisma.document.update({
    where: { id: doc.id },
    data: { expiresAt: newExpiry, sentReminders: "" },
  });
  await logEvent(
    req.companyId,
    "document_renewed",
    onTime
      ? `Renewed "${doc.title}" ${daysDelta} day(s) before expiry`
      : `Renewed "${doc.title}" ${-daysDelta} day(s) late`,
    { onTime, daysDelta }
  );
  res.json({ document });
});

app.delete("/api/documents/:id", requireAuth, async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
  });
  if (!doc) return res.status(404).json({ error: "Not found" });
  await prisma.document.delete({ where: { id: doc.id } });
  if (doc.fileName) removeUpload(doc.fileName);
  await logEvent(req.companyId, "document_deleted", `Deleted document "${doc.title}"`);
  res.json({ ok: true });
});

// CSV export: self-serve data portability (a trust signal and a sales answer).
app.get("/api/export/documents.csv", requireAuth, async (req, res) => {
  const docs = await prisma.document.findMany({
    where: { companyId: req.companyId },
    include: { vehicle: true, driver: true },
    orderBy: { expiresAt: "asc" },
  });
  // Prefix formula-triggering cells so spreadsheets don't execute them.
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const rows = [
    ["Title", "Type", "Belongs to", "Issued", "Expires", "Status", "Reference", "Issuer", "Cost", "Currency", "Notes"],
    ...docs.map((d) => [
      d.title,
      documentTypeLabel(d.type),
      d.vehicle ? `${d.vehicle.name} (${d.vehicle.plate})` : d.driver ? d.driver.name : "Company",
      d.issuedAt ? d.issuedAt.toISOString().slice(0, 10) : "",
      d.expiresAt.toISOString().slice(0, 10),
      expiryStatus(d.expiresAt),
      d.referenceNumber,
      d.issuer,
      d.cost,
      d.currency,
      d.notes,
    ]),
  ];
  res.set({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="fleetguard-documents.csv"',
  });
  res.send("﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n"));
});

app.get("/api/files/:name", requireAuth, (req, res) => {
  const name = req.params.name;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return res.status(400).json({ error: "Invalid file" });
  }
  const filePath = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  // Ensure the file belongs to this company
  prisma.document
    .findFirst({ where: { fileName: name, companyId: req.companyId } })
    .then((doc) => {
      if (!doc) return res.status(404).json({ error: "Not found" });
      res.sendFile(filePath);
    });
});

app.get("/api/meta", (_req, res) => {
  res.json({
    documentTypes: DOCUMENT_TYPES,
    vehicleTypes: VEHICLE_TYPES,
    vehicleStatuses: VEHICLE_STATUSES,
    driverStatuses: DRIVER_STATUSES,
    currencies: CURRENCIES,
  });
});

// ---------- Leads (free tools on the marketing site) ----------
app.post("/api/leads", leadLimiter, async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return res.status(400).json({ error: "Please enter a valid email." });
  }
  const source = String(req.body.source ?? "web").slice(0, 60);
  const usdot = String(req.body.usdot ?? "").replace(/\D/g, "").slice(0, 10) || null;
  try {
    await prisma.lead.upsert({
      where: { email },
      update: { source, usdot },
      create: { email, source, usdot },
    });
  } catch (err) {
    console.error("[lead] could not store lead:", err);
  }
  if (process.env.CONTACT_TO_EMAIL) {
    sendEmail(
      process.env.CONTACT_TO_EMAIL,
      `[FleetGuard lead] ${email}`,
      `<p>New lead from <strong>${escapeHtml(source)}</strong>: ${escapeHtml(email)}${usdot ? ` (USDOT ${escapeHtml(usdot)})` : ""}</p>`
    ).catch(() => {});
  }
  res.status(201).json({ ok: true });
});

// ---------- Billing (Lemon Squeezy webhook) ----------
// Configure the webhook in Lemon Squeezy pointing to POST /api/billing/webhook
// and set LEMONSQUEEZY_WEBHOOK_SECRET to the signing secret you chose there.
app.post("/api/billing/webhook", async (req, res) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "Webhook not configured" });
  const signature = String(req.headers["x-signature"] ?? "");
  const expected = crypto.createHmac("sha256", secret).update(req.rawBody ?? "").digest("hex");
  if (!signature || !safeEqual(signature, expected)) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  try {
    const event = req.body?.meta?.event_name ?? "";
    const attrs = req.body?.data?.attributes ?? {};
    const email = String(attrs.user_email ?? "").toLowerCase();
    if (event.startsWith("subscription_") && email) {
      const status = String(attrs.status ?? "active"); // active, on_trial, past_due, cancelled, expired...
      await prisma.company.updateMany({
        where: { email },
        data: {
          subscriptionStatus: status,
          lsCustomerId: attrs.customer_id ? String(attrs.customer_id) : undefined,
          lsSubscriptionId: req.body?.data?.id ? String(req.body.data.id) : undefined,
        },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[billing]", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

app.post("/api/cron/reminders", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const auth = String(req.headers.authorization ?? "");
  // Fail closed: without a secret anyone could trigger a sweep (email spam).
  if (!secret) return res.status(503).send("CRON_SECRET is not configured");
  if (!safeEqual(auth, `Bearer ${secret}`)) return res.status(401).send("Unauthorized");
  const result = await runReminderSweep();
  res.json({ ok: true, ...result });
});

if (process.env.ENABLE_INTERNAL_CRON === "1") {
  cron.schedule("0 8 * * *", async () => {
    try {
      const { sent } = await runReminderSweep();
      console.log(`[cron] Reminder sweep done, ${sent} email(s) sent`);
    } catch (err) {
      console.error("[cron] Reminder sweep failed:", err);
    }
  });
  console.log("[cron] Internal reminder cron scheduled (daily 08:00)");
}

app.listen(port, () => {
  console.log(`${BRAND_NAME} API on port ${port} (${IS_PRIVATE ? "private instance" : "SaaS"})`);
});
