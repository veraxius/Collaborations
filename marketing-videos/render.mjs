// Usage:
//   node render.mjs <video.html> <out.mp4>                 render the full video
//   node render.mjs <video.html> <out-dir> --stills 1,5,12 save PNG stills at those seconds
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const [, , htmlArg, outArg, flag, list] = process.argv;
if (!htmlArg || !outArg) {
  console.error("usage: node render.mjs <video.html> <out.mp4|out-dir> [--stills 1,5,12]");
  process.exit(1);
}

const CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error("Chrome/Edge not found. Set CHROME_PATH.");

const FPS = 30;
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-gpu-vsync"],
  defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(htmlArg)).href, { waitUntil: "networkidle0" });
await page.waitForFunction("window.__ready === true", { timeout: 30000 });
const duration = await page.evaluate("window.DURATION");

if (flag === "--stills") {
  mkdirSync(outArg, { recursive: true });
  for (const s of list.split(",").map(Number)) {
    await page.evaluate((t) => window.renderFrame(t), s);
    await page.screenshot({ path: join(outArg, `still-${String(s).replace(".", "_")}s.png`) });
    console.log("still", s);
  }
  await browser.close();
  process.exit(0);
}

const total = Math.round(duration * FPS);
const ff = spawn(
  "ffmpeg",
  [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
    "-r", String(FPS), "-profile:v", "high", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "128k", "-shortest",
    resolve(outArg),
  ],
  { stdio: ["pipe", "inherit", "inherit"] }
);

for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.renderFrame(t), i / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 60 === 0) console.log(`frame ${i}/${total}`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
await browser.close();
console.log("done ->", resolve(outArg));
