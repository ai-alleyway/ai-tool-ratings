# AI Tool Ratings — by AI Alleyway

A tiny, free Chrome extension that puts independent, hands-on **AI tool ratings** one click away.
Search any tool we've reviewed and get its score, a one-line verdict, and a link to the full
write-up — right from your toolbar or the address bar.

Built and maintained by **[AI Alleyway](https://aialleyway.com)**, an independent AI-tools review site.

## What it does

- **Popup search** — click the toolbar icon, type a tool name (Granola, n8n, ElevenLabs…), and see its
  rating, our "Category Leader / Power Tool / Solid Choice" label, and the verdict in one line.
- **Filter by category** — Create / Automate / Grow.
- **Address-bar search** — type `aa` then a tool name (e.g. `aa granola`) and hit Enter to jump straight
  to the review.
- Every result links to the full editorial review on aialleyway.com.

The ratings come from real, hands-on testing — the same reviews published on the site.

## Privacy

This extension **collects nothing.** No accounts, no tracking, no analytics, no data leaves your
browser. Ratings ship inside the extension, so search works offline. See [PRIVACY.md](./PRIVACY.md).

## Permissions

**None.** No host permissions, no content scripts, no access to your browsing. It only reads its own
bundled data file and opens a review page when you click one.

## Install

- **From the Chrome Web Store:** _(link added once published)_
- **Unpacked (for development):** `chrome://extensions` → enable **Developer mode** → **Load unpacked**
  → select this folder.

## Development

The tool dataset (`data/tools.json`) is generated from the review frontmatter on the AI Alleyway site:

```bash
# with the aialleyway site repo as a sibling directory:
node scripts/build-extension-data.mjs
# or point it explicitly:
AA_SITE_DIR=/path/to/aialleyway node scripts/build-extension-data.mjs
```

No build step and no dependencies — it's plain HTML/CSS/JS (Manifest V3). Load it unpacked to test.

## License

[MIT](./LICENSE) — © AI Alleyway.
