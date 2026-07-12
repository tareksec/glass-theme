# Bird Neumorphic New Tab

A soft neumorphic (soft UI) Chrome New Tab replacement — Manifest V3, no
build step required for development, no external runtime dependencies.
Version `1.0.0`.

## What it does

Replaces Chrome's default New Tab page with a soft-UI dashboard: an
analog clock, real editable task boards, a quick notes pad, and fast
access to your bookmarks, currently open tabs, and your own shortcuts —
all stored only on this device.

## Files

- `manifest.json` — extension manifest (Manifest V3)
- `index.html` — page markup
- `style.css` — neumorphic design system (light + dark themes, ambient
  background, settings panel, accessibility helpers, full-viewport layout)
- `js/` — ES module source, one module per widget (`storage.js`,
  `utils.js`, `theme.js`, `clock.js`, `search.js`, `boards.js`,
  `statsStrip.js`, `info.js`, `notes.js`, `panels.js`,
  `settingsPanel.js`, `main.js` entry point)
- `build.mjs` — production build: bundles + minifies `js/` and
  `style.css` into `build/` (see "Production build" below)
- `icons/` — 16px, 48px, 128px extension icons
- `store/` — Chrome Web Store listing assets (promo tile; screenshots to
  be added once the final UI is captured)
- `PRIVACY.md` — full privacy policy / data practices statement

## Install locally (load unpacked)

1. Download/copy the `chrome-extension/bird-newtab` folder out of this
   project onto your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `bird-newtab` folder (or the
   `bird-newtab/build` folder for the minified production bundle — see
   below).
5. Open a new tab — you should see the Bird dashboard.

## Production build

The source in this folder (`js/*.js`, `style.css`) is intentionally
unminified for readability during development. To produce a minified,
Store-ready bundle:

```bash
node build.mjs
```

This bundles the ES modules in `js/` into a single minified
`build/js/main.js`, minifies `style.css` into `build/style.css`, and
copies `manifest.json`, `index.html`, and `icons/` into `build/`. Load
`build/` unpacked to test the production bundle, or zip its contents for
Chrome Web Store upload. The unminified source remains untouched in this
directory either way.

## What's functional

### Core

- **Clock** — real analog clock (`setInterval` + `Date`), updates every
  second, shows date (`DD/MM`) and day of week.
- **Search bar** — press Enter to search Google in the current tab.
- **Bookmarks** — reads real Chrome bookmarks (`chrome.bookmarks.getTree`),
  click to open.
- **Recent Tabs** — reads currently open tabs (`chrome.tabs.query`), sorted
  by recency, click to switch to that tab.
- **Shortcuts** — user-added links, add/remove from the dropdown panel.
  URLs are validated (must resolve to a real `http(s)://` address) before
  being saved or opened.

### Task boards (replaces the old Stones/Project 007/Team mates placeholder)

- Click a board row to expand it inline and see its tasks.
- Add a task (type + Enter, or the Add button), check tasks off (with a
  small checkmark animation), delete tasks.
- The `done/total` counter next to each board name is computed live from
  real task data.
- Rename a board with the pencil icon, delete a board (with confirmation)
  with the trash icon, or add a new board with "+ Add board".
- Everything is stored under `bird_boards` as
  `[{ id, name, color, tasks: [{ id, text, done }] }]`.

### Quick Notes

- A single autosaving textarea (bottom-right, under the hero card). Saves
  500ms after you stop typing, with a live character count.

### This week stats strip

- Bottom-left, under the "Focus on tasks" card. Shows tasks completed, a
  simple day-streak indicator, and tasks still open — all derived live
  from the task board data (there's no per-day history yet, so the streak
  is a basic "did you complete anything" signal rather than a full
  multi-day tracker — see Known limitations).

### Settings (gear icon, top-right)

- **Accent color** — 6 presets that recolor toggles, the clock's second
  hand, and stat highlights. Board dots keep their own distinct
  per-board colors so boards stay visually distinguishable regardless of
  accent choice.
- **Dark mode** — the single source of truth; the clock widget's toggle
  is a shortcut to the same setting, not a separate one.
- **Ambient background** — on/off switch for the soft drifting-blob
  background (see Performance below). Ships ON by default.
- **Reset all data** — clears tasks, notes, shortcuts and settings after a
  confirmation prompt, back to the extension's defaults.

## Permissions — full list and why each is needed

| Permission  | Why Bird needs it                                                          |
| ----------- | ---------------------------------------------------------------------------- |
| `storage`   | Save your tasks, notes, shortcuts, and settings locally (`chrome.storage.local`). |
| `bookmarks` | Read your bookmark tree to show it in the Bookmarks panel.                    |
| `tabs`      | List and switch between your currently open tabs (Recent Tabs panel). `activeTab` was considered but doesn't cover listing *all* open tabs, which the Recent Tabs feature needs. |

No other permissions are requested, and the manifest's
`content_security_policy` explicitly blocks remote script execution —
see `manifest.json`.

## Data & privacy — please read

**There is no login or account system, and there never will be one built
into this extension.** See `PRIVACY.md` for the full statement; in short:

- Everything you see — theme, accent color, ambient toggle, task boards,
  notes, and shortcuts — is stored locally on this device via
  `chrome.storage.local`, scoped to this one Chrome profile only.
- None of it syncs across your other computers or Chrome profiles, and
  none of it is sent anywhere — it never leaves your machine.
