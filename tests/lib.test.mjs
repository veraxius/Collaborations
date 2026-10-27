// Run with: npm test (Node 22.18+ runs the .ts files directly)
import { test } from "node:test";
import assert from "node:assert/strict";

import { DOCUMENT_TYPES, DOC_PRESETS, VERTICALS, addMonthsISO, daysUntil, expiryStatus } from "../lib/expiry.ts";
import { buildDeadlines, mcs150Months, toICS } from "../lib/dot-deadlines.ts";
import { GUIDES, getGuide } from "../lib/guides.ts";
import { VERTICAL_PAGES, getVertical } from "../lib/verticals.ts";
import * as backendExpiry from "../backend/lib/expiry.js";
import { mcs150NextDue } from "../backend/lib/deadlines.js";
import { checkoutUrlFor } from "../components/marketing/config.ts";

test("addMonthsISO keeps the day and clamps to the end of short months", () => {
  assert.equal(addMonthsISO("2026-10-08", 24), "2028-10-08");
  assert.equal(addMonthsISO("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonthsISO("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonthsISO("2026-12-15", 1), "2027-01-15");
  assert.equal(addMonthsISO("2026-03-31", 12), "2027-03-31");
  assert.equal(addMonthsISO("", 12), "");
  assert.equal(addMonthsISO("nonsense", 12), "");
});

test("expiry windows match the backend rule (30 days)", () => {
  const now = Date.now();
  assert.equal(expiryStatus(new Date(now - 86400000)), "expired");
  assert.equal(expiryStatus(new Date(now + 5 * 86400000)), "expiring");
  assert.equal(expiryStatus(new Date(now + 60 * 86400000)), "ok");
  assert.equal(daysUntil(new Date(now + 3 * 86400000)), 3);
});

test("frontend and backend share the same document types and verticals", () => {
  assert.deepEqual(
    DOCUMENT_TYPES.map((t) => t.value),
    backendExpiry.DOCUMENT_TYPES.map((t) => t.value)
  );
  assert.deepEqual(
    VERTICALS.map((v) => v.value),
    backendExpiry.VERTICALS.map((v) => v.value)
  );
});

test("quick-start presets are consistent", () => {
  const types = new Set(DOCUMENT_TYPES.map((t) => t.value));
  const ids = new Set();
  for (const p of DOC_PRESETS) {
    assert.ok(!ids.has(p.id), `duplicate preset id ${p.id}`);
    ids.add(p.id);
    assert.ok(types.has(p.type), `${p.id} uses unknown type ${p.type}`);
    assert.ok(Number.isInteger(p.months) && p.months >= 0 && p.months <= 60, `${p.id} months`);
    assert.ok(["driver", "vehicle", "company"].includes(p.scope), `${p.id} scope`);
    if (p.vertical) assert.ok(["nemt", "last-mile", "shuttle"].includes(p.vertical));
  }
  // every niche has something to offer, and the standard list still exists for everyone
  for (const v of ["nemt", "last-mile", "shuttle"]) assert.ok(DOC_PRESETS.some((p) => p.vertical === v), v);
  assert.ok(DOC_PRESETS.filter((p) => !p.vertical).length >= 12);
});

test("MCS-150 dates agree between the website tool and the backend", () => {
  const from = new Date("2026-10-09T00:00:00Z");
  for (let n = 1000; n < 1200; n += 7) {
    const usdot = String(n * 137);
    const schedule = mcs150Months(usdot);
    assert.ok(schedule, usdot);
    const first = buildDeadlines({ usdot, hasHeavyVehicles: false, usesIfta: false, from, months: 48 }).find((d) =>
      d.title.startsWith("MCS-150")
    );
    assert.equal(first?.date, mcs150NextDue(usdot, from), `USDOT ${usdot}`);
  }
});

test("deadline calendar: sorted, within range and complete for each option", () => {
  const from = new Date("2026-10-09T00:00:00Z");
  const all = buildDeadlines({ usdot: "1234567", hasHeavyVehicles: true, usesIfta: true, from, months: 24 });
  const dates = all.map((d) => d.date);
  assert.deepEqual(dates, [...dates].sort());
  assert.ok(dates.every((d) => d >= "2026-10-09" && d <= "2028-10-09"));
  assert.equal(new Set(all.map((d) => d.id)).size, all.length, "unique ids");
  assert.ok(all.some((d) => d.title.startsWith("Form 2290")));
  assert.equal(all.filter((d) => d.title.startsWith("IFTA")).length, 8, "4 quarters x 2 years");
  const bare = buildDeadlines({ usdot: "1234567", hasHeavyVehicles: false, usesIfta: false, from, months: 24 });
  assert.ok(bare.every((d) => d.title.startsWith("MCS-150") || d.title.startsWith("UCR")));
  assert.deepEqual(buildDeadlines({ usdot: "1", hasHeavyVehicles: false, usesIfta: false, from }).filter((d) => d.title.startsWith("MCS")), []);
});

test("calendar file is valid iCalendar", () => {
  const ics = toICS([{ id: "a", title: "UCR, annual; pay", date: "2026-12-31", detail: "Line one\nline two" }]);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261231"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20270101"), "all-day events end the next day");
  assert.ok(ics.includes("SUMMARY:UCR\\, annual\\; pay"), "commas and semicolons are escaped");
  assert.ok(ics.includes("DESCRIPTION:Line one\\nline two"));
  assert.equal((ics.match(/BEGIN:VALARM/g) ?? []).length, 2);
  assert.ok(!/\r?\n\r?\n/.test(ics), "no blank lines");
});

