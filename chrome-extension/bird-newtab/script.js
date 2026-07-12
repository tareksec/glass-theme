/* ============================================================
   Bird Neumorphic New Tab — Behavior
   Vanilla JS, no external dependencies (Manifest V3 CSP safe).

   Storage model (all local to this Chrome profile, no account,
   no sync — see README for details):
     bird_theme      -> "light" | "dark"
     bird_settings   -> { accent: "#hex", ambientEnabled: boolean }
     bird_boards     -> [{ id, name, color, tasks: [{id, text, done}] }]
     bird_info       -> editable bottom info-card content
     bird_shortcuts  -> array of user-added shortcut links
     bird_notes      -> quick-notes textarea content
   ============================================================ */

(function () {
  "use strict";

  const THEME_KEY = "bird_theme";
  const SETTINGS_KEY = "bird_settings";
  const BOARDS_KEY = "bird_boards";
  const INFO_KEY = "bird_info";
  const SHORTCUTS_KEY = "bird_shortcuts";
  const NOTES_KEY = "bird_notes";

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

  function storageRemove(keys) {
    if (hasChromeStorage) {
      chrome.storage.local.remove(keys);
    } else {
      keys.forEach((key) => localStorage.removeItem(key));
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  /* ---------------- Settings (theme, accent, ambient) ---------------- */

  const DEFAULT_SETTINGS = { accent: "#6fae66", ambientEnabled: true };
  const ACCENT_OPTIONS = [
    { value: "#6fae66", name: "Green" },
    { value: "#e9a3ac", name: "Pink" },
    { value: "#eb9f4d", name: "Orange" },
    { value: "#6f9ceb", name: "Blue" },
    { value: "#a58ce0", name: "Purple" },
    { value: "#5cb8ae", name: "Teal" },
  ];

  let settings = { ...DEFAULT_SETTINGS };
  let currentTheme = "light";

  const darkToggle = document.getElementById("darkToggle");
  const settingsDarkToggle = document.getElementById("settingsDarkToggle");
  const settingsAmbientToggle = document.getElementById("settingsAmbientToggle");
  const accentSwatchesEl = document.getElementById("accentSwatches");
  const ambientEl = document.getElementById("ambient");

  function applyTheme(theme) {
    currentTheme = theme;
    const isDark = theme === "dark";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    [darkToggle, settingsDarkToggle].forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark));
    });
  }

  function setTheme(theme) {
    applyTheme(theme);
    storageSet(THEME_KEY, theme);
  }

  function toggleTheme() {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }

  darkToggle.addEventListener("click", toggleTheme);
  settingsDarkToggle.addEventListener("click", toggleTheme);

  function applyAccent(hex) {
    document.documentElement.style.setProperty("--accent", hex);
    accentSwatchesEl.querySelectorAll(".accent-swatch").forEach((el) => {
      el.classList.toggle("selected", el.dataset.value === hex);
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
      btn.setAttribute("aria-label", `${option.name} accent`);
      btn.addEventListener("click", () => {
        settings.accent = option.value;
        applyAccent(option.value);
        storageSet(SETTINGS_KEY, settings);
      });
      accentSwatchesEl.appendChild(btn);
    });
  }

  settingsAmbientToggle.addEventListener("click", () => {
    settings.ambientEnabled = settingsAmbientToggle.getAttribute("aria-pressed") !== "true";
    applyAmbientEnabled(settings.ambientEnabled);
    storageSet(SETTINGS_KEY, settings);
  });

  renderAccentSwatches();

  Promise.all([storageGet(THEME_KEY, "light"), storageGet(SETTINGS_KEY, DEFAULT_SETTINGS)]).then(
    ([theme, storedSettings]) => {
      applyTheme(theme);
      settings = { ...DEFAULT_SETTINGS, ...storedSettings };
      applyAccent(settings.accent);
      applyAmbientEnabled(settings.ambientEnabled);
    }
  );

  /* ---------------- Ambient background: pause when tab is hidden ---------------- */

  function updateAmbientVisibility() {
    ambientEl.classList.toggle("is-paused", document.hidden);
  }

  document.addEventListener("visibilitychange", updateAmbientVisibility);
  updateAmbientVisibility();

  /* ---------------- Settings panel open/close ---------------- */

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const resetBtn = document.getElementById("resetBtn");

  function openSettings() {
    settingsOverlay.hidden = false;
  }

  function closeSettings() {
    settingsOverlay.hidden = true;
  }

  settingsBtn.addEventListener("click", openSettings);
  closeSettingsBtn.addEventListener("click", closeSettings);
  settingsOverlay.addEventListener("click", (event) => {
    if (event.target === settingsOverlay) closeSettings();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !settingsOverlay.hidden) closeSettings();
  });

  resetBtn.addEventListener("click", () => {
    const confirmed = window.confirm(
      "This clears all tasks, notes, shortcuts and settings on this device. This can't be undone. Continue?"
    );
    if (!confirmed) return;

    storageRemove([THEME_KEY, SETTINGS_KEY, BOARDS_KEY, INFO_KEY, SHORTCUTS_KEY, NOTES_KEY]);

    applyTheme("light");
    settings = { ...DEFAULT_SETTINGS };
    applyAccent(settings.accent);
    applyAmbientEnabled(settings.ambientEnabled);

    boards = cloneDefaultBoards();
    storageSet(BOARDS_KEY, boards);
    renderBoards();

    infoData = { ...DEFAULT_INFO };
    renderInfo();

    notesTextarea.value = "";
    updateNotesCount();

    renderShortcuts([]);
    if (activePanel === "shortcuts") loadShortcuts();

    closeSettings();
  });

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

    const hourDeg = hours * 30 + minutes * 0.5;
    const minuteDeg = minutes * 6 + seconds * 0.1;
    const secondDeg = seconds * 6;

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
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  });

  /* ---------------- Task boards (real to-do system) ---------------- */

  const BOARD_COLORS = ["dot-green", "dot-pink", "dot-orange", "dot-blue", "dot-purple", "dot-teal"];

  function cloneDefaultBoards() {
    // Seed with the same look as the original placeholder counts (7/9, 2/4,
    // 5/8) but as real, editable tasks rather than static numbers.
    function seedTasks(total, done, label) {
      const tasks = [];
      for (let i = 1; i <= total; i++) {
        tasks.push({ id: uid("task"), text: `${label} ${i}`, done: i <= done });
      }
      return tasks;
    }
    return [
      { id: uid("board"), name: "Stones", color: "dot-green", tasks: seedTasks(9, 7, "Stones task") },
      { id: uid("board"), name: "Project 007", color: "dot-pink", tasks: seedTasks(4, 2, "Project task") },
      { id: uid("board"), name: "Team mates", color: "dot-orange", tasks: seedTasks(8, 5, "Team task") },
    ];
  }

  const CHECK_ICON =
    '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>';
  const CHEVRON_ICON =
    '<svg class="board-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

  const boardList = document.getElementById("boardList");
  const addBoardBtn = document.getElementById("addBoardBtn");
  let boards = [];
  let expandedBoardId = null;

  function boardProgress(board) {
    const total = board.tasks.length;
    const done = board.tasks.filter((t) => t.done).length;
    return { done, total };
  }

  function saveBoards() {
    storageSet(BOARDS_KEY, boards);
  }

  function renderBoards() {
    boardList.innerHTML = "";
    boards.forEach((board) => {
      const { done, total } = boardProgress(board);
      const isExpanded = board.id === expandedBoardId;

      const li = document.createElement("li");
      li.className = `board${isExpanded ? " expanded" : ""}`;
      li.dataset.id = board.id;

      li.innerHTML = `
        <div class="board-row" data-role="toggle">
          <span class="dot ${board.color}"></span>
          <span class="board-name">${escapeHtml(board.name)}</span>
          <span class="board-progress">${done}/${total}</span>
          <button type="button" class="board-icon-btn" data-role="rename" title="Rename board" aria-label="Rename ${escapeHtml(board.name)}">&#9998;</button>
          <button type="button" class="board-icon-btn" data-role="delete" title="Delete board" aria-label="Delete ${escapeHtml(board.name)}">&#128465;</button>
          ${CHEVRON_ICON}
        </div>
        <div class="board-tasks-wrap">
          <ul class="task-list" data-role="task-list"></ul>
          <div class="task-add-row">
            <input type="text" class="task-add-input" data-role="task-input" placeholder="Add a task..." />
            <button type="button" class="task-add-btn" data-role="task-add">Add</button>
          </div>
        </div>
      `;

      const taskListEl = li.querySelector('[data-role="task-list"]');
      renderTasks(taskListEl, board);

      boardList.appendChild(li);
    });
    updateStats();
  }

  function renderTasks(taskListEl, board) {
    taskListEl.innerHTML = "";
    if (board.tasks.length === 0) {
      taskListEl.innerHTML = '<li class="panel-empty">No tasks yet — add one below.</li>';
      return;
    }
    board.tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <button type="button" class="task-checkbox${task.done ? " done" : ""}" data-role="task-toggle" data-task-id="${task.id}" aria-label="${task.done ? "Mark incomplete" : "Mark complete"}">${task.done ? CHECK_ICON : ""}</button>
        <span class="task-text${task.done ? " done" : ""}">${escapeHtml(task.text)}</span>
        <button type="button" class="task-remove" data-role="task-remove" data-task-id="${task.id}" aria-label="Delete task">&times;</button>
      `;
      taskListEl.appendChild(li);
    });
  }

  function findBoard(id) {
    return boards.find((b) => b.id === id);
  }

  boardList.addEventListener("click", (event) => {
    const boardEl = event.target.closest(".board");
    if (!boardEl) return;
    const boardId = boardEl.dataset.id;
    const board = findBoard(boardId);
    if (!board) return;

    const renameBtn = event.target.closest('[data-role="rename"]');
    const deleteBtn = event.target.closest('[data-role="delete"]');
    const toggleRow = event.target.closest('[data-role="toggle"]');
    const taskToggle = event.target.closest('[data-role="task-toggle"]');
    const taskRemove = event.target.closest('[data-role="task-remove"]');
    const addBtn = event.target.closest('[data-role="task-add"]');

    if (renameBtn) {
      const newName = window.prompt("Rename board:", board.name);
      if (newName && newName.trim()) {
        board.name = newName.trim();
        saveBoards();
        renderBoards();
      }
      return;
    }

    if (deleteBtn) {
      const confirmed = window.confirm(`Delete "${board.name}" and all its tasks?`);
      if (confirmed) {
        boards = boards.filter((b) => b.id !== boardId);
        if (expandedBoardId === boardId) expandedBoardId = null;
        saveBoards();
        renderBoards();
      }
      return;
    }

    if (taskToggle) {
      const task = board.tasks.find((t) => t.id === taskToggle.dataset.taskId);
      if (task) {
        task.done = !task.done;
        saveBoards();
        renderBoards();
      }
      return;
    }

    if (taskRemove) {
      board.tasks = board.tasks.filter((t) => t.id !== taskRemove.dataset.taskId);
      saveBoards();
      renderBoards();
      return;
    }

    if (addBtn) {
      addTaskFromInput(boardEl, board);
      return;
    }

    if (toggleRow) {
      expandedBoardId = expandedBoardId === boardId ? null : boardId;
      renderBoards();
    }
  });

  boardList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const input = event.target.closest('[data-role="task-input"]');
    if (!input) return;
    event.preventDefault();
    const boardEl = event.target.closest(".board");
    const board = findBoard(boardEl.dataset.id);
    if (board) addTaskFromInput(boardEl, board);
  });

  function addTaskFromInput(boardEl, board) {
    const input = boardEl.querySelector('[data-role="task-input"]');
    const text = input.value.trim();
    if (!text) return;
    board.tasks.push({ id: uid("task"), text, done: false });
    saveBoards();
    renderBoards();
    // Re-focus the (freshly re-rendered) input for fast repeated entry.
    const freshBoardEl = boardList.querySelector(`.board[data-id="${board.id}"]`);
    if (freshBoardEl) {
      const freshInput = freshBoardEl.querySelector('[data-role="task-input"]');
      if (freshInput) freshInput.focus();
    }
  }

  addBoardBtn.addEventListener("click", () => {
    const name = window.prompt("New board name:");
    if (!name || !name.trim()) return;
    const color = BOARD_COLORS[boards.length % BOARD_COLORS.length];
    const board = { id: uid("board"), name: name.trim(), color, tasks: [] };
    boards.push(board);
    expandedBoardId = board.id;
    saveBoards();
    renderBoards();
  });

  storageGet(BOARDS_KEY, null).then((stored) => {
    boards = stored && stored.length ? stored : cloneDefaultBoards();
    if (!stored) saveBoards();
    renderBoards();
  });

  /* ---------------- This week mini stats strip ---------------- */

  const statCompletedEl = document.getElementById("statCompleted");
  const statStreakEl = document.getElementById("statStreak");
  const statOpenEl = document.getElementById("statOpen");

  function updateStats() {
    let done = 0;
    let open = 0;
    boards.forEach((board) => {
      board.tasks.forEach((task) => {
        if (task.done) done += 1;
        else open += 1;
      });
    });
    statCompletedEl.textContent = String(done);
    statOpenEl.textContent = String(open);
    // Simple, honest streak proxy: any day with at least one completed task
    // counts. We don't track per-day history yet, so approximate with a
    // small positive number once the user has completed anything today.
    statStreakEl.textContent = done > 0 ? "1" : "0";
  }

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

    const newUrl = window.prompt("Link URL (leave blank for no link):", infoData.linkUrl);
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

  /* ---------------- Quick Notes widget ---------------- */

  const notesTextarea = document.getElementById("notesTextarea");
  const notesCount = document.getElementById("notesCount");
  let notesSaveTimer = null;

  function updateNotesCount() {
    const length = notesTextarea.value.length;
    notesCount.textContent = `${length} character${length === 1 ? "" : "s"}`;
  }

  notesTextarea.addEventListener("input", () => {
    updateNotesCount();
    if (notesSaveTimer) clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(() => {
      storageSet(NOTES_KEY, notesTextarea.value);
    }, 500);
  });

  storageGet(NOTES_KEY, "").then((notes) => {
    notesTextarea.value = notes;
    updateNotesCount();
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
