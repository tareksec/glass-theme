/* ============================================================
   Bird Neumorphic New Tab — Storage helpers
   Wraps chrome.storage.local (with a localStorage fallback for
   previewing this page outside the extension context) and adds
   defensive error handling: chrome.runtime.lastError checks,
   quota-exceeded handling, and JSON.parse guards against
   corrupted data.
   ============================================================ */

export const THEME_KEY = "bird_theme";
export const SETTINGS_KEY = "bird_settings";
export const BOARDS_KEY = "bird_boards";
export const INFO_KEY = "bird_info";
export const SHORTCUTS_KEY = "bird_shortcuts";
export const NOTES_KEY = "bird_notes";

export const hasChromeStorage =
  typeof chrome !== "undefined" && !!(chrome.storage && chrome.storage.local);

/**
 * Safely parse JSON from storage. Corrupted/legacy data should never crash
 * the page — fall back to the provided default instead.
 */
function safeParse(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("[bird] Corrupted stored value, using default.", err);
    return fallback;
  }
}

export function storageGet(key, fallback) {
  return new Promise((resolve) => {
    if (hasChromeStorage) {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[bird] storage.get failed:", chrome.runtime.lastError.message);
            resolve(fallback);
            return;
          }
          resolve(key in result ? result[key] : fallback);
        });
      } catch (err) {
        console.error("[bird] storage.get threw:", err);
        resolve(fallback);
      }
    } else {
      // Fallback for previewing this page outside the extension context.
      let raw = null;
      try {
        raw = localStorage.getItem(key);
      } catch (err) {
        console.error("[bird] localStorage.getItem failed:", err);
      }
      resolve(raw ? safeParse(raw, fallback) : fallback);
    }
  });
}

/**
 * Writes a value to storage. Returns a promise that resolves to true/false
 * so callers can react to failures (e.g. quota exceeded) without throwing.
 */
export function storageSet(key, value) {
  return new Promise((resolve) => {
    if (hasChromeStorage) {
      try {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            console.error("[bird] storage.set failed:", chrome.runtime.lastError.message);
            resolve(false);
            return;
          }
          resolve(true);
        });
      } catch (err) {
        console.error("[bird] storage.set threw:", err);
        resolve(false);
      }
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        resolve(true);
      } catch (err) {
        // Covers QuotaExceededError and any other storage failure.
        console.error("[bird] localStorage.setItem failed:", err);
        resolve(false);
      }
    }
  });
}

export function storageRemove(keys) {
  return new Promise((resolve) => {
    if (hasChromeStorage) {
      try {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            console.error("[bird] storage.remove failed:", chrome.runtime.lastError.message);
          }
          resolve();
        });
      } catch (err) {
        console.error("[bird] storage.remove threw:", err);
        resolve();
      }
    } else {
      keys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error("[bird] localStorage.removeItem failed:", err);
        }
      });
      resolve();
    }
  });
}
