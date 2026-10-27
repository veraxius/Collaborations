import { test } from "node:test";
import assert from "node:assert/strict";
import { isPaid, teamLimit, FREE_LIMITS, PAID_LIMITS } from "../lib/plan.js";
import { parseOffsets, normalizeOffsets, pickMarker, parseEmails, isValidEmail, DEFAULT_OFFSETS } from "../lib/reminder-config.js";
import { cleanUsdot, mcs150Schedule, mcs150NextDue } from "../lib/deadlines.js";
import { normalizePhone } from "../lib/phone.js";
import { csvCell, toCsv } from "../lib/csv.js";
import { daysUntil, expiryStatus, oneOf, VERTICALS } from "../lib/expiry.js";
import { countStatuses, healthScore } from "../lib/scoring.js";

const NOW = new Date("2026-10-09T12:00:00Z");
const days = (n) => new Date(NOW.getTime() + n * 86400000);

test("plan: active, trialing and grace periods", () => {
  assert.equal(isPaid({ subscriptionStatus: "active" }), true);
  assert.equal(isPaid({ subscriptionStatus: "on_trial" }), true);
  assert.equal(isPaid({ subscriptionStatus: "past_due" }), true);
  assert.equal(isPaid({ subscriptionStatus: "trialing" }), false, "legacy default is free");
  assert.equal(isPaid({ subscriptionStatus: "expired" }), false);
  assert.equal(isPaid(null), false);
});

test("plan: cancelled keeps access until the paid period ends", () => {
  const future = { subscriptionStatus: "cancelled", planEndsAt: days(5) };
  const past = { subscriptionStatus: "cancelled", planEndsAt: days(-1) };
  assert.equal(isPaid(future, { now: NOW }), true);
  assert.equal(isPaid(past, { now: NOW }), false);
  assert.equal(isPaid({ subscriptionStatus: "cancelled" }, { now: NOW }), false);
});

test("plan: private installs are always unlimited", () => {
  assert.equal(isPaid({ subscriptionStatus: "trialing" }, { isPrivate: true }), true);
  assert.equal(teamLimit({ subscriptionStatus: "trialing" }, { isPrivate: true }), PAID_LIMITS.team);
  assert.equal(teamLimit({ subscriptionStatus: "trialing" }), FREE_LIMITS.team);
});

test("reminder offsets: valid input", () => {
  assert.deepEqual(parseOffsets("30, 15, 7, 1"), [30, 15, 7, 1]);
  assert.deepEqual(parseOffsets("1 7 30 15"), [30, 15, 7, 1]);
  assert.deepEqual(parseOffsets([7, 7, 3]), [7, 3]);
  assert.deepEqual(parseOffsets("365"), [365]);
});

