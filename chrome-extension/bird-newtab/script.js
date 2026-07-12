/* ============================================================
   Bird Neumorphic New Tab — Behavior
   Vanilla JS, no external dependencies (Manifest V3 CSP safe).

   Storage model (all local to this Chrome profile, no account,
   no sync — see README for details):
     bird_theme         -> "light" | "dark"
     bird_widget_items  -> array of editable list-widget rows
     bird_info          -> editable bottom info-card content
     bird_shortcuts     -> array of user-added shortcut links
   ============================================================ */

(function () {
  "use strict";

  const THEME_KEY = "bird_theme";
  const ITEMS_KEY = "bird_widget_items";
  const INFO_KEY = "bird_info";
  const SHORTCUTS_KEY = "bird_shortcuts";

  const hasChromeStorage =
    typeof chrome !== "undefined" && !!(chrome.storage && chrome.storage.local);

  function storageGet(key, fallback) {
    return new Promise((resolve) => {
      if (hasChromeStorage) {
        chrome.storage.local.get([key], (result) => {
          resolve(key in result ? result[key] : fallback);
        });
      } else {
        // Fallback for previewing this page outside the extension context.
        const raw = localStorage.getItem(key);
        resolve(raw ? JSON.parse(raw) : fallback);
      }
    });
  }

  function storageSet(key, value) {
    if (hasChromeStorage) {
      chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  /* ---------------- Dark mode ---------------- */

  const darkToggle = document.getElementById("darkToggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      darkToggle.setAttribute("aria-pressed", "true");
    } else {
      document.documentElement.removeAttribute("data-theme");
      darkToggle.setAttribute("aria-pressed", "false");
    }
  }

  darkToggle.addEventListener("click", () => {
    const isDark = darkToggle.getAttribute("aria-pressed") === "true";
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    storageSet(THEME_KEY, next);
  });

  storageGet(THEME_KEY, "light").then(applyTheme);

  /* ---------------- Analog clock ---------------- */

  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const secondHand = document.getElementById("secondHand");
  const dateValue = document.getElementById("dateValue");
  const dayValue = document.getElementById("dayValue");

  function updateClock() {
    const now = new Date();

    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourDeg = hours * 30 + minutes * 0.5; // 360 / 12, plus drift from minutes
    const minuteDeg = minutes * 6 + seconds * 0.1; // 360 / 60, plus drift from seconds
    const secondDeg = seconds * 6; // 360 / 60

    hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    dateValue.textContent = `${day}/${month}`;
    dayValue.textContent = now.toLocaleDateString(undefined, { weekday: "long" });
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* ---------------- Search bar ---------------- */

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.location.href = url;
  });

  /* ---------------- Editable list widget (Stones / Project 007 / Team mates) ---------------- */

  const DEFAULT_ITEMS = [
    { id: "item-1", name: "Stones", dot: "dot-green", folders: 2, links: 4, done: 7, total: 9 },
    { id: "item-2", name: "Project 007", dot: "dot-pink", folders: 0, links: 4, done: 2, total: 4 },
    { id: "item-3", name: "Team mates", dot: "dot-orange", folders: 0, links: 0, done: 5, total: 8 },
  ];

  const ICON_FOLDER =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z"/></svg>';
  const ICON_LINK =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
  const ICON_CHECK =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>';

  const itemList = document.getElementById("itemList");
  let widgetItems = [];

  function renderItems() {
    itemList.innerHTML = "";
    widgetItems.forEach((item) => {
      const li = document.createElement("li");
      li.className = "item-row";
      li.innerHTML = `
        <span class="dot ${item.dot}"></span>
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span class="item-meta">
          ${ICON_FOLDER} ${item.folders}
          ${ICON_LINK} ${item.links}
          ${ICON_CHECK} ${item.done}/${item.total}
        </span>
        <button class="item-edit-btn" data-id="${item.id}" title="Edit" aria-label="Edit ${escapeHtml(item.name)}">&#9998;</button>
      `;
      itemList.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function editItem(id) {
    const item = widgetItems.find((i) => i.id === id);
    if (!item) return;

    const newName = window.prompt("Rename item:", item.name);
    if (newName === null) return;

    const newFolders = window.prompt("Folder count:", String(item.folders));
    if (newFolders === null) return;

    const newLinks = window.prompt("Link count:", String(item.links));
    if (newLinks === null) return;

    const newProgress = window.prompt(
      "Progress (done/total, e.g. 7/9):",
      `${item.done}/${item.total}`
    );
    if (newProgress === null) return;

    const match = newProgress.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);

    item.name = newName.trim() || item.name;
    item.folders = clampInt(newFolders, item.folders);
    item.links = clampInt(newLinks, item.links);
    if (match) {
      item.done = clampInt(match[1], item.done);
      item.total = clampInt(match[2], item.total);
    }

    storageSet(ITEMS_KEY, widgetItems);
    renderItems();
  }

  function clampInt(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  }

  itemList.addEventListener("click", (event) => {
    const btn = event.target.closest(".item-edit-btn");
    if (!btn) return;
    editItem(btn.dataset.id);
  });

  storageGet(ITEMS_KEY, DEFAULT_ITEMS).then((items) => {
    widgetItems = items;
    renderItems();
  });

  /* ---------------- Editable info card ---------------- */

  const DEFAULT_INFO = {
    text: "Focus on tasks\nthat matter",
    linkLabel: "Learn more",
    linkUrl: "",
  };

  const infoParagraph = document.getElementById("infoParagraph");
  const infoLink = document.getElementById("infoLink");
  const infoLinkLabel = document.getElementById("infoLinkLabel");
  const editInfoBtn = document.getElementById("editInfoBtn");
  let infoData = { ...DEFAULT_INFO };

  function renderInfo() {
    infoParagraph.innerHTML = escapeHtml(infoData.text).replace(/\n/g, "<br />");
    infoLinkLabel.textContent = infoData.linkLabel;
    infoLink.href = infoData.linkUrl || "#";
    infoLink.classList.toggle("is-empty-link", !infoData.linkUrl);
  }

  infoLink.addEventListener("click", (event) => {
    if (!infoData.linkUrl) event.preventDefault();
  });

  editInfoBtn.addEventListener("click", () => {
    const newText = window.prompt("Card text:", infoData.text);
    if (newText === null) return;

    const newLabel = window.prompt("Link label:", infoData.linkLabel);
    if (newLabel === null) return;

    const newUrl = window.prompt(
      "Link URL (leave blank for no link):",
      infoData.linkUrl
    );
    if (newUrl === null) return;

    infoData = {
      text: newText.trim() || infoData.text,
      linkLabel: newLabel.trim() || infoData.linkLabel,
      linkUrl: newUrl.trim(),
    };

    storageSet(INFO_KEY, infoData);
    renderInfo();
  });

  storageGet(INFO_KEY, DEFAULT_INFO).then((info) => {
    infoData = { ...DEFAULT_INFO, ...info };
    renderInfo();
  });

  /* ---------------- Top nav dropdown panels ---------------- */

  const navLinks = document.querySelectorAll(".nav-link");
  const navPanel = document.getElementById("navPanel");
  const panelTitle = document.getElementById("panelTitle");
  const panelBody = document.getElementById("panelBody");
  const panelFooter = document.getElementById("panelFooter");
  const addShortcutBtn = document.getElementById("addShortcutBtn");

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

  let activePanel = null;

  function renderEmpty(message) {
    panelBody.innerHTML = `<span class="panel-empty">${message}</span>`;
  }

  function faviconImg(url) {
    if (!url) return "";
    return `<img class="favicon" src="${url}" alt="" onerror="this.remove()" />`;
  }

  /* --- Bookmarks: flatten the bookmark tree, skip folders, cap at 10 --- */

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
    if (!(typeof chrome !== "undefined" && chrome.bookmarks)) {
      renderEmpty("Bookmarks are unavailable in this context.");
      return;
    }
    chrome.bookmarks.getTree((tree) => {
      const flat = [];
      flattenBookmarks(tree, flat);
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
  }

  /* --- Recent tabs: last 5 by recency, clicking switches to that tab --- */

  function loadRecentTabs() {
    if (!(typeof chrome !== "undefined" && chrome.tabs)) {
      renderEmpty("Recent tabs are unavailable in this context.");
      return;
    }
    chrome.tabs.query({}, (tabs) => {
      const sorted = tabs
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
          chrome.tabs.update(tab.id, { active: true });
          if (tab.windowId !== undefined) {
            chrome.windows.update(tab.windowId, { focused: true });
          }
        });
        panelBody.appendChild(btn);
      });
    });
  }

  /* --- Shortcuts: user-managed list stored in chrome.storage.local --- */

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
    storageGet(SHORTCUTS_KEY, []).then(renderShortcuts);
  }

  function normalizeUrl(input) {
    const trimmed = input.trim();
    if (!trimmed) return "";
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  addShortcutBtn.addEventListener("click", () => {
    const name = window.prompt("Shortcut name:");
    if (!name) return;
    const rawUrl = window.prompt("Shortcut URL:");
    if (!rawUrl) return;
    const url = normalizeUrl(rawUrl);

    storageGet(SHORTCUTS_KEY, []).then((shortcuts) => {
      const next = shortcuts.concat([{ id: `sc-${Date.now()}`, name: name.trim(), url }]);
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

  function openPanel(panelName) {
    activePanel = panelName;
    panelTitle.textContent = PANEL_LABELS[panelName] || "";
    navPanel.hidden = false;
    panelFooter.hidden = panelName !== "shortcuts";

    if (panelName === "bookmarks") loadBookmarks();
    else if (panelName === "recent") loadRecentTabs();
    else if (panelName === "shortcuts") loadShortcuts();

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.panel === panelName);
    });
  }

  function closePanel() {
    activePanel = null;
    navPanel.hidden = true;
    navLinks.forEach((link) => link.classList.remove("active"));
  }

  navLinks.forEach((link) => {
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
      navPanel.contains(event.target) ||
      Array.from(navLinks).some((link) => link.contains(event.target));
    if (!clickedInsideNav) {
      closePanel();
    }
  });
})();
