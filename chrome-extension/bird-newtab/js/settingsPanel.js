/* ============================================================
   Bird Neumorphic New Tab — Settings overlay open/close + reset
   ============================================================ */

import {
  THEME_KEY,
  SETTINGS_KEY,
  BOARDS_KEY,
  INFO_KEY,
  SHORTCUTS_KEY,
  NOTES_KEY,
  storageRemove,
  storageSet,
} from "./storage.js";
import { resetTheme, getSettings } from "./theme.js";

let settingsOverlay;
let onReset = () => {};

export function isSettingsOpen() {
  return settingsOverlay && !settingsOverlay.hidden;
}

export function closeSettings() {
  settingsOverlay.hidden = true;
}

function openSettings() {
  settingsOverlay.hidden = false;
}

/**
 * @param {Function} resetCallback - invoked after storage is cleared so
 *   other modules (boards, info, notes, shortcuts) can re-render their own
 *   first-run defaults. Keeps this module from needing to know about every
 *   other widget's internals.
 */
export function initSettingsPanel(resetCallback) {
  onReset = resetCallback || onReset;

  const settingsBtn = document.getElementById("settingsBtn");
  settingsOverlay = document.getElementById("settingsOverlay");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const resetBtn = document.getElementById("resetBtn");

  settingsBtn.addEventListener("click", openSettings);
  closeSettingsBtn.addEventListener("click", closeSettings);
  settingsOverlay.addEventListener("click", (event) => {
    if (event.target === settingsOverlay) closeSettings();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !settingsOverlay.hidden) closeSettings();
  });

  resetBtn.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "This clears all tasks, notes, shortcuts and settings on this device. This can't be undone. Continue?"
    );
    if (!confirmed) return;

    await storageRemove([THEME_KEY, SETTINGS_KEY, BOARDS_KEY, INFO_KEY, SHORTCUTS_KEY, NOTES_KEY]);
    resetTheme();
    onReset();
    closeSettings();
  });
}

export { getSettings };
