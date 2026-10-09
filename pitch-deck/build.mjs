import puppeteer from "../marketing-videos/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => p && existsSync(p));
const out = process.argv[2] ?? "deck.pdf";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(pathToFileURL(resolve("deck.html")).href, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, width: "1920px", height: "1080px", printBackground: true });
if (process.argv[3]) {
  const n = await page.$$eval(".slide", (s) => s.length);
  for (let i = 0; i < n; i++) {
    const el = (await page.$$(".slide"))[i];
    await el.screenshot({ path: `${process.argv[3]}-${i + 1}.png` });
  }
}
await browser.close();
