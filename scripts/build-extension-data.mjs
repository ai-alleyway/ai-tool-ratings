#!/usr/bin/env node
// Generates data/tools.json for the AI Alleyway "AI Tool Ratings" extension
// from the Astro site's review frontmatter. Dependency-free (no npm install).
//
// Usage:
//   node scripts/build-extension-data.mjs            # default: sibling ../aialleyway
//   AA_SITE_DIR=/path/to/aialleyway node scripts/build-extension-data.mjs
//
// Source of truth = review .mdx frontmatter (format: review, draft: false).
// Re-run on each release; a missing new review just means a stale-but-valid dataset.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const siteDir =
  process.env.AA_SITE_DIR || resolve(repoRoot, '..', 'aialleyway');
const blogDir = join(siteDir, 'src', 'content', 'blog');

function frontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}

function scalar(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  if (!m) return null;
  return m[1].replace(/^["']|["']$/g, '').trim();
}

function firstToolName(fm) {
  // tools:\n  - name: X  (grab the first name under the tools: block)
  const block = fm.match(/^tools:\s*\n([\s\S]*?)(?=^\S)/m);
  const scope = block ? block[1] : fm;
  const m = scope.match(/-\s*name:\s*(.+?)\s*$/m);
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : null;
}

function displayName(fm, title) {
  const tool = firstToolName(fm);
  if (tool) return tool;
  // fallback: title text before " review" / ":" (e.g. "Zapier review: ..." -> "Zapier")
  return title
    .replace(/\s*(AI\s+)?review\b.*$/i, '')
    .replace(/:.*$/, '')
    .trim();
}

let files;
try {
  files = readdirSync(blogDir).filter((f) => f.endsWith('.mdx'));
} catch (e) {
  console.error(`\nERROR: could not read ${blogDir}`);
  console.error(`Set AA_SITE_DIR to the aialleyway site repo path, or run with the site as a sibling.\n`);
  process.exit(1);
}

const tools = [];
for (const file of files) {
  const src = readFileSync(join(blogDir, file), 'utf8');
  const fm = frontmatter(src);
  if (scalar(fm, 'format') !== 'review') continue;
  if (scalar(fm, 'draft') === 'true') continue;

  const title = scalar(fm, 'title') || '';
  const rating = Number(scalar(fm, 'rating'));
  const slug = basename(file, '.mdx');

  tools.push({
    name: displayName(fm, title),
    slug,
    rating: Number.isFinite(rating) ? rating : null,
    ratingLabel: scalar(fm, 'ratingLabel') || '',
    verdict: scalar(fm, 'ogHook') || '',
    category: scalar(fm, 'category') || '',
    subcategory: scalar(fm, 'subcategory') || '',
  });
}

// Highest-rated first, then alphabetical — a sensible default popup order.
tools.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));

const out = {
  generatedFrom: 'aialleyway/src/content/blog (format: review)',
  count: tools.length,
  site: 'https://aialleyway.com',
  tools,
};

mkdirSync(join(repoRoot, 'data'), { recursive: true });
writeFileSync(join(repoRoot, 'data', 'tools.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote data/tools.json — ${tools.length} reviewed tools.`);
for (const t of tools) console.log(`  ${t.rating?.toFixed(1) ?? ' - '}  ${t.name}  (/${t.slug}/)`);
