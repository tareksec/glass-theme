/* ============================================================
   Bird Neumorphic New Tab — Theme, accent color, ambient toggle
   ============================================================ */

import { THEME_KEY, SETTINGS_KEY, storageGet, storageSet } from "./storage.js";

export const DEFAULT_SETTINGS = { accent: "#6fae66", ambientEnabled: true };
export const ACCENT_OPTIONS = [
  { value: "#6fae66", name: "Green" },
  { value: "#e9a3ac", name: "Pink" },
  { value: "#eb9f4d", name: "Orange" },
  { value: "#6f9ceb", name: "Blue" },
  { value: "#a58ce0", name: "Purple" },
  { value: "#5cb8ae", name: "Teal" },
];

let settings = { ...DEFAULT_SETTINGS };
let currentTheme = "light";

let darkToggle;
let settingsDarkToggle;
let settingsAmbientToggle;
let accentSwatchesEl;
let ambientEl;

export function getSettings() {
  return settings;
}

export function getCurrentTheme() {
  return currentTheme;
}

function applyTheme(theme) {
  currentTheme = theme;
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  [darkToggle, settingsDarkToggle].forEach((btn) => {
    if (btn) btn.setAttribute("aria-pressed", String(isDark));
  });
}

function setTheme(theme) {
  applyTheme(theme);
  storageSet(THEME_KEY, theme);
}

function toggleTheme() {
  setTheme(currentTheme === "dark" ? "light" : "dark");
}

function applyAccent(hex) {
  document.documentElement.style.setProperty("--accent", hex);
  accentSwatchesEl.querySelectorAll(".accent-swatch").forEach((el) => {
    const isSelected = el.dataset.value === hex;
    el.classList.toggle("selected", isSelected);
    el.setAttribute("aria-checked", String(isSelected));
  });
}

function applyAmbientEnabled(enabled) {
  settingsAmbientToggle.setAttribute("aria-pressed", String(enabled));
  ambientEl.classList.toggle("is-off", !enabled);
}

function renderAccentSwatches() {
  accentSwatchesEl.innerHTML = "";
  ACCENT_OPTIONS.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "accent-swatch";
    btn.style.background = option.value;
    btn.dataset.value = option.value;
    btn.title = option.name;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.setAttribute("aria-label", `${option.name} accent color`);
    btn.addEventListener("click", () => {
      settings.accent = option.value;
      applyAccent(option.value);
      storageSet(SETTINGS_KEY, settings);
    });
    accentSwatchesEl.appendChild(btn);
  });
}

/**
 * Resets in-memory theme/settings state back to defaults and re-renders.
 * Used by "Reset all data" in Settings.
 */
export function resetTheme() {
  applyTheme("light");
  settings = { ...DEFAULT_SETTINGS };
  applyAccent(settings.accent);
  applyAmbientEnabled(settings.ambientEnabled);
}

export function initTheme() {
  darkToggle = document.getElementById("darkToggle");
  settingsDarkToggle = document.getElementById("settingsDarkToggle");
  settingsAmbientToggle = document.getElementById("settingsAmbientToggle");
  accentSwatchesEl = document.getElementById("accentSwatches");
  ambientEl = document.getElementById("ambient");

  darkToggle.addEventListener("click", toggleTheme);
  settingsDarkToggle.addEventListener("click", toggleTheme);

  settingsAmbientToggle.addEventListener("click", () => {
    settings.ambientEnabled = settingsAmbientToggle.getAttribute("aria-pressed") !== "true";
    applyAmbientEnabled(settings.ambientEnabled);
    storageSet(SETTINGS_KEY, settings);
  });

  renderAccentSwatches();

  Promise.all([storageGet(THEME_KEY, "light"), storageGet(SETTINGS_KEY, DEFAULT_SETTINGS)])
    .then(([theme, storedSettings]) => {
      applyTheme(theme);
      settings = { ...DEFAULT_SETTINGS, ...storedSettings };
      applyAccent(settings.accent);
      applyAmbientEnabled(settings.ambientEnabled);
    })
    .catch((err) => {
      // Defensive: even if storage reads fail entirely, render sane
      // first-run defaults instead of leaving the UI in a half-set state.
      console.error("[bird] Failed to load theme/settings, using defaults.", err);
      applyTheme("light");
      applyAccent(settings.accent);
      applyAmbientEnabled(settings.ambientEnabled);
    });

  // Pause the ambient animation when the tab isn't visible (Page
  // Visibility API) so it never spends GPU time in background tabs.
  function updateAmbientVisibility() {
    ambientEl.classList.toggle("is-paused", document.hidden);
  }
  document.addEventListener("visibilitychange", updateAmbientVisibility);
  updateAmbientVisibility();
}
