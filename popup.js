// AI Alleyway search popup. Loads a catalog of reviews + picks + guides.
// Data source: freshest copy from aialleyway.com/extension-catalog.json (served
// CORS-open, no host permission needed), falling back to the bundled catalog.json
// when offline. Links open editorial pages on aialleyway.com (never affiliate).

const SITE = "https://aialleyway.com";
const UTM = "utm_source=chrome-extension&utm_medium=referral&utm_campaign=ai-tool-ratings";
const REMOTE_CATALOG = "https://aialleyway.com/extension-catalog.json";
const REMOTE_TIMEOUT_MS = 2500;

// filter key -> which entry types it includes
const FILTERS = [
  { key: "all", label: "All", types: null },
  { key: "tools", label: "Tools", types: ["review", "pick"] },
  { key: "comparison", label: "Compare", types: ["comparison"] },
  { key: "roundup", label: "Best-of", types: ["roundup"] },
  { key: "guide", label: "Guides", types: ["guide"] },
];

const TYPE_TAG = { pick: "Pick", comparison: "Comparison", roundup: "Best-of", guide: "Guide" };
const CTA = {
  review: "Read full review →",
  pick: "See our pick →",
  comparison: "Read comparison →",
  roundup: "See the winners →",
  guide: "Read guide →",
};

const els = {
  q: document.getElementById("q"),
  list: document.getElementById("list"),
  filters: document.getElementById("filters"),
  empty: document.getElementById("empty"),
  count: document.getElementById("count"),
};

let ENTRIES = [];
let activeFilter = FILTERS[0];

const fullUrl = (path) => `${SITE}${path}${path.includes("?") ? "&" : "?"}${UTM}`;
const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(Math.max(0, 5 - Math.round(r || 0)));

function matches(e, query) {
  if (activeFilter.types && !activeFilter.types.includes(e.type)) return false;
  if (!query) return true;
  const hay = `${e.name} ${e.type} ${e.category} ${e.subcategory} ${e.blurb}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

function card(e) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = fullUrl(e.url);
  a.target = "_blank";
  a.rel = "noopener";

  const top = document.createElement("div");
  top.className = "card__top";

  const name = document.createElement("span");
  name.className = "card__name";
  name.textContent = e.name;
  top.append(name);

  if (e.rating != null) {
    const rating = document.createElement("span");
    rating.className = "card__rating";
    const s = document.createElement("span");
    s.className = "card__stars";
    s.textContent = stars(e.rating);
    const score = document.createElement("span");
    score.className = "card__score";
    score.textContent = e.rating.toFixed(1);
    rating.append(s, score);
    top.append(rating);
  } else if (TYPE_TAG[e.type]) {
    const tag = document.createElement("span");
    tag.className = "card__tag";
    tag.textContent = TYPE_TAG[e.type];
    top.append(tag);
  }
  a.append(top);

  if (e.badge && (e.type === "review" || e.type === "pick")) {
    const b = document.createElement("span");
    b.className = "card__label";
    b.textContent = e.badge;
    a.append(b);
  }

  if (e.blurb) {
    const v = document.createElement("p");
    v.className = "card__verdict";
    v.textContent = e.blurb;
    a.append(v);
  }

  const cta = document.createElement("span");
  cta.className = "card__cta";
  cta.textContent = CTA[e.type] || "Read →";
  a.append(cta);

  return a;
}

function render() {
  const query = els.q.value.trim();
  const shown = ENTRIES.filter((e) => matches(e, query));
  els.list.replaceChildren(...shown.map(card));
  els.empty.hidden = shown.length > 0;
  els.count.textContent = `${shown.length} of ${ENTRIES.length}`;
}

function buildFilters() {
  const chips = FILTERS.map((f) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = f.label;
    b.setAttribute("aria-pressed", String(f === activeFilter));
    b.addEventListener("click", () => {
      activeFilter = f;
      for (const c of els.filters.children) c.setAttribute("aria-pressed", String(c === b));
      render();
    });
    return b;
  });
  els.filters.replaceChildren(...chips);
}

function fetchJson(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { signal: ctrl.signal })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .finally(() => clearTimeout(t));
}

async function loadCatalog() {
  // Prefer the freshest remote copy; fall back to the bundled file when offline.
  const remote = await fetchJson(REMOTE_CATALOG, REMOTE_TIMEOUT_MS);
  if (remote?.entries?.length) return remote.entries;
  const bundled = await fetchJson("catalog.json", 4000);
  return bundled?.entries || [];
}

async function init() {
  ENTRIES = await loadCatalog();
  if (!ENTRIES.length) {
    els.empty.hidden = false;
    els.empty.textContent = "Couldn't load the catalog.";
    return;
  }
  buildFilters();
  render();
  els.q.addEventListener("input", render);
}

init();
