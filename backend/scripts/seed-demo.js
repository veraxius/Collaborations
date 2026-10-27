/**
 * Creates (or recreates) a demo company with sample data so every screen can
 * be tried: documents that are expired, expiring and fine, drivers, vehicles,
 * and one account per role. Run it on purpose: `npm run seed:demo`.
 *
 * Passwords are random and are NOT printed: they are written to
 * `demo-accounts.local.txt` (ignored by git). Running it again replaces only
 * the demo company, never anything else.
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../lib/prisma.js";
import { mcs150NextDue } from "../lib/deadlines.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "demo-accounts.local.txt");
const DOMAIN = "fleetguard-demo.test"; // reserved TLD: nothing can ever be delivered here
const OWNER_EMAIL = `owner@${DOMAIN}`;

const password = () => crypto.randomBytes(9).toString("base64url");
const at = (days) => new Date(Date.now() + days * 86400000 + (12 - new Date().getHours()) * 3600000);

async function main() {
  const existing = await prisma.company.findUnique({ where: { email: OWNER_EMAIL } });
  if (existing) {
    await prisma.company.delete({ where: { id: existing.id } }); // cascades to everything that belongs to it
    console.log("Replaced the previous demo company.");
  }
  // Team member emails are unique across the whole database: free them too.
  await prisma.teamMember.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });

  const ownerPw = password();
  const company = await prisma.company.create({
    data: {
      name: "Demo Freight Co",
      email: OWNER_EMAIL,
      passwordHash: await bcrypt.hash(ownerPw, 10),
      trialEndsAt: new Date(),
      contactName: "Demo Owner",
      country: "United States",
      vertical: "trucking",
      usdot: "1234567",
      emailVerified: true,
      subscriptionStatus: "active", // paid plan: nothing is limited, so every feature can be tried
    },
  });

  const [t4, t7, tr11] = await Promise.all([
    prisma.vehicle.create({ data: { companyId: company.id, name: "Truck 04", plate: "7XK-2291", type: "truck", make: "Freightliner", model: "Cascadia", year: 2021 } }),
    prisma.vehicle.create({ data: { companyId: company.id, name: "Truck 07", plate: "4TR-8810", type: "truck", make: "Kenworth", model: "T680", year: 2019 } }),
    prisma.vehicle.create({ data: { companyId: company.id, name: "Trailer 11", plate: "TRL-0342", type: "trailer", make: "Utility", year: 2018 } }),
  ]);
  const [marcus, dana, luis] = await Promise.all([
    prisma.driver.create({ data: { companyId: company.id, name: "Marcus Reyes", email: `marcus@${DOMAIN}`, phone: "(415) 555-0101", licenseNumber: "D1234567", licenseClass: "CDL-A" } }),
    prisma.driver.create({ data: { companyId: company.id, name: "Dana Whitfield", email: `dana@${DOMAIN}`, phone: "(415) 555-0102", licenseNumber: "D7654321", licenseClass: "CDL-A" } }),
    prisma.driver.create({ data: { companyId: company.id, name: "Luis Ortega", email: `luis@${DOMAIN}`, phone: "(415) 555-0103", licenseNumber: "D1122334", licenseClass: "CDL-B" } }),
  ]);

  const doc = (title, type, days, owner = {}, extra = {}) =>
    prisma.document.create({
      data: { companyId: company.id, title, type, expiresAt: at(days), currency: "USD", ...owner, ...extra },
    });

  await doc("Liability insurance policy", "insurance", 23, {}, { issuer: "Sample Insurance Co", referenceNumber: "POL-4411", cost: 1450 });
  await doc("UCR registration", "ucr", 62, {}, { cost: 185 });
  const mcs = mcs150NextDue("1234567");
  if (mcs) await prisma.document.create({ data: { companyId: company.id, title: "MCS-150 biennial update", type: "mcs150", issuer: "FMCSA", expiresAt: new Date(`${mcs}T12:00:00Z`), notes: "Calculated from USDOT 1234567." } });

  await doc("Annual DOT inspection", "inspection", -6, { vehicleId: t4.id });
  await doc("Vehicle registration", "registration", 140, { vehicleId: t4.id }, { cost: 640 });
  await doc("Annual DOT inspection", "inspection", 12, { vehicleId: t7.id });
  await doc("HVUT (Form 2290)", "hvut", 200, { vehicleId: t7.id }, { cost: 550 });
  await doc("Vehicle registration", "registration", 25, { vehicleId: tr11.id });

  await doc("DOT medical card", "medical_card", 7, { driverId: marcus.id });
  await doc("CDL", "license", 311, { driverId: marcus.id });
  await doc("Annual MVR review", "mvr", 48, { driverId: marcus.id });
  await doc("CDL", "license", 520, { driverId: dana.id });
  await doc("DOT medical card", "medical_card", 90, { driverId: dana.id });
  await doc("Clearinghouse annual query", "clearinghouse", -2, { driverId: dana.id });
  await doc("DOT medical card", "medical_card", 4, { driverId: luis.id });

  // Team members, one per role
  const managerPw = password();
  const viewerPw = password();
  await prisma.teamMember.create({ data: { companyId: company.id, email: `manager@${DOMAIN}`, name: "Demo Manager", role: "manager", passwordHash: await bcrypt.hash(managerPw, 10) } });
  await prisma.teamMember.create({ data: { companyId: company.id, email: `viewer@${DOMAIN}`, name: "Demo Viewer", role: "viewer", passwordHash: await bcrypt.hash(viewerPw, 10) } });

  for (const [kind, label, days] of [
    ["document_renewed", 'Renewed "Annual DOT inspection" 11 day(s) before expiry', 0],
    ["document_created", 'Added document "Liability insurance policy"', -1],
    ["driver_added", 'Added driver "Luis Ortega"', -2],
  ]) {
    await prisma.activityEvent.create({ data: { companyId: company.id, kind, label, actor: OWNER_EMAIL, onTime: kind === "document_renewed" ? true : null, daysDelta: kind === "document_renewed" ? 11 : null, createdAt: at(days) } });
  }

  fs.writeFileSync(
    OUT,
    [
      "FleetGuard demo accounts (local file, ignored by git). Run `npm run seed:demo` again to reset the data.",
      "",
      `OWNER    ${OWNER_EMAIL}    ${ownerPw}    (paid plan, can do everything)`,
      `MANAGER  manager@${DOMAIN}    ${managerPw}    (can edit data)`,
      `VIEWER   viewer@${DOMAIN}    ${viewerPw}    (read only)`,
      "",
    ].join("\n"),
    { mode: 0o600 }
  );
  console.log(`Demo company ready: 1 owner, 1 manager, 1 viewer, 3 vehicles, 3 drivers, ${await prisma.document.count({ where: { companyId: company.id } })} documents.`);
  console.log(`Logins were saved to ${path.relative(process.cwd(), OUT)} (not printed here on purpose).`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err?.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().then(() => process.exit()));
