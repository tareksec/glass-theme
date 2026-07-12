# Dallo Neumorphic New Tab

A soft neumorphic (soft UI) Chrome New Tab replacement — Manifest V3, no build step, no external dependencies.

## Files

- `manifest.json` — extension manifest (Manifest V3)
- `index.html` — page markup
- `style.css` — neumorphic design system (light + dark themes)
- `script.js` — clock, search, dark-mode toggle, dropdown panels
- `icons/` — 16px, 48px, 128px extension icons

## Install locally (load unpacked)

1. Download/copy the `chrome-extension/dallo-newtab` folder out of this project onto your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `dallo-newtab` folder.
5. Open a new tab — you should see the Dallo dashboard.

## What's functional

- **Clock** — real analog clock driven by `setInterval` + `Date`, updates every second; date shown as `DD/MM`.
- **Dark mode toggle** — swaps the whole palette to a dark neumorphic theme and remembers your choice via `chrome.storage.local`.
- **Search bar** — press Enter to search Google in the current tab.
- **Bookmarks / Recent Tabs / Shortcuts** — clicking these in the top nav opens a small dropdown. Bookmarks and Recent Tabs pull live data if you add the `"bookmarks"` and `"tabs"` permissions to `manifest.json`; without those permissions they show a friendly empty state instead of erroring. Shortcuts always shows a small fixed set of quick links.
- **List widget, info card, hero illustration** — visual widgets matching the reference layout; the hero illustration is a pure inline SVG (no external image requests).

## Notes

- Everything is self-contained — no CDN fonts, no remote scripts, so it satisfies the default Manifest V3 Content Security Policy.
- To enable live Bookmarks/Recent Tabs data, add to `manifest.json`:
  ```json
  "permissions": ["storage", "bookmarks", "tabs"]
  ```
