// Omnibox: type "aa <query>" in the address bar → suggestions across the whole
// AI Alleyway catalog (reviews, picks, guides) → Enter opens the best match.
// No permissions required (chrome.tabs.create/update don't need "tabs"; the
// catalog fetch uses aialleyway.com's CORS-open endpoint, no host permission).

const SITE = "https://aialleyway.com";
const UTM = "utm_source=chrome-extension&utm_medium=referral&utm_campaign=ai-tool-ratings-omnibox";
const REMOTE_CATALOG = "https://aialleyway.com/extension-catalog.json";

let catalogPromise = null;
function getEntries() {
  if (!catalogPromise) {
    catalogPromise = fetch(REMOTE_CATALOG)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => d?.entries || fetchBundled());
  }
  return catalogPromise;
}
function fetchBundled() {
  return fetch(chrome.runtime.getURL("catalog.json"))
    .then((r) => r.json())
    .then((d) => d.entries || [])
    .catch(() => []);
}

const fullUrl = (path) => `${SITE}${path}${path.includes("?") ? "&" : "?"}${UTM}`;

function score(e, q) {
  const name = e.name.toLowerCase();
  if (name === q) return 4;
  if (name.startsWith(q)) return 3;
  if (name.includes(q)) return 2;
  if (`${e.category} ${e.subcategory} ${e.blurb}`.toLowerCase().includes(q)) return 1;
  return 0;
}
const xml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );

chrome.omnibox.setDefaultSuggestion({
  // Omnibox descriptions are parsed as XML — literal & must be escaped as &amp;.
  description: "Search AI Alleyway — reviews, picks &amp; guides (e.g. <match>granola</match>, <match>best ai voice</match>)",
});

chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
  const q = input.trim().toLowerCase();
  const entries = await getEntries();
  const ranked = entries
    .map((e) => ({ e, s: q ? score(e, q) : 1 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.e.rating ?? 0) - (a.e.rating ?? 0))
    .slice(0, 8);

  suggest(
    ranked.map(({ e }) => {
      const mark = e.rating != null ? `${e.rating}★` : e.badge || e.type;
      return { content: e.url, description: `${xml(e.name)} — <dim>${xml(mark)}</dim>` };
    })
  );
});

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const entries = await getEntries();
  const q = text.trim().toLowerCase();
  const byUrl = entries.find((e) => e.url === text); // chosen suggestion carries the url
  const best = byUrl || entries.map((e) => ({ e, s: score(e, q) })).sort((a, b) => b.s - a.s)[0]?.e;
  const url = best ? fullUrl(best.url) : `${SITE}/?${UTM}`;
  if (disposition === "currentTab") chrome.tabs.update({ url });
  else chrome.tabs.create({ url, active: disposition !== "newBackgroundTab" });
});
