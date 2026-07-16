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
import { signToken, requireAuth, hasAccess } from "./lib/auth.js";
import {
  CURRENCIES,
  DOCUMENT_TYPES,
  DRIVER_STATUSES,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  expiryStatus,
  oneOf,
} from "./lib/expiry.js";
import { captureSnapshot, countStatuses, getAnalytics, healthScore, logEvent } from "./lib/analytics.js";
import { runReminderSweep } from "./lib/reminders.js";
import {
  buildCheckoutUrl,
  getCustomerPortalUrl,
  isLemonConfigured,
  verifyWebhookSignature,
} from "./lib/lemonsqueezy.js";

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

const app = express();
const port = process.env.PORT || 3001;
const TRIAL_DAYS = 14;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  })
);

// Lemon webhook needs raw body — mount before json parser
app.post("/api/lemonsqueezy/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const rawBody = req.body.toString("utf8");
    if (!verifyWebhookSignature(rawBody, req.headers["x-signature"])) {
      return res.status(401).send("Invalid signature");
    }
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name ?? "";
    if (!eventName.startsWith("subscription_") || eventName.startsWith("subscription_payment_")) {
      return res.json({ received: true });
    }

    const STATUS_MAP = {
      active: "active",
      on_trial: "active",
      cancelled: "active",
      past_due: "past_due",
      unpaid: "canceled",
      expired: "canceled",
      paused: "canceled",
    };

    const companyId = payload.meta?.custom_data?.company_id;
    const subscriptionId = String(payload.data?.id ?? "");
    const customerId = String(payload.data?.attributes?.customer_id ?? "");
    const status = payload.data?.attributes?.status ?? "";
    const data = {
      subscriptionStatus: STATUS_MAP[status] ?? "canceled",
      lsSubscriptionId: subscriptionId || undefined,
      lsCustomerId: customerId || undefined,
    };

    if (companyId) await prisma.company.updateMany({ where: { id: companyId }, data });
    else if (subscriptionId) {
      await prisma.company.updateMany({ where: { lsSubscriptionId: subscriptionId }, data });
    }
    return res.json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    return res.status(200).json({ received: true });
  }
});

app.use(express.json());

app.get("/", (_req, res) => res.send("FleetGuard API"));

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
app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    if (!name || !email || password.length < 8) {
      return res.status(400).json({ error: "Fill all fields. Password min 8 characters." });
    }
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "An account with that email already exists." });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    const company = await prisma.company.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        trialEndsAt,
      },
    });
    const token = signToken(company);
    return res.status(201).json({
      token,
      company: publicCompany(company),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
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
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  const company = await prisma.company.findUnique({ where: { id: req.companyId } });
  if (!company) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ company: publicCompany(company), access: hasAccess(company) });
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

function publicCompany(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    trialEndsAt: c.trialEndsAt,
    subscriptionStatus: c.subscriptionStatus,
    contactName: c.contactName,
    phone: c.phone,
    country: c.country,
    createdAt: c.createdAt,
    lsSubscriptionId: c.lsSubscriptionId,
  };
}

async function requireActive(req, res, next) {
  const company = await prisma.company.findUnique({ where: { id: req.companyId } });
  if (!company) return res.status(401).json({ error: "Unauthorized" });
  if (!hasAccess(company)) return res.status(402).json({ error: "Trial ended", company: publicCompany(company) });
  req.company = company;
  next();
}

// ---------- Dashboard / Analytics ----------
app.get("/api/dashboard", requireAuth, requireActive, async (req, res) => {
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

app.get("/api/analytics", requireAuth, requireActive, async (req, res) => {
  await captureSnapshot(req.companyId);
  res.json(await getAnalytics(req.companyId));
});

// ---------- Vehicles ----------
app.get("/api/vehicles", requireAuth, requireActive, async (req, res) => {
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

app.get("/api/vehicles/:id", requireAuth, requireActive, async (req, res) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
    include: { documents: { orderBy: { expiresAt: "asc" } } },
  });
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  res.json({ vehicle });
});

app.post("/api/vehicles", requireAuth, requireActive, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const plate = String(req.body.plate ?? "").trim();
  if (!name || !plate) return res.status(400).json({ error: "Name and plate required" });
  const vehicle = await prisma.vehicle.create({
    data: {
      companyId: req.companyId,
      name,
      plate,
      type: oneOf(String(req.body.type ?? "truck"), VEHICLE_TYPES, "truck"),
      status: oneOf(String(req.body.status ?? "active"), VEHICLE_STATUSES, "active"),
      make: req.body.make || null,
      model: req.body.model || null,
      year: req.body.year ? parseInt(req.body.year, 10) : null,
      vin: req.body.vin || null,
      odometerKm: req.body.odometerKm ? parseInt(req.body.odometerKm, 10) : null,
      notes: req.body.notes || null,
    },
  });
  await logEvent(req.companyId, "vehicle_added", `Added vehicle "${name}"`);
  res.status(201).json({ vehicle });
});