test("reminder offsets: rejects bad input", () => {
  for (const bad of ["", "abc", "0", "366", "-5", "7.5", "1,2,3,4,5,6,7", null, undefined]) {
    assert.equal(parseOffsets(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
  assert.deepEqual(normalizeOffsets("nonsense"), DEFAULT_OFFSETS);
  assert.deepEqual(normalizeOffsets("14, 2"), [14, 2]);
});

test("pickMarker: which reminder is due", () => {
  const o = [30, 15, 7, 1];
  assert.equal(pickMarker(-1, o), "expired");
  assert.equal(pickMarker(0, o), "1");
  assert.equal(pickMarker(1, o), "1");
  assert.equal(pickMarker(2, o), "7");
  assert.equal(pickMarker(7, o), "7");
  assert.equal(pickMarker(8, o), "15");
  assert.equal(pickMarker(20, o), "30");
  assert.equal(pickMarker(30, o), "30");
  assert.equal(pickMarker(31, o), null);
  assert.equal(pickMarker(5, [3]), null);
  assert.equal(pickMarker(2, [3]), "3");
});

test("emails: parse and validate", () => {
  assert.deepEqual(parseEmails("A@x.com, b@y.org ;a@x.com"), ["a@x.com", "b@y.org"]);
  assert.deepEqual(parseEmails(""), []);
  assert.equal(parseEmails("not-an-email"), null);
  assert.equal(parseEmails("a@x.com,b@x.com,c@x.com,d@x.com,e@x.com,f@x.com"), null, "max 5");
  assert.equal(isValidEmail("x@y.co"), true);
  assert.equal(isValidEmail("x@y"), false);
  assert.equal(isValidEmail("a b@y.com"), false);
});

test("USDOT cleaning", () => {
  assert.equal(cleanUsdot("USDOT 1234567"), "1234567");
  assert.equal(cleanUsdot("12"), null);
  assert.equal(cleanUsdot("1234567890"), null);
  assert.equal(cleanUsdot(""), null);
});

test("MCS-150 schedule follows the FMCSA rule", () => {
  assert.deepEqual(mcs150Schedule("1234567"), { month: 7, evenYears: true });
  assert.deepEqual(mcs150Schedule("123456"), { month: 6, evenYears: false });
  assert.deepEqual(mcs150Schedule("123450"), { month: 10, evenYears: false }, "0 = October");
  assert.equal(mcs150Schedule("5"), null);
});

test("MCS-150 next due date", () => {
  assert.equal(mcs150NextDue("1234567", new Date("2026-10-09T00:00:00Z")), "2028-07-31");
  assert.equal(mcs150NextDue("123456", new Date("2026-10-09T00:00:00Z")), "2027-06-30");
  assert.equal(mcs150NextDue("1234567", new Date("2026-07-31T00:00:00Z")), "2026-07-31", "due today counts");
  assert.equal(mcs150NextDue("1234567", new Date("2026-08-01T00:00:00Z")), "2028-07-31");
  assert.equal(mcs150NextDue("123450", new Date("2026-01-15T00:00:00Z")), "2027-10-31");
  assert.equal(mcs150NextDue("1", new Date()), null);
  // February in a leap year: last digit 2, tens digit even => even years
  assert.equal(mcs150NextDue("1234502", new Date("2027-03-01T00:00:00Z")), "2028-02-29");
});

test("phone normalization", () => {
  assert.equal(normalizePhone("(415) 555-0123"), "+14155550123");
  assert.equal(normalizePhone("1-415-555-0123"), "+14155550123");
  assert.equal(normalizePhone("+52 55 1234 5678"), "+525512345678");
  assert.equal(normalizePhone("555-0123"), null);
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone("+123"), null);
});

test("CSV escapes quotes and blocks formula injection", () => {
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
  for (const lead of ["+", "-", "@", "="]) assert.ok(csvCell(`${lead}1`).startsWith(`"'${lead}`));
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(12.5), '"12.5"');
  const out = toCsv([["a", "b"], ["1", "x,y"]]);
  assert.ok(out.startsWith("﻿"));
  assert.ok(out.includes('"x,y"'));
  assert.ok(out.includes("\r\n"));
});

test("expiry status windows", () => {
  assert.equal(daysUntil(days(10), NOW), 10);
  assert.equal(expiryStatus(days(-1), NOW), "expired");
  assert.equal(expiryStatus(days(0.5), NOW), "expiring");
  assert.equal(expiryStatus(days(30), NOW), "expiring");
  assert.equal(expiryStatus(days(31), NOW), "ok");
});

test("health score", () => {
  assert.equal(healthScore({ expired: 0, expiring: 0, ok: 0 }), 100);
  assert.equal(healthScore({ expired: 1, expiring: 0, ok: 1 }), 50);
  assert.equal(healthScore({ expired: 0, expiring: 2, ok: 0 }), 50);
  assert.equal(healthScore({ expired: 0, expiring: 0, ok: 5 }), 100);
  const counts = countStatuses([{ expiresAt: days(-2) }, { expiresAt: days(5) }, { expiresAt: days(90) }], NOW);
  assert.deepEqual(counts, { expired: 1, expiring: 1, ok: 1 });
});

test("oneOf falls back for unknown values", () => {
  assert.equal(oneOf("nemt", VERTICALS, "trucking"), "nemt");
  assert.equal(oneOf("hacker", VERTICALS, "trucking"), "trucking");
});
