import fs from "fs";
import path from "path";
import { requireWrite } from "../lib/auth.js";
import {
  CURRENCIES,
  DOCUMENT_TYPES,
  DRIVER_STATUSES,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  documentTypeLabel,
  expiryStatus,
  oneOf,
} from "../lib/expiry.js";
import { parseFloatOrNull, parseIntOrNull } from "../lib/security.js";
import { checkPlanLimit } from "../lib/company.js";
import { toCsv } from "../lib/csv.js";

const dateOrNull = (value) => {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const vehicleData = (body) => ({
  type: oneOf(String(body.type ?? "truck"), VEHICLE_TYPES, "truck"),
  status: oneOf(String(body.status ?? "active"), VEHICLE_STATUSES, "active"),
  make: body.make || null,
  model: body.model || null,
  year: parseIntOrNull(body.year),
  vin: body.vin || null,
  odometerKm: parseIntOrNull(body.odometerKm),
  notes: body.notes || null,
});

const driverData = (body) => ({
  status: oneOf(String(body.status ?? "active"), DRIVER_STATUSES, "active"),
  email: body.email || null,
  phone: body.phone || null,
  licenseNumber: body.licenseNumber || null,
  licenseClass: body.licenseClass || null,
  hiredAt: dateOrNull(body.hiredAt),
  birthDate: dateOrNull(body.birthDate),
  notes: body.notes || null,
});

/**
 * Vehicles, drivers, documents, files and CSV export. Everything is scoped to
 * `req.companyId`, and anything that changes data requires a non-viewer role.
 */
export function registerDataRoutes(app, { prisma, requireAuth, upload, uploadDir, logEvent }) {
  /** Delete an uploaded file from disk (best effort, never throws). */
  const removeUpload = (name) => {
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return;
    fs.promises.unlink(path.join(uploadDir, name)).catch(() => {});
  };

  /**
   * Resolve "vehicle:<id>" / "driver:<id>" to an id that belongs to this
   * company. Without this check a document could be attached to another
   * company's vehicle or driver and leak its data through the includes.
   */
  async function resolveOwner(companyId, owner) {
    if (owner.startsWith("vehicle:")) {
      const v = await prisma.vehicle.findFirst({ where: { id: owner.slice(8), companyId } });
      return v ? { vehicleId: v.id, driverId: null } : { error: "Vehicle not found." };
    }
    if (owner.startsWith("driver:")) {
      const d = await prisma.driver.findFirst({ where: { id: owner.slice(7), companyId } });
      return d ? { vehicleId: null, driverId: d.id } : { error: "Driver not found." };
    }
    return { vehicleId: null, driverId: null };
  }

  // ---------- Vehicles ----------
  app.get("/api/vehicles", requireAuth, async (req, res) => {
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId: req.companyId },
      include: { documents: { orderBy: { expiresAt: "asc" }, take: 1 }, _count: { select: { documents: true } } },
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

  app.post("/api/vehicles", requireAuth, requireWrite, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    const plate = String(req.body.plate ?? "").trim();
    if (!name || !plate) return res.status(400).json({ error: "Name and plate required" });
    const blocked = await checkPlanLimit(prisma, req.companyId, "vehicles");
    if (blocked) return res.status(402).json(blocked);
    const vehicle = await prisma.vehicle.create({ data: { companyId: req.companyId, name, plate, ...vehicleData(req.body) } });
    await logEvent(req, "vehicle_added", `Added vehicle "${name}"`);
    res.status(201).json({ vehicle });
  });

  app.patch("/api/vehicles/:id", requireAuth, requireWrite, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    const plate = String(req.body.plate ?? "").trim();
    if (!name || !plate) return res.status(400).json({ error: "Name and plate required" });
    const { count } = await prisma.vehicle.updateMany({
      where: { id: req.params.id, companyId: req.companyId },
      data: { name, plate, ...vehicleData(req.body) },
    });
    if (!count) return res.status(404).json({ error: "Not found" });
    await logEvent(req, "vehicle_updated", `Updated vehicle "${name}"`);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    res.json({ vehicle });
  });

  app.delete("/api/vehicles/:id", requireAuth, requireWrite, async (req, res) => {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!vehicle) return res.status(404).json({ error: "Not found" });
    const files = await prisma.document.findMany({ where: { vehicleId: vehicle.id, fileName: { not: null } }, select: { fileName: true } });
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    files.forEach((f) => removeUpload(f.fileName));
    await logEvent(req, "vehicle_deleted", `Deleted vehicle "${vehicle.name}"`);
    res.json({ ok: true });
  });

  // ---------- Drivers ----------
  app.get("/api/drivers", requireAuth, async (req, res) => {
    const drivers = await prisma.driver.findMany({
      where: { companyId: req.companyId },
      include: { documents: { orderBy: { expiresAt: "asc" }, take: 1 }, _count: { select: { documents: true } } },
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

  app.post("/api/drivers", requireAuth, requireWrite, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "Name required" });
    const blocked = await checkPlanLimit(prisma, req.companyId, "drivers");
    if (blocked) return res.status(402).json(blocked);
    const driver = await prisma.driver.create({ data: { companyId: req.companyId, name, ...driverData(req.body) } });
    await logEvent(req, "driver_added", `Added driver "${name}"`);
    res.status(201).json({ driver });
  });

  app.patch("/api/drivers/:id", requireAuth, requireWrite, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "Name required" });
    const { count } = await prisma.driver.updateMany({
      where: { id: req.params.id, companyId: req.companyId },
      data: { name, ...driverData(req.body) },
    });
    if (!count) return res.status(404).json({ error: "Not found" });
    await logEvent(req, "driver_updated", `Updated driver "${name}"`);
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    res.json({ driver });
  });

  app.delete("/api/drivers/:id", requireAuth, requireWrite, async (req, res) => {
    const driver = await prisma.driver.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!driver) return res.status(404).json({ error: "Not found" });
    const files = await prisma.document.findMany({ where: { driverId: driver.id, fileName: { not: null } }, select: { fileName: true } });
    await prisma.driver.delete({ where: { id: driver.id } });
    files.forEach((f) => removeUpload(f.fileName));
    await logEvent(req, "driver_deleted", `Deleted driver "${driver.name}"`);
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

  app.post("/api/documents", requireAuth, requireWrite, upload.single("file"), async (req, res) => {
    const discard = () => req.file && removeUpload(req.file.filename);
    try {
      const title = String(req.body.title ?? "").trim();
      const type = oneOf(String(req.body.type ?? "other"), DOCUMENT_TYPES, "other");
      const expiresAt = dateOrNull(req.body.expiresAt);
      if (!title || !expiresAt) {
        discard();
        return res.status(400).json({ error: "Title and expiry date are required." });
      }
      const owner = await resolveOwner(req.companyId, String(req.body.owner ?? ""));
      if (owner.error) {
        discard();
        return res.status(400).json({ error: owner.error });
      }

      const currency = String(req.body.currency ?? "USD").toUpperCase();
      const document = await prisma.document.create({
        data: {
          companyId: req.companyId,
          title,
          type,
          expiresAt,
          issuedAt: dateOrNull(req.body.issuedAt),
          vehicleId: owner.vehicleId,
          driverId: owner.driverId,
          referenceNumber: req.body.referenceNumber || null,
          issuer: req.body.issuer || null,
          cost: parseFloatOrNull(req.body.cost),
          currency: CURRENCIES.includes(currency) ? currency : "USD",
          notes: req.body.notes || null,
          fileName: req.file?.filename ?? null,
        },
      });
      await logEvent(req, "document_created", `Added document "${title}"`);
      res.status(201).json({ document });
    } catch (err) {
      discard();
      console.error("[documents:create]", err?.message ?? err);
      res.status(400).json({ error: "Upload failed" });
    }
  });

  app.patch("/api/documents/:id", requireAuth, requireWrite, upload.single("file"), async (req, res) => {
    const discard = () => req.file && removeUpload(req.file.filename);
    const existing = await prisma.document.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!existing) {
      discard();
      return res.status(404).json({ error: "Not found" });
    }

    const title = String(req.body.title ?? "").trim();
    const expiresAt = dateOrNull(req.body.expiresAt);
    if (!title || !expiresAt) {
      discard();
      return res.status(400).json({ error: "Title and expiry required" });
    }
    const owner = await resolveOwner(req.companyId, String(req.body.owner ?? ""));
    if (owner.error) {
      discard();
      return res.status(400).json({ error: owner.error });
    }

    const currency = String(req.body.currency ?? "USD").toUpperCase();
    const document = await prisma.document.update({
      where: { id: existing.id },
      data: {
        title,
        type: oneOf(String(req.body.type ?? existing.type), DOCUMENT_TYPES, "other"),
        expiresAt,
        issuedAt: dateOrNull(req.body.issuedAt),
        vehicleId: owner.vehicleId,
        driverId: owner.driverId,
        referenceNumber: req.body.referenceNumber || null,
        issuer: req.body.issuer || null,
        cost: parseFloatOrNull(req.body.cost),
        currency: CURRENCIES.includes(currency) ? currency : "USD",
        notes: req.body.notes || null,
        ...(req.file ? { fileName: req.file.filename } : {}),
        // A new expiry date restarts the reminder cycle.
        ...(existing.expiresAt.getTime() !== expiresAt.getTime() ? { sentReminders: "" } : {}),
      },
    });
    if (req.file && existing.fileName) removeUpload(existing.fileName);
    await logEvent(req, "document_updated", `Updated document "${title}"`);
    res.json({ document });
  });

  app.post("/api/documents/:id/renew", requireAuth, requireWrite, async (req, res) => {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!doc) return res.status(404).json({ error: "Not found" });
    const newExpiry = dateOrNull(req.body.expiresAt);
    if (!newExpiry) return res.status(400).json({ error: "New expiry date required" });
    const now = Date.now();
    const onTime = now <= doc.expiresAt.getTime();
    const daysDelta = Math.ceil((doc.expiresAt.getTime() - now) / (1000 * 60 * 60 * 24));
    const document = await prisma.document.update({ where: { id: doc.id }, data: { expiresAt: newExpiry, sentReminders: "" } });
    await logEvent(
      req,
      "document_renewed",
      onTime ? `Renewed "${doc.title}" ${daysDelta} day(s) before expiry` : `Renewed "${doc.title}" ${-daysDelta} day(s) late`,
      { onTime, daysDelta }
    );
    res.json({ document });
  });

  app.delete("/api/documents/:id", requireAuth, requireWrite, async (req, res) => {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!doc) return res.status(404).json({ error: "Not found" });
    await prisma.document.delete({ where: { id: doc.id } });
    if (doc.fileName) removeUpload(doc.fileName);
    await logEvent(req, "document_deleted", `Deleted document "${doc.title}"`);
    res.json({ ok: true });
  });

  // CSV export: self-serve data portability (a trust signal and a sales answer).
  app.get("/api/export/documents.csv", requireAuth, async (req, res) => {
    const docs = await prisma.document.findMany({
      where: { companyId: req.companyId },
      include: { vehicle: true, driver: true },
      orderBy: { expiresAt: "asc" },
    });
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
    res.send(toCsv(rows));
  });

  app.get("/api/files/:name", requireAuth, async (req, res) => {
    const name = req.params.name;
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return res.status(400).json({ error: "Invalid file" });
    }
    // The file must belong to a document of this company.
    const doc = await prisma.document.findFirst({ where: { fileName: name, companyId: req.companyId } });
    const filePath = path.join(uploadDir, name);
    if (!doc || !fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    res.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.sendFile(path.resolve(filePath));
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
}
