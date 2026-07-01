// AI Tool Ratings — popup logic. No permissions, no network calls at runtime
// beyond loading the bundled dataset. Links open editorial review pages (never affiliate).

const SITE = "https://aialleyway.com";
const UTM = "utm_source=chrome-extension&utm_medium=referral&utm_campaign=ai-tool-ratings";

const CATEGORY_LABELS = { create: "Create", automate: "Automate", grow: "Grow" };

const els = {
  q: document.getElementById("q"),
  list: document.getElementById("list"),
  filters: document.getElementById("filters"),
  empty: document.getElementById("empty"),
  count: document.getElementById("count"),
};

let TOOLS = [];
let activeCategory = null;

function reviewUrl(slug) {
  return `${SITE}/${slug}/?${UTM}`;
}

function stars(rating) {
  const full = Math.round(rating || 0);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

function matches(tool, query) {
  if (activeCategory && tool.category !== activeCategory) return false;
  if (!query) return true;
  const hay = `${tool.name} ${tool.category} ${tool.subcategory} ${tool.verdict}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

function card(tool) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = reviewUrl(tool.slug);
  a.target = "_blank";
  a.rel = "noopener";

  const top = document.createElement("div");
  top.className = "card__top";

  const name = document.createElement("span");
  name.className = "card__name";
  name.textContent = tool.name;

  const rating = document.createElement("span");
  rating.className = "card__rating";
  if (tool.rating != null) {
    const s = document.createElement("span");
    s.className = "card__stars";
    s.textContent = stars(tool.rating);
    const score = document.createElement("span");
    score.className = "card__score";
    score.textContent = tool.rating.toFixed(1);
    rating.append(s, score);
  }

  top.append(name, rating);
  a.append(top);

  if (tool.ratingLabel) {
    const label = document.createElement("span");
    label.className = "card__label";
    label.textContent = tool.ratingLabel;
    a.append(label);
  }

  if (tool.verdict) {
    const v = document.createElement("p");
    v.className = "card__verdict";
    v.textContent = tool.verdict;
    a.append(v);
  }

  const cta = document.createElement("span");
  cta.className = "card__cta";
  cta.textContent = "Read full review →";
  a.append(cta);

  return a;
}

function render() {
  const query = els.q.value.trim();
  const shown = TOOLS.filter((t) => matches(t, query));

  els.list.replaceChildren(...shown.map(card));
  els.empty.hidden = shown.length > 0;
  els.count.textContent = `${shown.length} of ${TOOLS.length} tools`;
}

function buildFilters() {
  const cats = [...new Set(TOOLS.map((t) => t.category).filter(Boolean))].sort();
  const chips = cats.map((cat) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = CATEGORY_LABELS[cat] || cat;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      activeCategory = activeCategory === cat ? null : cat;
      for (const c of els.filters.children)
        c.setAttribute("aria-pressed", String(c === b && activeCategory === cat));
      render();
    });
    return b;
  });
  els.filters.replaceChildren(...chips);
}

async function init() {
  try {
    const res = await fetch("data/tools.json");
    const data = await res.json();
    TOOLS = data.tools || [];
  } catch (e) {
    els.empty.hidden = false;
    els.empty.textContent = "Couldn't load ratings data.";
    return;
  }
  buildFilters();
  render();
  els.q.addEventListener("input", render);
}

init();
