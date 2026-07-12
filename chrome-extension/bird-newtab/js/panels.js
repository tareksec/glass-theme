/* ============================================================
   Bird Neumorphic New Tab — Top nav dropdown panels
   (Bookmarks / Recent Tabs / Shortcuts)

   Contents are only fetched/rendered when a panel is opened
   (lazy-render), not on every page load, and both bookmarks/tabs
   API calls degrade gracefully (empty state, not a thrown error)
   when the API is unavailable or the permission was denied.
   ============================================================ */

import { SHORTCUTS_KEY, storageGet, storageSet } from "./storage.js";
import { escapeHtml, uid, normalizeAndValidateUrl } from "./utils.js";

const PANEL_LABELS = {
  bookmarks: "Bookmarks",
  recent: "Recent Tabs",
  shortcuts: "Shortcuts",
};

const PANEL_EMPTY_TEXT = {
  bookmarks: "No bookmarks yet.",
  recent: "No recent tabs yet.",
  shortcuts: "No shortcuts yet — add one below.",
};

let navLinks;
let navPanel;
let panelTitle;
let panelBody;
let panelFooter;
let addShortcutBtn;
let activePanel = null;

function renderEmpty(message) {
  panelBody.innerHTML = "";
  const span = document.createElement("span");
  span.className = "panel-empty";
  span.textContent = message;
  panelBody.appendChild(span);
}

function faviconImg(url) {
  // favIconUrl/constructed favicon URLs are attacker-influenceable (they
  // come from page metadata of arbitrary sites), so escape before
  // inserting into an HTML attribute to prevent attribute-breakout markup
  // injection.
  if (!url) return "";
  return `<img class="favicon" src="${escapeHtml(url)}" alt="" onerror="this.remove()" />`;
}

function flattenBookmarks(nodes, out) {
  for (const node of nodes) {
    if (node.url) {
      out.push(node);
    } else if (node.children) {
      flattenBookmarks(node.children, out);
    }
    if (out.length >= 10) return;
  }
}

function loadBookmarks() {
  const available = typeof chrome !== "undefined" && !!chrome.bookmarks;
  if (!available) {
    renderEmpty("Bookmarks are unavailable — the bookmarks permission may be missing or denied.");
    return;
  }
  try {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        console.error("[bird] bookmarks.getTree failed:", chrome.runtime.lastError.message);
        renderEmpty("Couldn't load bookmarks right now.");
        return;
      }
      const flat = [];
      flattenBookmarks(tree || [], flat);
      if (flat.length === 0) {
        renderEmpty(PANEL_EMPTY_TEXT.bookmarks);
        return;
      }
      panelBody.innerHTML = "";
      flat.forEach((node) => {
        const a = document.createElement("a");
        a.className = "panel-item";
        a.href = node.url;
        a.innerHTML = `${faviconImg(
          `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(node.url)}`
        )}<span>${escapeHtml(node.title || node.url)}</span>`;
        panelBody.appendChild(a);
      });
    });
  } catch (err) {
    console.error("[bird] bookmarks.getTree threw:", err);
    renderEmpty("Couldn't load bookmarks right now.");
  }
}

function loadRecentTabs() {
  const available = typeof chrome !== "undefined" && !!chrome.tabs;
  if (!available) {
    renderEmpty("Recent tabs are unavailable — the tabs permission may be missing or denied.");
    return;
  }
  try {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("[bird] tabs.query failed:", chrome.runtime.lastError.message);
        renderEmpty("Couldn't load recent tabs right now.");
        return;
      }
      const sorted = (tabs || [])
        .slice()
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
        .slice(0, 5);

      if (sorted.length === 0) {
        renderEmpty(PANEL_EMPTY_TEXT.recent);
        return;
      }

      panelBody.innerHTML = "";
      sorted.forEach((tab) => {
        const btn = document.createElement("button");
        btn.className = "panel-item";
        btn.type = "button";
        btn.innerHTML = `${faviconImg(tab.favIconUrl)}<span>${escapeHtml(
          tab.title || tab.url || "Untitled tab"
        )}</span>`;
        btn.addEventListener("click", () => {
          try {
            chrome.tabs.update(tab.id, { active: true }, () => {
              if (chrome.runtime.lastError) {
                console.error("[bird] tabs.update failed:", chrome.runtime.lastError.message);
              }
            });
            if (tab.windowId !== undefined) {
              chrome.windows.update(tab.windowId, { focused: true }, () => {
                if (chrome.runtime.lastError) {
                  console.error("[bird] windows.update failed:", chrome.runtime.lastError.message);
                }
              });
            }
          } catch (err) {
            console.error("[bird] Failed to switch to tab:", err);
          }
        });
        panelBody.appendChild(btn);
      });
    });
  } catch (err) {
    console.error("[bird] tabs.query threw:", err);
    renderEmpty("Couldn't load recent tabs right now.");
  }
}

