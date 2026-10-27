// Exports the FleetGuard logo (blue shield + white check) on the dark brand background.
// Usage: node export-logo.mjs [outDir]
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const outDir = resolve(process.argv[2] ?? "out/logo");
mkdirSync(outDir, { recursive: true });

// Same shape and colors as components/ui/fleetguard-logo.tsx. The padding keeps the shield at ~66% of the canvas.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 36 36" width="1024" height="1024">
  <rect x="-6" y="-6" width="36" height="36" fill="#101820"/>
  <path d="M12 1.5 L21 4.8 V11 C21 16.6 17.2 20.9 12 22.8 C6.8 20.9 3 16.6 3 11 V4.8 Z" fill="#0071E3"/>
  <path d="M7.6 11.8 L10.6 14.8 L16.4 8.6" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
`;
writeFileSync(join(outDir, "fleetguard-logo-dark.svg"), SVG);

const CHROME = [process.env.CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => p && existsSync(p));
if (!CHROME) throw new Error("Chrome/Edge not found. Set CHROME_PATH.");

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
for (const size of [1024, 2048]) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:#101820">${SVG.replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</body></html>`);
  await page.screenshot({ path: join(outDir, `fleetguard-logo-dark-${size}.png`) });
  console.log("png", size);
}
await browser.close();
console.log("done ->", outDir);
