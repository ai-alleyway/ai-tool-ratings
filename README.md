# AI Alleyway — AI Tool Reviews, Picks & Guides

A tiny, free Chrome extension that puts independent, hands-on **AI-tool reviews, top picks, and buying
guides** one click away. Search any tool we've reviewed or picked, or find a comparison / best-of guide
— right from your toolbar or the address bar.

Built and maintained by **[AI Alleyway](https://aialleyway.com)**, an independent AI-tools review site.

## What it does

- **Popup search** across the whole catalog — reviews (with our rating + one-line verdict), curated
  picks, and guides (comparisons, best-of roundups, how-tos).
- **Filter by type** — All / Tools / Compare / Best-of / Guides.
- **Address-bar search** — type `aa` then anything (e.g. `aa granola`, `aa best ai voice`) and hit Enter
  to jump straight to the page.
- Every result links to the full editorial page on aialleyway.com.

Ratings and verdicts come from real, hands-on testing — the same reviews published on the site.

## Privacy

This extension **collects no personal data.** No accounts, no tracking, no analytics. The catalog ships
bundled (so search works offline); to stay current it fetches a public catalog file from our GitHub
Pages host — an ordinary request for a public file, never used to track you. See [PRIVACY.md](./PRIVACY.md).

## Permissions

**None.** No host permissions, no content scripts, no access to your browsing. It reads its bundled
catalog (and a public updated copy over standard CORS) and opens a page when you click a result.

## Install

- **From the Chrome Web Store:** _(link added once published)_
- **Unpacked (for development):** `chrome://extensions` → enable **Developer mode** → **Load unpacked**
  → select this folder.

## Development

The catalog (`catalog.json`) is generated from the AI Alleyway site content — review + article
frontmatter and the picks JSON:

```bash
# with the aialleyway site repo as a sibling directory:
node scripts/build-extension-data.mjs
# or point it explicitly:
AA_SITE_DIR=/path/to/aialleyway node scripts/build-extension-data.mjs
```

`catalog.json` lives at the repo root: it is both bundled into the extension (offline fallback) **and**
served by GitHub Pages so the published extension can fetch the freshest copy with no permissions.
**To update the live data without re-submitting to the Chrome Web Store:** regenerate and push —
Pages redeploys and installed copies pick it up on next open. Only *code* changes require a CWS
resubmit.

No build step and no dependencies — it's plain HTML/CSS/JS (Manifest V3). Load it unpacked to test.

## License

[MIT](./LICENSE) — © AI Alleyway.
