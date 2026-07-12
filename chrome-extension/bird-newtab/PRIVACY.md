# Privacy Policy — Bird Neumorphic New Tab

_Last updated: 2026-07-12_

## Summary

Bird does not collect, transmit, sell, or share any data. There is no
account, no login, no analytics, and no server component. Everything the
extension stores lives only on your device, inside this one Chrome
profile.

## What is stored, and where

All extension data is written to `chrome.storage.local`, which is:

- **Local to this device and this Chrome profile.** It does not sync to
  your other computers or other Chrome profiles.
- **Never transmitted anywhere.** Nothing is sent to a server, an
  analytics provider, or any third party — the extension has no backend
  at all.

Data stored:

| Key              | Contents                                              |
| ---------------- | ------------------------------------------------------ |
| `bird_theme`      | Light/dark mode preference                            |
| `bird_settings`   | Accent color, ambient background on/off                |
| `bird_boards`     | Your task boards and tasks                             |
| `bird_info`       | The editable hero card text/link                       |
| `bird_shortcuts`  | Shortcuts you've added                                  |
| `bird_notes`      | The Quick Notes textarea content                        |

## Live, read-only browser data

The Bookmarks and Recent Tabs panels do not copy or store anything of
their own — they read directly from Chrome's native APIs each time you
open them:

- **Bookmarks** (`chrome.bookmarks`): reads your existing bookmark tree to
  show it in the panel. Nothing is added, changed, or removed.
- **Recent Tabs** (`chrome.tabs`): reads your currently open tabs so you
  can switch to one. This is a live snapshot, not saved history.

## Network requests

The only outbound requests this extension makes are:

1. **Google Search** — when you press Enter in the search bar, your
   browser navigates to `google.com/search`. This is a normal,
   user-initiated page navigation, not a background call, and is no
   different from typing the same search into your address bar.
2. **Bookmark favicons** — the Bookmarks panel loads small favicon images
   from Google's public favicon service (`google.com/s2/favicons`) so
   each bookmark shows its site icon. If you'd rather avoid this, remove
   the `faviconImg(...)` call in `js/panels.js`.

No other network requests are made. There are no analytics pings, no
crash reporters, and no remote configuration fetches.

## Permissions and why they're needed

| Permission  | Why Bird needs it                                                        |
| ----------- | -------------------------------------------------------------------------- |
| `storage`   | Save your tasks, notes, shortcuts, and settings locally.                   |
| `bookmarks` | Show your real bookmarks in the Bookmarks panel.                           |
| `tabs`      | List and switch between your currently open tabs in the Recent Tabs panel. |

No other permissions are requested.

## Data deletion

Open **Settings → Reset all data** to permanently delete everything this
extension has stored (tasks, notes, shortcuts, settings). This does not
touch your actual Chrome bookmarks or open tabs — only Bird's own local
data.

Uninstalling the extension also removes all of its stored data, since
`chrome.storage.local` data is deleted along with the extension.

## Changes to this policy

If this policy changes, the update will be reflected here and the
extension version will be bumped.