function renderShortcuts(shortcuts) {
  if (!shortcuts || shortcuts.length === 0) {
    renderEmpty(PANEL_EMPTY_TEXT.shortcuts);
    return;
  }
  panelBody.innerHTML = "";
  shortcuts.forEach((shortcut) => {
    const a = document.createElement("a");
    a.className = "panel-item";
    a.href = shortcut.url;
    a.innerHTML = `<span>${escapeHtml(shortcut.name)}</span><button type="button" class="remove-shortcut" data-id="${shortcut.id}" title="Remove" aria-label="Remove ${escapeHtml(shortcut.name)}">&times;</button>`;
    panelBody.appendChild(a);
  });
}

function loadShortcuts() {
  storageGet(SHORTCUTS_KEY, [])
    .then(renderShortcuts)
    .catch((err) => {
      console.error("[bird] Failed to load shortcuts.", err);
      renderShortcuts([]);
    });
}

function openPanel(panelName) {
  activePanel = panelName;
  panelTitle.textContent = PANEL_LABELS[panelName] || "";
  navPanel.hidden = false;
  panelFooter.hidden = panelName !== "shortcuts";

  // Lazy-render: bookmarks/tabs/shortcuts are only fetched when the panel
  // is actually opened, never eagerly on page load.
  if (panelName === "bookmarks") loadBookmarks();
  else if (panelName === "recent") loadRecentTabs();
  else if (panelName === "shortcuts") loadShortcuts();

  navLinks.forEach((link) => {
    const isActive = link.dataset.panel === panelName;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-expanded", String(isActive));
  });
}

function closePanel() {
  activePanel = null;
  navPanel.hidden = true;
  navLinks.forEach((link) => {
    link.classList.remove("active");
    link.setAttribute("aria-expanded", "false");
  });
}

export function initPanels() {
  navLinks = document.querySelectorAll(".nav-link");
  navPanel = document.getElementById("navPanel");
  panelTitle = document.getElementById("panelTitle");
  panelBody = document.getElementById("panelBody");
  panelFooter = document.getElementById("panelFooter");
  addShortcutBtn = document.getElementById("addShortcutBtn");

  addShortcutBtn.addEventListener("click", () => {
    const name = window.prompt("Shortcut name:");
    if (!name || !name.trim()) return;
    const rawUrl = window.prompt("Shortcut URL:");
    if (!rawUrl) return;
    const url = normalizeAndValidateUrl(rawUrl);
    if (!url) {
      window.alert("Please enter a valid web address (http:// or https://).");
      return;
    }

    storageGet(SHORTCUTS_KEY, []).then((shortcuts) => {
      const next = shortcuts.concat([{ id: uid("sc"), name: name.trim(), url }]);
      storageSet(SHORTCUTS_KEY, next);
      renderShortcuts(next);
    });
  });

  panelBody.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".remove-shortcut");
    if (!removeBtn || activePanel !== "shortcuts") return;
    event.preventDefault();
    storageGet(SHORTCUTS_KEY, []).then((shortcuts) => {
      const next = shortcuts.filter((s) => s.id !== removeBtn.dataset.id);
      storageSet(SHORTCUTS_KEY, next);
      renderShortcuts(next);
    });
  });

  navLinks.forEach((link) => {
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const panelName = link.dataset.panel;
      const isOpen = !navPanel.hidden && link.classList.contains("active");
      if (isOpen) {
        closePanel();
      } else {
        openPanel(panelName);
      }
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInsideNav =
      navPanel.contains(event.target) || Array.from(navLinks).some((link) => link.contains(event.target));
    if (!clickedInsideNav) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !navPanel.hidden) {
      closePanel();
    }
  });
}

export function resetShortcuts() {
  renderShortcuts([]);
  if (activePanel === "shortcuts") loadShortcuts();
}
