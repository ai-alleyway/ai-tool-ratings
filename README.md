# AI Alleyway — AI Tool Reviews, Picks & Guides

A tiny, free browser extension — on **Chrome, Edge, and Firefox** — that puts independent, hands-on
**AI-tool reviews, top picks, and buying guides** one click away. Search any tool we've reviewed or
picked, or find a comparison / best-of guide — right from your toolbar or the address bar.

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
bundled (so search works offline); to stay current it fetches a public catalog file from
aialleyway.com — an ordinary request for a public file, never used to track you. See [PRIVACY.md](./PRIVACY.md).

## Permissions

**None.** No host permissions, no content scripts, no access to your browsing. It reads its bundled
catalog (and a public updated copy over standard CORS) and opens a page when you click a result.

## Install

- **Chrome Web Store:** [AI Alleyway — AI Tool Reviews, Picks & Guides](https://chromewebstore.google.com/detail/ai-alleyway-%E2%80%94-ai-tool-rev/ekcdijddjcofofgnpgaclnocnmbmmmfn)
- **Microsoft Edge Add-ons:** [AI Alleyway — AI Tool Reviews, Picks & Guides](https://microsoftedge.microsoft.com/addons/detail/ai-alleyway-%E2%80%94-ai-tool-rev/hlhdamngfmhffeilgnlobmbehpfjelfa)
- **Firefox Add-ons (AMO):** [AI Alleyway — AI Tools](https://addons.mozilla.org/en-US/firefox/addon/ai-alleyway-ai-tools/)
- **Unpacked (for development):** `chrome://extensions` (or `edge://extensions`) → enable **Developer
  mode** → **Load unpacked** → select this folder. For Firefox: `about:debugging` → **This Firefox** →
  **Load Temporary Add-on** → pick `manifest.json`.

## Development

The catalog (`catalog.json`) is generated from the AI Alleyway site content — review + article
frontmatter and the picks JSON:

```bash
# with the aialleyway site repo as a sibling directory:
node scripts/build-extension-data.mjs
# or point it explicitly:
AA_SITE_DIR=/path/to/aialleyway node scripts/build-extension-data.mjs
```

`catalog.json` lives at the repo root: it is bundled into the extension as an offline fallback. The
published extension fetches the freshest copy from `aialleyway.com/extension-catalog.json` (a public
static file, no permissions needed), falling back to the bundled copy if that request fails.
**To update the live data without re-submitting to the Chrome Web Store:** regenerate and deploy the
catalog to aialleyway.com — installed copies pick it up on next open. Only *code* changes require a CWS
resubmit.

No build step and no dependencies — it's plain HTML/CSS/JS (Manifest V3). Load it unpacked to test.

### Packaging for the stores

One source, three store packages. `scripts/build-packages.mjs` produces a submittable zip per store:

```bash
node scripts/build-packages.mjs
# → dist/ai-tool-ratings-chrome-<v>.zip   (Chrome Web Store — MV3, service_worker)
# → dist/ai-tool-ratings-edge-<v>.zip     (Edge Add-ons — identical to the Chrome package)
# → dist/ai-tool-ratings-firefox-<v>.zip  (Firefox AMO — MV3 + gecko id + background.scripts)
```

Chrome and Edge accept the exact same MV3 package. Firefox needs only two manifest tweaks (an
extension `gecko.id` and `background.scripts` instead of `background.service_worker`) — the code uses
only `chrome.omnibox` / `chrome.runtime` / `chrome.tabs`, which Firefox exposes via the `chrome.*`
alias, so no code changes are required. The root `manifest.json` is the Chrome/Edge manifest; the
Firefox variant is generated at package time.

## License

[MIT](./LICENSE) — © AI Alleyway.