app.patch("/api/vehicles/:id", requireAuth, requireActive, async (req, res) => {
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
      year: req.body.year ? parseInt(req.body.year, 10) : null,
      vin: req.body.vin || null,
      odometerKm: req.body.odometerKm ? parseInt(req.body.odometerKm, 10) : null,
      notes: req.body.notes || null,
    },
  });
  if (!count) return res.status(404).json({ error: "Not found" });
  await logEvent(req.companyId, "vehicle_updated", `Updated vehicle "${name}"`);
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  res.json({ vehicle });
});

app.delete("/api/vehicles/:id", requireAuth, requireActive, async (req, res) => {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  await prisma.vehicle.delete({ where: { id: vehicle.id } });
  await logEvent(req.companyId, "vehicle_deleted", `Deleted vehicle "${vehicle.name}"`);
  res.json({ ok: true });
});

// ---------- Drivers ----------
app.get("/api/drivers", requireAuth, requireActive, async (req, res) => {
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

app.get("/api/drivers/:id", requireAuth, requireActive, async (req, res) => {
  const driver = await prisma.driver.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
    include: { documents: { orderBy: { expiresAt: "asc" } } },
  });
  if (!driver) return res.status(404).json({ error: "Not found" });
  res.json({ driver });
});

app.post("/api/drivers", requireAuth, requireActive, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Name required" });
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

app.patch("/api/drivers/:id", requireAuth, requireActive, async (req, res) => {
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

app.delete("/api/drivers/:id", requireAuth, requireActive, async (req, res) => {
  const driver = await prisma.driver.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
  if (!driver) return res.status(404).json({ error: "Not found" });
  await prisma.driver.delete({ where: { id: driver.id } });
  await logEvent(req.companyId, "driver_deleted", `Deleted driver "${driver.name}"`);
  res.json({ ok: true });
});

// ---------- Documents ----------
app.get("/api/documents", requireAuth, requireActive, async (req, res) => {
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

app.get("/api/documents/:id", requireAuth, requireActive, async (req, res) => {
  const document = await prisma.document.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
    include: { vehicle: true, driver: true },
  });
  if (!document) return res.status(404).json({ error: "Not found" });
  res.json({ document });
});

app.post("/api/documents", requireAuth, requireActive, upload.single("file"), async (req, res) => {
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
        cost: req.body.cost ? parseFloat(req.body.cost) : null,
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

app.patch("/api/documents/:id", requireAuth, requireActive, upload.single("file"), async (req, res) => {
  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const title = String(req.body.title ?? "").trim();
  const expiresAt = req.body.expiresAt ? new Date(`${req.body.expiresAt}T12:00:00`) : null;
  if (!title || !expiresAt) return res.status(400).json({ error: "Title and expiry required" });

  let vehicleId = null;
  let driverId = null;
  const owner = String(req.body.owner ?? "");
  if (owner.startsWith("vehicle:")) vehicleId = owner.slice(8);
  else if (owner.startsWith("driver:")) driverId = owner.slice(7);

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
      cost: req.body.cost ? parseFloat(req.body.cost) : null,
      currency: CURRENCIES.includes(currency) ? currency : "USD",
      notes: req.body.notes || null,
      ...(req.file ? { fileName: req.file.filename } : {}),
      ...(existing.expiresAt.getTime() !== expiresAt.getTime() ? { sentReminders: "" } : {}),
    },
  });
  await logEvent(req.companyId, "document_updated", `Updated document "${title}"`);
  res.json({ document });
});

app.post("/api/documents/:id/renew", requireAuth, requireActive, async (req, res) => {
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

app.delete("/api/documents/:id", requireAuth, requireActive, async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, companyId: req.companyId },
  });
  if (!doc) return res.status(404).json({ error: "Not found" });
  await prisma.document.delete({ where: { id: doc.id } });
  await logEvent(req.companyId, "document_deleted", `Deleted document "${doc.title}"`);
  res.json({ ok: true });
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

// ---------- Billing ----------
app.get("/api/billing", requireAuth, async (req, res) => {
  const company = await prisma.company.findUnique({ where: { id: req.companyId } });
  res.json({
    company: publicCompany(company),
    access: hasAccess(company),
    lemonConfigured: isLemonConfigured(),
  });
});

app.post("/api/billing/checkout", requireAuth, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    const url = buildCheckoutUrl(company);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/billing/portal", requireAuth, async (req, res) => {
  const company = await prisma.company.findUnique({ where: { id: req.companyId } });
  if (!company?.lsSubscriptionId) return res.status(400).json({ error: "No subscription" });
  const url = await getCustomerPortalUrl(company.lsSubscriptionId);
  if (!url) return res.status(500).json({ error: "Portal unavailable" });
  res.json({ url });
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

app.post("/api/cron/reminders", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization;
  if (secret && auth !== `Bearer ${secret}`) return res.status(401).send("Unauthorized");
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
  console.log(`FleetGuard API on port ${port}`);
});