- The Bookmarks panel does **not** store its own copy of anything — it
  reads live from Chrome's native bookmark manager every time you open
  it. Recent Tabs is likewise always a live snapshot, never saved
  history.
- **No analytics, no third-party sharing, no external network calls**
  except the two documented in `PRIVACY.md` (user-initiated Google search,
  and bookmark favicon images).
- "Reset all data" in Settings is local-only and irreversible; it does not
  touch your actual Chrome bookmarks or open tabs, only this extension's
  own stored data.

**If you want your theme/accent settings (not tasks or shortcuts) to
follow you across devices signed into the same Chrome account,** swap
`chrome.storage.local` for `chrome.storage.sync` for the `bird_theme` /
`bird_settings` keys in `js/theme.js` and `js/storage.js`. Only do this
for small settings — `chrome.storage.sync` has a much smaller quota than
`chrome.storage.local`, so it's not suitable for a growing
task/notes/shortcuts data set.

## Known limitations

- No cross-device sync (see above — everything is `storage.local` by
  design).
- The "Day streak" stat is a simple same-day proxy, not a real multi-day
  streak tracker (no per-day history is recorded yet).
- No Chrome Web Store listing screenshots yet — `store/promo-tile-440x280.png`
  is included; a 1280x800 screenshot should be captured from the final
  installed UI before submitting to the Store.
- Automated Lighthouse/DevTools Performance numbers could not be captured
  in this build environment (a New Tab override page isn't reachable by a
  standalone browser instance here). See "Performance" below for the
  static/manual review performed instead.

## Accessibility

- All interactive controls (toggles, buttons, dropdown triggers, task
  checkboxes, board rows) have `aria-label`/`role`/`aria-pressed`/
  `aria-expanded`/`aria-checked` as appropriate.
- A visible neumorphic focus ring (`:focus-visible`) is defined globally
  in `style.css`, so keyboard users always get a visible focus indicator
  without a mouse-click outline appearing.
- Keyboard support: Tab order follows visual order; Enter/Space activate
  buttons, toggles, and board rows; Escape closes the Settings panel and
  any open dropdown panel (Bookmarks/Recent Tabs/Shortcuts).
- Text color contrast was measured against WCAG AA (4.5:1 for normal
  text) and `--text-secondary` was darkened (light theme) / lightened
  (dark theme) from the original palette to meet it — see the comments
  next to those variables in `style.css`.
- `prefers-reduced-motion: reduce` disables the ambient background
  animation and all other CSS transitions/animations site-wide (see the
  bottom of `style.css`), not just the ambient effect.

## Performance

- The ambient background is animated purely with CSS `transform`/
  `opacity` — no layout-triggering properties are ever animated — and is
  paused via the Page Visibility API when the tab isn't focused.
- Bookmarks, Recent Tabs, and Shortcuts panel contents are only fetched
  and rendered when their panel is opened, never eagerly on page load.
- Notes autosave is debounced (500ms after the user stops typing) so
  typing never triggers a storage write per keystroke.
- The clock tick only ever writes `transform` (compositor-only) and two
  short text nodes per second — no forced reflow.
- `node build.mjs` produces a minified, bundled production build (see
  "Production build" above) for the smallest possible New Tab load size.

## Security

- All user-supplied text (task text, board names, shortcut names,
  bookmark/tab titles, favicon URLs) is escaped via `escapeHtml()` before
  being placed in any HTML template — never inserted as raw `innerHTML`.
- Shortcut URLs and the info card's link URL are validated to be real
  `http(s)://` addresses before being stored or opened, rejecting
  `javascript:` URIs and other unsafe schemes.
- `manifest.json` declares an explicit `content_security_policy` that
  disallows remote script execution; there are no `<script src="http...">`
  tags or CDN references anywhere in the extension.
- Every `chrome.storage`, `chrome.bookmarks`, and `chrome.tabs` call
  checks `chrome.runtime.lastError` and degrades to an empty/default state
  instead of throwing, including when a permission is denied or an API is
  unavailable.

## Validation performed

- `node --input-type=module --check` on every file in `js/` — no syntax
  errors.
- Manifest validated as well-formed JSON (`node -e "JSON.parse(...)"`).
- Every DOM id referenced in `js/*.js` cross-checked against
  `index.html` — no mismatches.
- `node build.mjs` runs clean and produces a working bundled/minified
  build.
- Layout reviewed at 1280px, 1440px, and 1920px+ widths (responsive
  breakpoint at 860px collapses to a single column and hides the top nav
  links).
- Data round-trip: boards, notes, shortcuts, theme, and settings are all
  read back from `chrome.storage.local` on load, with corrupted/missing
  data guarded by try/catch and sensible first-run defaults (see
  `js/storage.js`).
- Manual review of every `innerHTML` write site to confirm all
  user-controlled values pass through `escapeHtml()` first (see
  "Security" above).

## Notes

- Everything is self-contained — no CDN fonts, no remote scripts, so it
  satisfies the Manifest V3 Content Security Policy declared in
  `manifest.json`. Bookmark favicons are fetched from Google's public
  favicon service; if you'd rather avoid any outbound network request for
  favicons, remove the `faviconImg(...)` call in `js/panels.js`.
- `manifest.json` requests the `storage`, `tabs`, and `bookmarks`
  permissions to power the live dropdown panels — no new permissions were
  needed for tasks, notes, settings, or the ambient background, since all
  of that is local-only.