test("checkout link carries the account email and id", () => {
  const base = "https://shop.example.com/checkout/buy/abc";
  const url = checkoutUrlFor({ id: "cl_123", email: "ana+fleet@acme.com" }, base);
  assert.equal(url, "https://shop.example.com/checkout/buy/abc?checkout[email]=ana%2Bfleet%40acme.com&checkout[custom][company_id]=cl_123");
  // a link that already has a query string is extended, not broken
  assert.ok(checkoutUrlFor({ id: "x", email: "a@b.co" }, `${base}?discount=0`).startsWith(`${base}?discount=0&checkout[email]=`));
  // the real configured link works the same way
  assert.match(checkoutUrlFor({ id: "x", email: "a@b.co" }), /^https:\/\/.+\?checkout\[email\]=a%40b\.co&checkout\[custom\]\[company_id\]=x$/);
});

test("guides are well formed and link to each other correctly", () => {
  const slugs = new Set();
  for (const g of GUIDES) {
    assert.match(g.slug, /^[a-z0-9-]+$/);
    assert.ok(!slugs.has(g.slug), `duplicate slug ${g.slug}`);
    slugs.add(g.slug);
    assert.ok(g.title && g.summary && g.description.length >= 80 && g.description.length <= 200, `${g.slug} description length`);
    assert.match(g.updated, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(g.sections.length >= 3, `${g.slug} sections`);
    assert.ok(g.faq.length >= 1);
    assert.match(g.source.href, /^https:\/\//);
    for (const s of g.sections) assert.ok((s.paragraphs?.length ?? 0) + (s.bullets?.length ?? 0) > 0, `${g.slug}: empty section ${s.heading}`);
  }
  for (const g of GUIDES) for (const r of g.related) assert.ok(getGuide(r), `${g.slug} links to missing guide ${r}`);
});

test("niche pages point to real guides and cover three groups", () => {
  assert.equal(VERTICAL_PAGES.length, 3);
  const slugs = new Set();
  for (const v of VERTICAL_PAGES) {
    assert.ok(!slugs.has(v.slug));
    slugs.add(v.slug);
    assert.ok(getGuide(v.guide), `${v.slug} guide ${v.guide} missing`);
    assert.equal(v.lenses.length, 3);
    assert.equal(v.tracks.length, 3);
    assert.ok(v.note.length > 40, "every niche explains that rules vary");
    assert.ok(v.description.length <= 200);
    assert.equal(getVertical(v.slug), v);
  }
});
