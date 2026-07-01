#!/usr/bin/env node
// Generates catalog.json for the AI Alleyway search extension from the Astro site:
//   - reviews   (blog, format: review)      → rated tool entries
//   - picks     (src/content/picks/*.json)  → curated tool entries (no 1–5 rating)
//   - articles  (blog: comparison/roundup/guide)
// Dependency-free (no npm install). A tool that is BOTH reviewed and picked keeps the
// review entry (richer) — the pick duplicate is dropped.
//
// Output: ./catalog.json  (repo root — bundled into the extension as the OFFLINE
//   FALLBACK). The LIVE catalog the extension fetches at runtime comes from the Astro
//   endpoint aialleyway.com/extension-catalog.json.
//
// KEEP IN SYNC with aialleyway/src/pages/extension-catalog.json.ts (the live endpoint):
//   both must emit the same entry shape, dedup rules, sort order, and blurb precedence.
//   This script regex-parses frontmatter (no Astro content layer); the endpoint reads
//   typed getCollection() data. A field added in one MUST be added in the other by hand.
//
// Usage:
//   node scripts/build-extension-data.mjs
//   AA_SITE_DIR=/path/to/aialleyway node scripts/build-extension-data.mjs

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const siteDir = process.env.AA_SITE_DIR || resolve(repoRoot, '..', 'aialleyway');
const blogDir = join(siteDir, 'src', 'content', 'blog');
const picksDir = join(siteDir, 'src', 'content', 'picks');

const fm = (src) => (src.match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
const scalar = (b, k) => {
  const m = b.match(new RegExp(`^${k}:\\s*(.+?)\\s*$`, 'm'));
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : null;
};
const firstToolName = (b) => {
  const blk = b.match(/^tools:\s*\n([\s\S]*?)(?=^\S)/m);
  const m = (blk ? blk[1] : b).match(/-\s*name:\s*(.+?)\s*$/m);
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : null;
};
const toolKey = (slug) => slug.replace(/-(ai-)?review$/, '');

function fail(msg) {
  console.error(`\nERROR: ${msg}`);
  console.error('Set AA_SITE_DIR to the aialleyway site repo, or run with the site as a sibling.\n');
  process.exit(1);
}

let blogFiles;
try {
  blogFiles = readdirSync(blogDir).filter((f) => /\.mdx?$/.test(f));
} catch {
  fail(`could not read ${blogDir}`);
}

// --- blog: reviews + articles ---
const reviews = [];
const articles = [];
for (const file of blogFiles) {
  const b = fm(readFileSync(join(blogDir, file), 'utf8'));
  if (scalar(b, 'draft') === 'true') continue;
  const format = scalar(b, 'format');
  const slug = basename(file, /\.mdx$/.test(file) ? '.mdx' : '.md');
  const title = scalar(b, 'title') || slug;
  const base = {
    slug,
    url: `/${slug}/`,
    category: scalar(b, 'category') || '',
    subcategory: scalar(b, 'subcategory') || '',
  };

  if (format === 'review') {
    const rating = Number(scalar(b, 'rating'));
    const name =
      firstToolName(b) || title.replace(/\s*(AI\s+)?review\b.*$/i, '').replace(/:.*$/, '').trim();
    reviews.push({
      type: 'review',
      name,
      toolKey: toolKey(slug),
      rating: Number.isFinite(rating) ? rating : null,
      badge: scalar(b, 'ratingLabel') || '',
      blurb: scalar(b, 'ogHook') || scalar(b, 'description') || '',
      ...base,
    });
  } else if (format === 'comparison' || format === 'roundup' || format === 'guide') {
    articles.push({
      type: format,
      name: title,
      rating: null,
      badge: format[0].toUpperCase() + format.slice(1),
      blurb: scalar(b, 'description') || scalar(b, 'ogHook') || '',
      ...base,
    });
  }
}

const reviewedKeys = new Set(reviews.map((r) => r.toolKey));
const reviewUrlByKey = Object.fromEntries(reviews.map((r) => [r.toolKey, r.url]));
const findReviewUrl = (ts) =>
  reviewUrlByKey[ts] || reviews.find((r) => r.slug.startsWith(ts))?.url || null;

// --- picks (skip any tool that already has a review) ---
const picks = [];
let pickFiles = [];
try {
  pickFiles = readdirSync(picksDir).filter((f) => f.endsWith('.json'));
} catch {
  console.warn(`WARN: no picks dir at ${picksDir} — continuing without picks.`);
}
for (const file of pickFiles) {
  const p = JSON.parse(readFileSync(join(picksDir, file), 'utf8'));
  const ts = p.toolSlug || p.id;
  if (reviewedKeys.has(ts) || reviews.some((r) => r.slug.startsWith(ts))) continue; // dedup
  const reviewUrl = findReviewUrl(ts);
  picks.push({
    type: 'pick',
    name: p.name,
    rating: null,
    badge: p.bestFor || (p.rank === 'best' ? 'Top pick' : 'Pick'),
    blurb: p.blurb || p.rationale || '',
    category: p.category || '',
    subcategory: '',
    slug: p.id,
    url: reviewUrl || '/picks/',
  });
}

// tools first (reviews by rating, then picks A–Z), then articles A–Z
reviews.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));
picks.sort((a, b) => a.name.localeCompare(b.name));
articles.sort((a, b) => a.name.localeCompare(b.name));

const entries = [...reviews, ...picks, ...articles].map(({ toolKey, ...rest }) => rest);

const out = {
  generatedFrom: 'aialleyway: reviews + picks + comparison/roundup/guide',
  site: 'https://aialleyway.com',
  counts: {
    total: entries.length,
    reviews: reviews.length,
    picks: picks.length,
    comparison: articles.filter((a) => a.type === 'comparison').length,
    roundup: articles.filter((a) => a.type === 'roundup').length,
    guide: articles.filter((a) => a.type === 'guide').length,
  },
  entries,
};

writeFileSync(join(repoRoot, 'catalog.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote catalog.json — ${entries.length} entries:`, JSON.stringify(out.counts));
