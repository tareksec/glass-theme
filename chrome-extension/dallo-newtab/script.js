/* ============================================================
   Dallo Neumorphic New Tab — Behavior
   Vanilla JS, no external dependencies (Manifest V3 CSP safe).
   ============================================================ */

(function () {
  "use strict";

  const THEME_KEY = "dallo_theme";

  /* ---------------- Dark mode ---------------- */

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      darkToggle.setAttribute("aria-pressed", "true");
    } else {
      document.documentElement.removeAttribute("data-theme");
      darkToggle.setAttribute("aria-pressed", "false");
    }
  }

  function loadTheme() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([THEME_KEY], (result) => {
        applyTheme(result[THEME_KEY] || "light");
      });
    } else {
      // Fallback for environments without the chrome.storage API
      // (e.g. previewing this page outside the extension context).
      applyTheme(localStorage.getItem(THEME_KEY) || "light");
    }
  }

  function saveTheme(theme) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [THEME_KEY]: theme });
    } else {
      localStorage.setItem(THEME_KEY, theme);
    }
  }

  const darkToggle = document.getElementById("darkToggle");

  darkToggle.addEventListener("click", () => {
    const isDark = darkToggle.getAttribute("aria-pressed") === "true";
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  });

  loadTheme();

  /* ---------------- Analog clock ---------------- */

  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const secondHand = document.getElementById("secondHand");
  const dateValue = document.getElementById("dateValue");

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

  /* ---------------- Top nav dropdown panels ---------------- */

  const navLinks = document.querySelectorAll(".nav-link");
  const navPanel = document.getElementById("navPanel");
  const panelTitle = document.getElementById("panelTitle");
  const panelBody = document.getElementById("panelBody");

  const PANEL_LABELS = {
    bookmarks: "Bookmarks",
    recent: "Recent Tabs",
    shortcuts: "Shortcuts",
  };

  function renderEmpty(message) {
    panelBody.innerHTML = `<span class="panel-empty">${message}</span>`;
  }

  function renderList(items, formatter) {
    if (!items || items.length === 0) {
      renderEmpty("Nothing to show yet.");
      return;
    }
    panelBody.innerHTML = "";
    items.forEach((item) => {
      const el = document.createElement("a");
      el.className = "panel-item";
      el.href = item.url || "#";
      el.textContent = formatter(item);
      panelBody.appendChild(el);
    });
  }

  function loadBookmarks() {
    if (!(typeof chrome !== "undefined" && chrome.bookmarks)) {
      renderEmpty("Bookmarks are unavailable in this context.");
      return;
    }
    chrome.bookmarks.getRecent(8, (nodes) => {
      renderList(nodes, (n) => n.title || n.url);
    });
  }

  function loadRecentTabs() {
    if (!(typeof chrome !== "undefined" && chrome.tabs)) {
      renderEmpty("Recent tabs are unavailable in this context.");
      return;
    }
    chrome.tabs.query({}, (tabs) => {
      const recent = tabs.slice(0, 8);
      renderList(recent, (t) => t.title || t.url);
    });
  }

  function loadShortcuts() {
    const shortcuts = [
      { title: "Gmail", url: "https://mail.google.com" },
      { title: "Calendar", url: "https://calendar.google.com" },
      { title: "Drive", url: "https://drive.google.com" },
      { title: "YouTube", url: "https://youtube.com" },
    ];
    renderList(shortcuts, (s) => s.title);
  }

  function openPanel(panelName) {
    panelTitle.textContent = PANEL_LABELS[panelName] || "";
    navPanel.hidden = false;

    if (panelName === "bookmarks") loadBookmarks();
    else if (panelName === "recent") loadRecentTabs();
    else if (panelName === "shortcuts") loadShortcuts();

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.panel === panelName);
    });
  }

  function closePanel() {
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
