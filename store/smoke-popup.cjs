// Functional smoke test of the actual popup UI: loads popup.html, lets popup.js
// run its real loadCatalog()->render() path, and asserts cards actually render.
// Also exercises search filtering. Run with NODE_PATH=<npx playwright>.
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8920";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(`${BASE}/popup.html`, { waitUntil: "networkidle", timeout: 20000 });
  // popup.js renders <a class="card"> into #list once the catalog loads.
  await page.waitForSelector(".card", { timeout: 8000 });

  const total = await page.$$eval(".card", (els) => els.length);
  const firstName = await page.$eval(".card__name", (el) => el.textContent);
  const countTxt = await page.$eval("#count", (el) => el.textContent);
  const firstHref = await page.$eval(".card", (el) => el.getAttribute("href"));

  // exercise search: type a query, expect the list to narrow
  await page.fill("#q", "zapier");
  await page.waitForTimeout(200);
  const afterSearch = await page.$$eval(".card", (els) => els.map((e) => e.querySelector(".card__name")?.textContent));

  // exercise a filter chip
  await page.fill("#q", "");
  await page.waitForTimeout(100);
  const chips = await page.$$(".chip");
  await chips[2].click(); // "Compare"
  await page.waitForTimeout(150);
  const compareOnly = await page.$$eval(".card", (els) => els.length);

  console.log(JSON.stringify({
    cards_rendered: total,
    first_card: firstName,
    count_label: countTxt,
    first_href_has_utm: /utm_source=chrome-extension/.test(firstHref),
    search_zapier_results: afterSearch,
    compare_filter_card_count: compareOnly,
    console_errors: errors,
  }, null, 2));

  await browser.close();
  if (!total || errors.length) process.exit(1);
})();
