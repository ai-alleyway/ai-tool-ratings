// Omnibox: type "aa <tool>" in the address bar → suggestions from the bundled
// dataset → Enter opens that tool's review. No permissions required
// (chrome.tabs.create/update do not need the "tabs" permission).

const SITE = "https://aialleyway.com";
const UTM = "utm_source=chrome-extension&utm_medium=referral&utm_campaign=ai-tool-ratings-omnibox";

let toolsPromise = null;
function getTools() {
  if (!toolsPromise) {
    toolsPromise = fetch(chrome.runtime.getURL("data/tools.json"))
      .then((r) => r.json())
      .then((d) => d.tools || [])
      .catch(() => []);
  }
  return toolsPromise;
}

function reviewUrl(slug) {
  return `${SITE}/${slug}/?${UTM}`;
}

function score(tool, q) {
  const name = tool.name.toLowerCase();
  if (name === q) return 3;
  if (name.startsWith(q)) return 2;
  if (name.includes(q) || (tool.subcategory || "").includes(q)) return 1;
  return 0;
}

function xml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}

chrome.omnibox.setDefaultSuggestion({
  description: "Search AI Alleyway tool ratings — e.g. <match>granola</match>, <match>n8n</match>",
});

chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
  const q = input.trim().toLowerCase();
  const tools = await getTools();
  const ranked = tools
    .map((t) => ({ t, s: q ? score(t, q) : 1 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.t.rating ?? 0) - (a.t.rating ?? 0))
    .slice(0, 6);

  suggest(
    ranked.map(({ t }) => ({
      content: t.slug,
      description: `${xml(t.name)} — ${xml((t.rating ?? "").toString())}${
        t.ratingLabel ? " " + xml(t.ratingLabel) : ""
      } · <dim>${xml(t.verdict)}</dim>`,
    }))
  );
});

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const q = text.trim().toLowerCase();
  const tools = await getTools();
  // exact slug match (from a chosen suggestion) else best-scoring name match
  const bySlug = tools.find((t) => t.slug === q);
  const best =
    bySlug ||
    tools
      .map((t) => ({ t, s: score(t, q) }))
      .sort((a, b) => b.s - a.s)[0]?.t;

  const url = best ? reviewUrl(best.slug) : `${SITE}/?${UTM}`;
  if (disposition === "currentTab") chrome.tabs.update({ url });
  else chrome.tabs.create({ url, active: disposition !== "newBackgroundTab" });
});
