#!/usr/bin/env node
/* ============================================================
   Bird Neumorphic New Tab — Production build
   Bundles + minifies the ES module source (js/) and style.css into
   build/, alongside the manifest, index.html, and icons, unmodified
   source stays in this directory for development ("Load unpacked").

   Usage: node build.mjs
   Output: chrome-extension/bird-newtab/build/  (zip this for the
   Chrome Web Store, or "Load unpacked" it directly to test the
   production bundle).
   ============================================================ */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, cpSync, statSync, rmSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, "build");

function humanSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function run() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(path.join(outDir, "js"), { recursive: true });

  // 1. Bundle + minify JS (esbuild resolves the ES module import graph
  // starting at main.js into a single file, then minifies it). Invoked via
  // its CLI through npx so no extra dependency needs to live in
  // package.json for this no-build-step-by-default extension.
  const jsSrcSize = readdirSync(path.join(dir, "js"))
    .filter((f) => f.endsWith(".js"))
    .reduce((sum, f) => sum + statSync(path.join(dir, "js", f)).size, 0);
  const jsFileCount = readdirSync(path.join(dir, "js")).filter((f) => f.endsWith(".js")).length;
  execSync(
    `npx --yes esbuild "${path.join(dir, "js/main.js")}" --bundle --minify --format=esm --target=chrome111 --outfile="${path.join(outDir, "js/main.js")}"`,
    { stdio: "inherit" }
  );
  const jsOutSize = statSync(path.join(outDir, "js/main.js")).size;

  // 2. Minify CSS (clean-css via its CLI, invoked with npx so no extra
  // dependency needs to live in package.json for a no-build-step
  // extension).
  const cssSrcSize = statSync(path.join(dir, "style.css")).size;
  execSync(
    `npx --yes clean-css-cli -o "${path.join(outDir, "style.css")}" "${path.join(dir, "style.css")}"`,
    { stdio: "inherit" }
  );
  const cssOutSize = statSync(path.join(outDir, "style.css")).size;

  // 3. Copy static assets as-is.
  cpSync(path.join(dir, "manifest.json"), path.join(outDir, "manifest.json"));
  cpSync(path.join(dir, "icons"), path.join(outDir, "icons"), { recursive: true });

  let html = readFileSync(path.join(dir, "index.html"), "utf8");
  html = html.replace('<script src="js/main.js" type="module"></script>', '<script src="js/main.js" type="module"></script>');
  writeFileSync(path.join(outDir, "index.html"), html);

  console.log("\nBuild complete -> chrome-extension/bird-newtab/build/\n");
  console.log(`  js/main.js  ${humanSize(jsSrcSize)} (${jsFileCount} source files) -> ${humanSize(jsOutSize)} bundled+minified`);
  console.log(`  style.css   ${humanSize(cssSrcSize)} -> ${humanSize(cssOutSize)} minified`);
  console.log("\nLoad build/ unpacked to test the production bundle, or zip its contents for Web Store upload.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
