/* ============================================================
   Bird Neumorphic New Tab — Shared utilities
   ============================================================ */

/**
 * Escapes a string for safe insertion as text inside HTML markup we build
 * with innerHTML (e.g. templated list rows). Prefer textContent directly
 * wherever possible; this exists for the handful of places that build
 * larger HTML fragments in one shot.
 */
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

export function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Validates that a string is a safe, navigable http(s) URL before it is
 * ever stored or used as an href/window location. Rejects javascript:,
 * data:, and other schemes that could be used for injection.
 */
export function isSafeHttpUrl(candidate) {
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes user-entered shortcut input into a full URL, defaulting to
 * https:// when no scheme was given, then validates the result. Returns
 * null when the input can't be turned into a safe http(s) URL.
 */
export function normalizeAndValidateUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return isSafeHttpUrl(candidate) ? candidate : null;
}

/** Debounce helper used for input-driven storage writes (notes, tasks, etc). */
export function debounce(fn, delayMs) {
  let timer = null;
  return function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}
