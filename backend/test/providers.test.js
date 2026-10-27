import { test } from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET = "test-secret-for-unit-tests";
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_FROM;

const { parseCarrier, lookupCarrier, DotLookupError } = await import("../lib/dot.js");
const { sendSms, smsConfigured } = await import("../lib/sms.js");

const okJson = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("parseCarrier reads the documented shape and tolerates variants", () => {
  const a = parseCarrier({ content: { carrier: { dotNumber: 123, legalName: "ACME LLC", allowedToOperate: "Y", totalPowerUnits: "4" } } });
  assert.deepEqual(a, { usdot: "123", legalName: "ACME LLC", dbaName: null, allowedToOperate: true, powerUnits: 4 });
  const b = parseCarrier({ content: [{ carrier: { legalName: "B INC", allowedToOperate: "N" } }] });
  assert.equal(b.allowedToOperate, false);
  assert.equal(b.powerUnits, null);
  assert.equal(parseCarrier({ content: null }), null);
  assert.equal(parseCarrier(null), null);
  assert.equal(parseCarrier({ content: { carrier: "nope" } }), null);
});

test("lookupCarrier validates input and configuration", async () => {
  await assert.rejects(() => lookupCarrier("12", { webKey: "k" }), (e) => e instanceof DotLookupError && e.code === "bad_usdot");
  await assert.rejects(() => lookupCarrier("1234567", { webKey: "" }), (e) => e.code === "not_configured");
});

test("lookupCarrier: success, not found and upstream errors", async () => {
  let calledUrl = "";
  const good = async (url) => {
    calledUrl = url;
    return okJson({ content: { carrier: { dotNumber: 1234567, legalName: "ACME", allowedToOperate: "Y" } } });
  };
  const found = await lookupCarrier("USDOT 1234567", { webKey: "secret key", fetchImpl: good });
  assert.equal(found.legalName, "ACME");
  assert.ok(calledUrl.includes("/carriers/1234567?webKey=secret%20key"), "digits only, key url-encoded");

  assert.equal(await lookupCarrier("1234567", { webKey: "k", fetchImpl: async () => okJson({}, 404) }), null);
  await assert.rejects(() => lookupCarrier("1234567", { webKey: "k", fetchImpl: async () => okJson({}, 500) }), (e) => e.code === "upstream");
});

test("lookupCarrier never leaks the web key in errors", async () => {
  const boom = async () => { throw new Error("connect ECONNREFUSED https://mobile.fmcsa.dot.gov/...?webKey=TOPSECRET"); };
  await assert.rejects(
    () => lookupCarrier("1234567", { webKey: "TOPSECRET", fetchImpl: boom }),
    (e) => e.code === "upstream" && !e.message.includes("TOPSECRET")
  );
});

test("lookupCarrier times out", async () => {
  const slow = (url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("x"), { name: "AbortError" }))));
  await assert.rejects(() => lookupCarrier("1234567", { webKey: "k", fetchImpl: slow, timeoutMs: 20 }), (e) => e.code === "upstream" && /timed out/.test(e.message));
});

test("sms: without credentials it only logs", async () => {
  assert.equal(smsConfigured(), false);
  const logs = [];
  const original = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  try {
    const r = await sendSms("(415) 555-0123", "hello");
    assert.equal(r.dev, true);
  } finally {
    console.log = original;
  }
  assert.ok(logs.some((l) => l.includes("+14155550123")));
});

test("sms: invalid numbers are rejected before any request", async () => {
  await assert.rejects(() => sendSms("12345", "hi", { fetchImpl: async () => { throw new Error("must not be called"); } }), /Invalid phone/);
});

test("sms: sends the right request to Twilio and surfaces failures", async () => {
  process.env.TWILIO_ACCOUNT_SID = "AC123";
  process.env.TWILIO_AUTH_TOKEN = "tok";
  process.env.TWILIO_FROM = "+15005550006";
  try {
    let seen;
    const fetchImpl = async (url, init) => { seen = { url, init }; return { ok: true, status: 201 }; };
    const r = await sendSms("415-555-0123", "Your card expires", { fetchImpl });
    assert.equal(r.sent, true);
    assert.equal(seen.url, "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json");
    assert.equal(seen.init.headers.Authorization, `Basic ${Buffer.from("AC123:tok").toString("base64")}`);
    const form = new URLSearchParams(seen.init.body);
    assert.equal(form.get("To"), "+14155550123");
    assert.equal(form.get("From"), "+15005550006");
    assert.equal(form.get("Body"), "Your card expires");

    await assert.rejects(() => sendSms("415-555-0123", "x", { fetchImpl: async () => ({ ok: false, status: 400 }) }), /SMS provider error \(400\)/);
  } finally {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM;
  }
});
