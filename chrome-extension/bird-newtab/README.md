# Bird Neumorphic New Tab

A soft neumorphic (soft UI) Chrome New Tab replacement — Manifest V3, no build step, no external dependencies.

## Files

- `manifest.json` — extension manifest (Manifest V3)
- `index.html` — page markup
- `style.css` — neumorphic design system (light + dark themes, ambient background, settings panel, full-viewport layout)
- `script.js` — clock, search, task boards, notes, settings, live dropdown panels, ambient animation
- `icons/` — 16px, 48px, 128px extension icons

## Install locally (load unpacked)

1. Download/copy the `chrome-extension/bird-newtab` folder out of this project onto your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `bird-newtab` folder.
5. Open a new tab — you should see the Bird dashboard.

## What's functional

### Core
- **Clock** — real analog clock (`setInterval` + `Date`), updates every second, shows date (`DD/MM`) and day of week.
- **Search bar** — press Enter to search Google in the current tab.
- **Bookmarks** — reads real Chrome bookmarks (`chrome.bookmarks.getTree`), click to open.
- **Recent Tabs** — reads currently open tabs (`chrome.tabs.query`), sorted by recency, click to switch to that tab.
- **Shortcuts** — user-added links, add/remove from the dropdown panel.

### Task boards (replaces the old Stones/Project 007/Team mates placeholder)
- Click a board row to expand it inline and see its tasks.
- Add a task (type + Enter, or the Add button), check tasks off (with a small checkmark animation), delete tasks.
- The `done/total` counter next to each board name is computed live from real task data — it's not a static number anymore.
- Rename a board with the pencil icon, delete a board (with confirmation) with the trash icon, or add a new board with "+ Add board".
- Everything is stored under `bird_boards` as `[{ id, name, color, tasks: [{ id, text, done }] }]`.

### Quick Notes
- A single autosaving textarea (bottom-right, under the hero card). Saves 500ms after you stop typing, with a live character count.

### This week stats strip
- Bottom-left, under the "Focus on tasks" card. Shows tasks completed, a simple day-streak indicator, and tasks still open — all derived live from the task board data (kept intentionally simple; there's no per-day history yet, so the streak is a basic "did you complete anything" signal rather than a full multi-day tracker).

### Settings (gear icon, top-right)
- **Accent color** — 6 presets that recolor toggles, the clock's second hand, and stat highlights. Board dots keep their own distinct per-board colors so boards stay visually distinguishable regardless of accent choice.
- **Dark mode** — now lives here and is the single source of truth; the clock widget's toggle is a shortcut to the same setting, not a separate one — flipping either updates both.
- **Ambient background** — on/off switch for the soft drifting-blob background (see Performance below). Off by default is not the case — it ships ON, since the effect is intentionally subtle and cheap.
- **Reset all data** — clears tasks, notes, shortcuts and settings after a confirmation prompt, back to the extension's defaults.

### Ambient background — performance notes
- Three blurred, low-opacity radial-gradient blobs behind the dashboard, animated purely with CSS `transform`/`opacity` (`translate` + `scale`) — no layout-triggering properties are ever animated.
- Respects `prefers-reduced-motion: reduce` (animation fully disabled via a CSS media query), independent of the manual Settings toggle.
- Paused automatically via the Page Visibility API when the tab isn't focused/visible (`animation-play-state: paused`), so it doesn't spend GPU time in background tabs.
- Verified with Chrome DevTools' Performance panel: recording several seconds with the ambient background on shows compositor-only work (no Layout/Paint entries attributable to the blobs) and negligible main-thread CPU — the only main-thread cost is the once-per-second clock tick and the `visibilitychange` listener, both of which existed before this feature.

## Data & accounts — please read

**There is no login or account system, and there never will be one built into this extension.**

- Everything you see — theme, accent color, ambient toggle, task boards, notes, and shortcuts — is stored locally on this device via `chrome.storage.local`, scoped to this one Chrome profile only.
- None of it syncs across your other computers or Chrome profiles, and none of it is sent anywhere — it never leaves your machine.
- The Bookmarks panel does **not** store its own copy of anything — it reads live from Chrome's native bookmark manager (`chrome://bookmarks`) every time you open it.
- The Recent Tabs panel is also always live — a snapshot of your currently open tabs, not saved history.
- "Reset all data" in Settings is local-only and irreversible; it does not touch your actual Chrome bookmarks or open tabs, only this extension's own stored data (boards, notes, shortcuts, settings).

**If you want your theme/accent settings (not tasks or shortcuts) to follow you across devices signed into the same Chrome account,** swap `chrome.storage.local` for `chrome.storage.sync` for the `bird_theme` / `bird_settings` keys in `script.js`. Only do this for small settings — `chrome.storage.sync` has a much smaller quota than `chrome.storage.local`, so it's not suitable for a growing task/notes/shortcuts data set.

## Validation performed

- `node --check script.js` — no syntax errors.
- Manifest validated as well-formed JSON.
- Every DOM id referenced in `script.js` cross-checked against `index.html` — no mismatches.
- Layout reviewed at 1280px and 1920px+ widths (responsive breakpoint at 860px collapses to a single column and hides the top nav links).
- Data round-trip: boards, notes, shortcuts, theme, and settings are all read back from `chrome.storage.local` on load via `storageGet(...)`, so they persist correctly across closing and reopening a tab.

## Notes

- Everything is self-contained — no CDN fonts, no remote scripts, so it satisfies the default Manifest V3 Content Security Policy. Bookmark favicons are fetched from Google's public favicon service; if you'd rather avoid any outbound network request for favicons, remove the `faviconImg(...)` call in the bookmarks renderer in `script.js`.
- `manifest.json` requests the `storage`, `tabs`, and `bookmarks` permissions to power the live dropdown panels — no new permissions were needed for tasks, notes, settings, or the ambient background, since all of that is local-only.
