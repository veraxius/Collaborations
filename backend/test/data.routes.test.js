import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

process.env.JWT_SECRET = "test-secret-for-unit-tests";
process.env.FRONTEND_URL = "https://app.example.com";
delete process.env.RESEND_API_KEY; // accounts start verified, no real email

const { createFakePrisma } = await import("./helpers/fakePrisma.js");
const { registerAccountRoutes } = await import("../routes/account.js");
const { registerDataRoutes } = await import("../routes/data.js");
const { makeRequireAuth } = await import("../lib/auth.js");

const prisma = createFakePrisma();
const events = [];
const mails = [];
const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "fg-test-"));
const passthrough = (_req, _res, next) => next();

let server;
let base;

before(async () => {
  const app = express();
  app.use(express.json());
  const requireAuth = makeRequireAuth(prisma);
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_r, _f, cb) => cb(null, uploadDir),
      filename: (_r, f, cb) => cb(null, `${crypto.randomUUID()}${path.extname(f.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_r, f, cb) => {
      if ([".pdf", ".png", ".jpg", ".jpeg", ".webp"].includes(path.extname(f.originalname).toLowerCase())) cb(null, true);
      else cb(new Error("Only PDF and image files are allowed"));
    },
  });
  registerAccountRoutes(app, {
    prisma,
    requireAuth,
    limiters: { auth: passthrough, reset: passthrough, dot: passthrough },
    uploadDir,
    mail: async (to, subject, html) => { mails.push({ to, subject, html }); },
  });
  registerDataRoutes(app, {
    prisma,
    requireAuth,
    upload,
    uploadDir,
    logEvent: async (ctx, kind, label, extra = {}) => { events.push({ actor: ctx.email, companyId: ctx.companyId, kind, label, ...extra }); },
  });
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: "Upload failed." });
    if (err?.message === "Only PDF and image files are allowed") return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Server error" });
  });
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(uploadDir, { recursive: true, force: true });
});

async function call(method, route, { token, body, form } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(base + route, { method, headers, body: form ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const type = res.headers.get("content-type") ?? "";
  const payload = type.includes("json") ? await res.json().catch(() => null) : await res.text();
  return { status: res.status, body: payload, headers: res.headers };
}

let counter = 0;
async function newCompany({ paid = false } = {}) {
  const email = `owner${++counter}@fleet.com`;
  const r = await call("POST", "/api/auth/register", { body: { name: `Fleet ${counter}`, email, password: "correct horse" } });
  assert.equal(r.status, 201);
  if (paid) await prisma.company.update({ where: { id: r.body.company.id }, data: { subscriptionStatus: "active" } });
  return { token: r.body.token, id: r.body.company.id, email };
}

async function newMember(owner, role) {
  const email = `member${++counter}@fleet.com`;
  await call("POST", "/api/team", { token: owner.token, body: { email, name: "Mia", role } });
  const mail = [...mails].reverse().find((m) => m.to === email);
  const link = new URL(/href="([^"]+)"/.exec(mail.html)[1].replace(/&amp;/g, "&"));
  const r = await call("POST", "/api/auth/accept-invite", { body: { id: link.searchParams.get("id"), token: link.searchParams.get("token"), password: "member password" } });
  assert.equal(r.status, 200);
  return r.body.token;
}

const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

function docForm(fields, file) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  if (file) fd.append("file", new Blob([file.content], { type: "application/octet-stream" }), file.name);
  return fd;
}

const uploads = () => fs.readdirSync(uploadDir);

test("vehicles: create, list and fetch only your own", async () => {
  const a = await newCompany({ paid: true });
  const b = await newCompany({ paid: true });
  assert.equal((await call("POST", "/api/vehicles", { token: a.token, body: { name: "Truck 1" } })).status, 400, "plate required");
  const created = await call("POST", "/api/vehicles", { token: a.token, body: { name: "Truck 1", plate: "ABC123", year: "2020", odometerKm: "abc", type: "hacker" } });
  assert.equal(created.status, 201);
  assert.equal(created.body.vehicle.type, "truck", "unknown type falls back");
  assert.equal(created.body.vehicle.odometerKm, null, "garbage numbers become null");
  assert.equal(created.body.vehicle.year, 2020);
  const id = created.body.vehicle.id;

  assert.equal((await call("GET", `/api/vehicles/${id}`, { token: a.token })).status, 200);
  assert.equal((await call("GET", `/api/vehicles/${id}`, { token: b.token })).status, 404, "other company cannot read it");
  assert.equal((await call("GET", "/api/vehicles", { token: b.token })).body.vehicles.length, 0);
  assert.equal((await call("PATCH", `/api/vehicles/${id}`, { token: b.token, body: { name: "Hijack", plate: "X" } })).status, 404);
  assert.equal((await call("DELETE", `/api/vehicles/${id}`, { token: b.token })).status, 404);
  assert.equal((await call("GET", `/api/vehicles/${id}`, { token: a.token })).body.vehicle.name, "Truck 1", "untouched");
});

test("the activity log records who did it", async () => {
  const a = await newCompany();
  await call("POST", "/api/vehicles", { token: a.token, body: { name: "Logged", plate: "L1" } });
  const event = events.find((e) => e.kind === "vehicle_added" && e.actor === a.email);
  assert.ok(event, "vehicle_added with the actor email");
  assert.equal(event.companyId, a.id);
});

test("free plan: 3 vehicles and 3 drivers, then a clear upgrade message", async () => {
  const free = await newCompany();
  for (let i = 1; i <= 3; i++) {
    assert.equal((await call("POST", "/api/vehicles", { token: free.token, body: { name: `V${i}`, plate: `P${i}` } })).status, 201);
    assert.equal((await call("POST", "/api/drivers", { token: free.token, body: { name: `D${i}` } })).status, 201);
  }
  const v = await call("POST", "/api/vehicles", { token: free.token, body: { name: "V4", plate: "P4" } });
  assert.equal(v.status, 402);
  assert.equal(v.body.code, "plan_limit");
  assert.match(v.body.error, /Upgrade/);
  assert.equal((await call("POST", "/api/drivers", { token: free.token, body: { name: "D4" } })).status, 402);

  const paid = await newCompany({ paid: true });
  for (let i = 1; i <= 5; i++) assert.equal((await call("POST", "/api/vehicles", { token: paid.token, body: { name: `V${i}`, plate: `Q${i}` } })).status, 201);
});

test("viewers can read everything but change nothing", async () => {
  const owner = await newCompany({ paid: true });
  const viewer = await newMember(owner, "viewer");
  const veh = (await call("POST", "/api/vehicles", { token: owner.token, body: { name: "T", plate: "P" } })).body.vehicle;
  const drv = (await call("POST", "/api/drivers", { token: owner.token, body: { name: "D" } })).body.driver;
  const doc = (await call("POST", "/api/documents", { token: owner.token, form: docForm({ title: "Policy", expiresAt: day(40) }) })).body.document;

  for (const route of ["/api/vehicles", `/api/vehicles/${veh.id}`, "/api/drivers", `/api/drivers/${drv.id}`, "/api/documents", `/api/documents/${doc.id}`, "/api/export/documents.csv", "/api/meta"]) {
    assert.equal((await call("GET", route, { token: viewer })).status, 200, `viewer GET ${route}`);
  }
  const writes = [
    ["POST", "/api/vehicles", { body: { name: "X", plate: "X" } }],
    ["PATCH", `/api/vehicles/${veh.id}`, { body: { name: "X", plate: "X" } }],
    ["DELETE", `/api/vehicles/${veh.id}`, {}],
    ["POST", "/api/drivers", { body: { name: "X" } }],
    ["PATCH", `/api/drivers/${drv.id}`, { body: { name: "X" } }],
    ["DELETE", `/api/drivers/${drv.id}`, {}],
    ["POST", "/api/documents", { form: docForm({ title: "X", expiresAt: day(5) }) }],
    ["PATCH", `/api/documents/${doc.id}`, { form: docForm({ title: "X", expiresAt: day(5) }) }],
    ["POST", `/api/documents/${doc.id}/renew`, { body: { expiresAt: day(90) } }],
    ["DELETE", `/api/documents/${doc.id}`, {}],
  ];
  for (const [method, route, opts] of writes) {
    assert.equal((await call(method, route, { token: viewer, ...opts })).status, 403, `viewer ${method} ${route}`);
  }
  assert.equal((await call("GET", `/api/vehicles/${veh.id}`, { token: owner.token })).status, 200, "nothing was deleted");
});

test("managers can write", async () => {
  const owner = await newCompany({ paid: true });
  const manager = await newMember(owner, "manager");
  const r = await call("POST", "/api/vehicles", { token: manager, body: { name: "By manager", plate: "M1" } });
  assert.equal(r.status, 201);
  assert.ok(events.some((e) => e.kind === "vehicle_added" && e.actor.startsWith("member")), "logged with the manager's email");
});

test("drivers: dates are validated and ownership enforced", async () => {
  const a = await newCompany({ paid: true });
  const b = await newCompany({ paid: true });
  const made = await call("POST", "/api/drivers", { token: a.token, body: { name: "Ana", hiredAt: "2020-02-30x", birthDate: "1990-05-01", status: "nonsense" } });
  assert.equal(made.status, 201);
  assert.equal(made.body.driver.hiredAt, null, "bad date ignored");
  assert.equal(made.body.driver.status, "active");
  assert.equal((await call("PATCH", `/api/drivers/${made.body.driver.id}`, { token: b.token, body: { name: "Hijack" } })).status, 404);
  assert.equal((await call("DELETE", `/api/drivers/${made.body.driver.id}`, { token: b.token })).status, 404);
  assert.equal((await call("POST", "/api/drivers", { token: a.token, body: { name: "  " } })).status, 400);
});

test("documents: validation and attaching only to your own vehicles and drivers", async () => {
  const a = await newCompany({ paid: true });
  const b = await newCompany({ paid: true });
  const bVehicle = (await call("POST", "/api/vehicles", { token: b.token, body: { name: "B truck", plate: "B1" } })).body.vehicle;
  const bDriver = (await call("POST", "/api/drivers", { token: b.token, body: { name: "B driver" } })).body.driver;
  const aVehicle = (await call("POST", "/api/vehicles", { token: a.token, body: { name: "A truck", plate: "A1" } })).body.vehicle;

  assert.equal((await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "", expiresAt: day(5) }) })).status, 400);
  assert.equal((await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "No date" }) })).status, 400);
  assert.equal((await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Bad date", expiresAt: "2026-99-99" }) })).status, 400);

  const before = uploads().length;
  const foreignVehicle = await call("POST", "/api/documents", {
    token: a.token,
    form: docForm({ title: "Steal", expiresAt: day(5), owner: `vehicle:${bVehicle.id}` }, { name: "x.pdf", content: "%PDF-1.4" }),
  });
  assert.equal(foreignVehicle.status, 400);
  assert.equal(uploads().length, before, "the uploaded file was discarded");
  assert.equal((await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Steal", expiresAt: day(5), owner: `driver:${bDriver.id}` }) })).status, 400);

  const ok = await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Inspection", type: "inspection", expiresAt: day(60), owner: `vehicle:${aVehicle.id}`, cost: "abc", currency: "zzz" }) });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.document.vehicleId, aVehicle.id);
  assert.equal(ok.body.document.cost, null);
  assert.equal(ok.body.document.currency, "USD");
  assert.equal((await call("GET", `/api/documents/${ok.body.document.id}`, { token: b.token })).status, 404);
});

test("documents: only PDFs and images up to 10 MB are accepted", async () => {
  const a = await newCompany();
  const bad = await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Script", expiresAt: day(5) }, { name: "run.exe", content: "MZ" }) });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /PDF and image/);
  const html = await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Page", expiresAt: day(5) }, { name: "page.html", content: "<script>" }) });
  assert.equal(html.status, 400);
  const big = await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Big", expiresAt: day(5) }, { name: "big.pdf", content: Buffer.alloc(11 * 1024 * 1024) }) });
  assert.equal(big.status, 413);
  const fine = await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Fine", expiresAt: day(5) }, { name: "Scan.PDF", content: "%PDF-1.4" }) });
  assert.equal(fine.status, 201);
  assert.match(fine.body.document.fileName, /^[0-9a-f-]{36}\.pdf$/, "stored under a random name, never the uploaded one");
});

test("files: only the owning company can download, and paths cannot escape", async () => {
  const a = await newCompany();
  const b = await newCompany();
  const doc = (await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Policy", expiresAt: day(30) }, { name: "p.pdf", content: "%PDF-1.4 hello" }) })).body.document;
  const mine = await call("GET", `/api/files/${doc.fileName}`, { token: a.token });
  assert.equal(mine.status, 200);
  assert.match(mine.headers.get("content-security-policy"), /default-src 'none'/);
  assert.equal((await call("GET", `/api/files/${doc.fileName}`, { token: b.token })).status, 404);
  assert.equal((await call("GET", `/api/files/${doc.fileName}`)).status, 401);
  for (const evil of ["..%2F..%2Fetc%2Fpasswd", "%2e%2e%2fsecret", "a%5Cb.pdf"]) {
    const r = await call("GET", `/api/files/${evil}`, { token: a.token });
    assert.ok([400, 404].includes(r.status), `${evil} -> ${r.status}`);
  }
});

test("documents: changing the date restarts reminders, replacing a file removes the old one", async () => {
  const a = await newCompany();
  const created = await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Card", expiresAt: day(10) }, { name: "a.pdf", content: "%PDF-1" }) });
  const doc = created.body.document;
  await prisma.document.update({ where: { id: doc.id }, data: { sentReminders: "15,7" } });

  const same = await call("PATCH", `/api/documents/${doc.id}`, { token: a.token, form: docForm({ title: "Card v2", expiresAt: doc.expiresAt.slice(0, 10) }) });
  assert.equal(same.status, 200);
  assert.equal((await prisma.document.findUnique({ where: { id: doc.id } })).sentReminders, "15,7", "same date keeps history");

  const oldFile = doc.fileName;
  const moved = await call("PATCH", `/api/documents/${doc.id}`, { token: a.token, form: docForm({ title: "Card v2", expiresAt: day(400) }, { name: "b.pdf", content: "%PDF-2" }) });
  assert.equal(moved.status, 200);
  assert.equal((await prisma.document.findUnique({ where: { id: doc.id } })).sentReminders, "", "new date restarts reminders");
  await new Promise((r) => setTimeout(r, 100)); // the old file is removed in the background
  assert.ok(!uploads().includes(oldFile), "old file deleted");
  assert.ok(uploads().includes(moved.body.document.fileName), "new file kept");

  const b = await newCompany();
  assert.equal((await call("PATCH", `/api/documents/${doc.id}`, { token: b.token, form: docForm({ title: "x", expiresAt: day(5) }) })).status, 404);
});

test("renewing records on-time and late renewals and clears reminder history", async () => {
  const a = await newCompany();
  const early = (await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Early", expiresAt: day(10) }) })).body.document;
  const late = (await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Late", expiresAt: day(-4) }) })).body.document;
  await prisma.document.update({ where: { id: early.id }, data: { sentReminders: "15" } });

  assert.equal((await call("POST", `/api/documents/${early.id}/renew`, { token: a.token, body: { expiresAt: "nope" } })).status, 400);
  const r1 = await call("POST", `/api/documents/${early.id}/renew`, { token: a.token, body: { expiresAt: day(375) } });
  assert.equal(r1.status, 200);
  assert.equal((await prisma.document.findUnique({ where: { id: early.id } })).sentReminders, "");
  const e1 = events.filter((e) => e.kind === "document_renewed").at(-1);
  assert.equal(e1.onTime, true);
  assert.ok(e1.daysDelta >= 9);

  await call("POST", `/api/documents/${late.id}/renew`, { token: a.token, body: { expiresAt: day(300) } });
  const e2 = events.filter((e) => e.kind === "document_renewed").at(-1);
  assert.equal(e2.onTime, false);
  assert.match(e2.label, /late/);

  const b = await newCompany();
  assert.equal((await call("POST", `/api/documents/${early.id}/renew`, { token: b.token, body: { expiresAt: day(30) } })).status, 404);
});

test("deleting a document, vehicle or driver removes their uploaded files", async () => {
  const a = await newCompany({ paid: true });
  const vehicle = (await call("POST", "/api/vehicles", { token: a.token, body: { name: "T", plate: "P" } })).body.vehicle;
  const direct = (await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "D1", expiresAt: day(30) }, { name: "1.pdf", content: "%PDF" }) })).body.document;
  const viaVehicle = (await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "D2", expiresAt: day(30), owner: `vehicle:${vehicle.id}` }, { name: "2.pdf", content: "%PDF" }) })).body.document;
  assert.ok(uploads().includes(direct.fileName) && uploads().includes(viaVehicle.fileName));

  assert.equal((await call("DELETE", `/api/documents/${direct.id}`, { token: a.token })).status, 200);
  assert.ok(!uploads().includes(direct.fileName));

  assert.equal((await call("DELETE", `/api/vehicles/${vehicle.id}`, { token: a.token })).status, 200);
  // allow the best-effort unlink to finish
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(!uploads().includes(viaVehicle.fileName), "the vehicle's documents' files are removed too");
  assert.equal(await prisma.document.findUnique({ where: { id: viaVehicle.id } }), null);
});

test("documents can be filtered by status and type", async () => {
  const a = await newCompany();
  await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Expired", type: "insurance", expiresAt: day(-5) }) });
  await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Soon", type: "inspection", expiresAt: day(10) }) });
  await call("POST", "/api/documents", { token: a.token, form: docForm({ title: "Fine", type: "insurance", expiresAt: day(200) }) });
  const titles = async (qs) => (await call("GET", `/api/documents${qs}`, { token: a.token })).body.documents.map((d) => d.title).sort();
  assert.deepEqual(await titles(""), ["Expired", "Fine", "Soon"]);
  assert.deepEqual(await titles("?status=expired"), ["Expired"]);
  assert.deepEqual(await titles("?status=expiring"), ["Soon"]);
  assert.deepEqual(await titles("?status=ok"), ["Fine"]);
  assert.deepEqual(await titles("?type=insurance"), ["Expired", "Fine"]);
  assert.deepEqual(await titles("?type=not-a-type"), ["Expired", "Fine", "Soon"], "unknown type is ignored");
});

test("CSV export contains only your documents and neutralizes formulas", async () => {
  const a = await newCompany();
  const b = await newCompany();
  await call("POST", "/api/documents", { token: a.token, form: docForm({ title: '=HYPERLINK("http://evil")', expiresAt: day(20), notes: 'He said "hi", ok' }) });
  await call("POST", "/api/documents", { token: b.token, form: docForm({ title: "Other company secret", expiresAt: day(20) }) });
  const r = await call("GET", "/api/export/documents.csv", { token: a.token });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /text\/csv/);
  assert.match(r.headers.get("content-disposition"), /attachment/);
  // fetch().text() drops a leading BOM, so read the raw bytes: Excel needs it to show accents correctly.
  const raw = Buffer.from(await (await fetch(base + "/api/export/documents.csv", { headers: { Authorization: `Bearer ${a.token}` } })).arrayBuffer());
  assert.deepEqual([...raw.subarray(0, 3)], [0xef, 0xbb, 0xbf], "UTF-8 byte order mark");
  assert.ok(r.body.startsWith('"Title"'));
  assert.ok(r.body.includes(`"'=HYPERLINK(""http://evil"")"`), "formula prefixed with an apostrophe");
  assert.ok(r.body.includes('"He said ""hi"", ok"'));
  assert.ok(!r.body.includes("Other company secret"));
});

test("unauthenticated requests never reach the data", async () => {
  for (const [method, route] of [["GET", "/api/vehicles"], ["GET", "/api/drivers"], ["GET", "/api/documents"], ["POST", "/api/vehicles"], ["GET", "/api/export/documents.csv"]]) {
    assert.equal((await call(method, route)).status, 401, `${method} ${route}`);
  }
});
