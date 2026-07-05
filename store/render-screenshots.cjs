// Renders store/scenes.html (?s=2,3,4) to crisp 1280x800 store screenshots.
// Uses the system Chrome via Playwright (channel:'chrome') so there's no bundled-
// browser version to manage. Renders at 2x then the caller downscales with magick.
// Run: NODE_PATH="<npx playwright node_modules>" node store/render-screenshots.cjs
const { chromium } = require("playwright");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SCENE = "file://" + path.join(__dirname, "scenes.html");
const OUT = path.join(ROOT, "dist");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  for (const s of [2, 3, 4]) {
    await page.goto(`${SCENE}?s=${s}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const out = path.join(OUT, `store-screenshot-${s}@2x.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 800 } });
    console.log("rendered", out);
  }
  await browser.close();
})();
