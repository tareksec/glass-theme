# Bird Neumorphic New Tab

A soft neumorphic (soft UI) Chrome New Tab replacement — Manifest V3, no build step, no external dependencies.

## Files

- `manifest.json` — extension manifest (Manifest V3)
- `index.html` — page markup
- `style.css` — neumorphic design system (light + dark themes, full-viewport layout)
- `script.js` — clock, search, dark-mode toggle, editable widgets, live dropdown panels
- `icons/` — 16px, 48px, 128px extension icons

## Install locally (load unpacked)

1. Download/copy the `chrome-extension/bird-newtab` folder out of this project onto your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `bird-newtab` folder.
5. Open a new tab — you should see the Bird dashboard.

## What's functional

- **Clock** — real analog clock driven by `setInterval` + `Date`, updates every second. Shows today's date (`DD/MM`) and the day of the week underneath.
- **Dark mode toggle** — labeled with a tooltip ("Dark mode"), swaps the whole palette to a dark neumorphic theme, and remembers your choice.
- **Search bar** — press Enter to search Google in the current tab.
- **Bookmarks** — reads your real Chrome bookmarks (`chrome.bookmarks.getTree`) and opens them on click. Shows "No bookmarks yet." if you have none.
- **Recent Tabs** — reads your currently open tabs (`chrome.tabs.query`), sorted by most recently used, with favicons. Clicking one switches to that tab (not a new tab). Shows "No recent tabs yet." if none are open.
- **Shortcuts** — your own pinned links. Use "+ Add shortcut" in the panel to add a name + URL; click the "×" on a shortcut to remove it. Shows "No shortcuts yet — add one below." when empty.
- **List widget** (Stones / Project 007 / Team mates) — click the pencil icon on any row to rename it and edit its folder count, link count, and progress (`done/total`).
- **Info card** ("Focus on tasks that matter") — click the pencil icon to edit its text, its link label, and its link URL (leave the URL blank to make the label plain, non-clickable text).
- Full-viewport layout — the background now fills the entire New Tab window at any size, with content centered and capped at a readable width on ultrawide monitors.

## Data & accounts — please read

**There is no login or account system, and there never will be one built into this extension.**

- Everything you see — your dark mode preference, your edited widget text/counts, and your saved shortcuts — is stored locally on this device via `chrome.storage.local`, scoped to this one Chrome profile only.
- None of it syncs across your other computers or Chrome profiles, and none of it is sent anywhere — it never leaves your machine.
- The Bookmarks panel does **not** store its own copy of anything — it reads live from Chrome's native bookmark manager (`chrome://bookmarks`) every time you open it. Removing/editing a bookmark there is reflected here automatically.
- The Recent Tabs panel is also always live — it's a snapshot of your currently open tabs, not a saved history.

**If you want your dark-mode preference (not shortcuts) to follow you across devices signed into the same Chrome account,** swap `chrome.storage.local` for `chrome.storage.sync` for the `bird_theme` key in `script.js`. Only do this for small settings like that — `chrome.storage.sync` has a much smaller storage quota than `chrome.storage.local`, so it's not suitable for a growing shortcuts list or widget data.

## Notes

- Everything is self-contained — no CDN fonts, no remote scripts, so it satisfies the default Manifest V3 Content Security Policy. Bookmark favicons are fetched from Google's public favicon service; if you'd rather avoid any outbound network request for favicons, remove the `faviconImg(...)` call in the bookmarks renderer in `script.js`.
- `manifest.json` requests the `storage`, `tabs`, and `bookmarks` permissions to power the live dropdown panels.
