/* ============================================================
   Bird Neumorphic New Tab — Entry point
   Vanilla JS ES modules, no external dependencies (Manifest V3
   CSP safe, no bundler required for the unpacked/dev build — see
   scripts/build.mjs for the minified production bundle).

   Storage model (all local to this Chrome profile, no account,
   no sync — see README for details):
     bird_theme      -> "light" | "dark"
     bird_settings   -> { accent: "#hex", ambientEnabled: boolean }
     bird_boards     -> [{ id, name, color, tasks: [{id, text, done}] }]
     bird_info       -> editable bottom info-card content
     bird_shortcuts  -> array of user-added shortcut links
     bird_notes      -> quick-notes textarea content
   ============================================================ */

import { initTheme } from "./theme.js";
import { initSettingsPanel } from "./settingsPanel.js";
import { initClock } from "./clock.js";
import { initSearch } from "./search.js";
import { initBoards, resetBoards } from "./boards.js";
import { initStatsStrip, updateStats } from "./statsStrip.js";
import { initInfo, resetInfo } from "./info.js";
import { initNotes, resetNotes } from "./notes.js";
import { initPanels, resetShortcuts } from "./panels.js";

function init() {
  initTheme();
  initClock();
  initSearch();
  initStatsStrip();
  initBoards((boards) => updateStats(boards));
  initInfo();
  initNotes();
  initPanels();

  // "Reset all data" (in Settings) needs every widget to re-render its own
  // first-run defaults after storage is cleared.
  initSettingsPanel(() => {
    resetBoards();
    resetInfo();
    resetNotes();
    resetShortcuts();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
