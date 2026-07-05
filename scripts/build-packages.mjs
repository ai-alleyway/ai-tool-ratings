#!/usr/bin/env node
// Builds submittable store packages from the shared source, one per browser store:
//   dist/ai-tool-ratings-chrome-<v>.zip    (Chrome Web Store — MV3, service_worker)
//   dist/ai-tool-ratings-edge-<v>.zip       (Edge Add-ons — identical to Chrome)
//   dist/ai-tool-ratings-firefox-<v>.zip    (Firefox AMO — MV3 + gecko id + background.scripts)
//
// Chrome & Edge accept the exact same MV3 package. Firefox needs two tweaks:
//   1. browser_specific_settings.gecko.id  (AMO requires an extension id)
//   2. background.scripts instead of background.service_worker (widest FF compat;
//      background.js only registers listeners at top level, so it runs fine as an
//      event-page script — no service-worker-only globals are used).
// The code (background.js, popup.*) uses only chrome.omnibox / chrome.runtime /
// chrome.tabs, all of which Firefox exposes via the chrome.* alias — so no code
// changes are needed, only the manifest.

import { execSync } from "node:child_process";
import { mkdirSync, rmSync, cpSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const build = join(root, ".build");

const base = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const V = base.version;

// Files that ship inside every store package (matches the v1.1.0 Chrome zip).
const SHARED = ["popup.html", "popup.css", "popup.js", "background.js", "catalog.json", "icons"];

const GECKO_ID = "ai-tool-ratings@aialleyway.com";

function firefoxManifest(m) {
  const fx = structuredClone(m);
  // FF: event-page script instead of a service worker.
  fx.background = { scripts: ["background.js"] };
  fx.browser_specific_settings = {
    gecko: {
      id: GECKO_ID,
      // 142+: the floor (desktop 140 + Android 142) where gecko.data_collection_permissions is supported.
      // Fine for a 2026 extension; the extension uses only baseline MV3 APIs.
      strict_min_version: "142.0",
      // Firefox requires an explicit data-collection declaration on new
      // extensions. This one collects nothing (no permissions, no analytics) → "none".
      data_collection_permissions: { required: ["none"] },
    },
  };
  return fx;
}

function pack(target, manifest) {
  const stage = join(build, target);
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  writeFileSync(join(stage, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  for (const f of SHARED) cpSync(join(root, f), join(stage, f), { recursive: true });
  const zip = join(dist, `ai-tool-ratings-${target}-${V}.zip`);
  rmSync(zip, { force: true });
  // -X strips extra file attrs for a clean, reproducible archive; run from stage so
  // paths inside the zip are top-level (manifest.json at root, not .build/<target>/...).
  execSync(`cd ${JSON.stringify(stage)} && zip -qrX ${JSON.stringify(zip)} .`);
  const size = execSync(`unzip -l ${JSON.stringify(zip)} | tail -1`).toString().trim();
  console.log(`✓ ${target.padEnd(8)} → ${zip.replace(root + "/", "")}  (${size})`);
}

mkdirSync(dist, { recursive: true });
pack("chrome", base); // === Edge too; kept separate-named for a clean per-store upload trail
pack("edge", base);
pack("firefox", firefoxManifest(base));
rmSync(build, { recursive: true, force: true });
console.log(`\nAll three v${V} packages built. Edge == Chrome MV3; Firefox adds gecko id + background.scripts.`);
