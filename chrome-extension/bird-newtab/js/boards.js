/* ============================================================
   Bird Neumorphic New Tab — Task boards widget
   Real to-do system persisted to chrome.storage.local. All user
   text (task text, board names) is rendered via escapeHtml before
   being placed in innerHTML, and task-add writes are debounced-free
   but batched into a single re-render per action to avoid thrashing.
   ============================================================ */

import { BOARDS_KEY, storageGet, storageSet } from "./storage.js";
import { escapeHtml, uid } from "./utils.js";

const BOARD_COLORS = ["dot-green", "dot-pink", "dot-orange", "dot-blue", "dot-purple", "dot-teal"];

const CHECK_ICON =
  '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>';
const CHEVRON_ICON =
  '<svg class="board-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

let boardList;
let addBoardBtn;
let boards = [];
let expandedBoardId = null;
let onStatsChange = () => {};

function cloneDefaultBoards() {
  // Seed with the same look as the original placeholder counts (7/9, 2/4,
  // 5/8) but as real, editable tasks rather than static numbers. This is
  // the first-run state: a fresh install always gets these sensible
  // defaults, never undefined/empty renders.
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

function boardProgress(board) {
  const total = board.tasks.length;
  const done = board.tasks.filter((t) => t.done).length;
  return { done, total };
}

function saveBoards() {
  storageSet(BOARDS_KEY, boards);
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
      <button type="button" class="task-checkbox${task.done ? " done" : ""}" data-role="task-toggle" data-task-id="${task.id}" role="checkbox" aria-checked="${task.done}" aria-label="${escapeHtml(task.text)}">${task.done ? CHECK_ICON : ""}</button>
      <span class="task-text${task.done ? " done" : ""}">${escapeHtml(task.text)}</span>
      <button type="button" class="task-remove" data-role="task-remove" data-task-id="${task.id}" aria-label="Delete task ${escapeHtml(task.text)}">&times;</button>
    `;
    taskListEl.appendChild(li);
  });
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
      <div class="board-row" data-role="toggle" role="button" tabindex="0" aria-expanded="${isExpanded}" aria-label="${escapeHtml(board.name)} board, ${done} of ${total} tasks done">
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
          <label class="visually-hidden" for="task-input-${board.id}">Add a task to ${escapeHtml(board.name)}</label>
          <input type="text" id="task-input-${board.id}" class="task-add-input" data-role="task-input" placeholder="Add a task..." />
          <button type="button" class="task-add-btn" data-role="task-add">Add</button>
        </div>
      </div>
    `;

    const taskListEl = li.querySelector('[data-role="task-list"]');
    renderTasks(taskListEl, board);

    boardList.appendChild(li);
  });
  onStatsChange(boards);
}

function findBoard(id) {
  return boards.find((b) => b.id === id);
}

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

function toggleExpanded(boardId) {
  expandedBoardId = expandedBoardId === boardId ? null : boardId;
  renderBoards();
}

function handleBoardListClick(event) {
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
    toggleExpanded(boardId);
  }
}

function handleBoardListKeydown(event) {
  const input = event.target.closest('[data-role="task-input"]');
  if (input && event.key === "Enter") {
    event.preventDefault();
    const boardEl = event.target.closest(".board");
    const board = findBoard(boardEl.dataset.id);
    if (board) addTaskFromInput(boardEl, board);
    return;
  }

  // Keyboard activation for the board row itself (Enter/Space), since it
  // is a role="button" div rather than a native <button>.
  const toggleRow = event.target.closest('[data-role="toggle"]');
  if (toggleRow && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    const boardEl = event.target.closest(".board");
    toggleExpanded(boardEl.dataset.id);
  }
}

export function resetBoards() {
  boards = cloneDefaultBoards();
  saveBoards();
  renderBoards();
}

export function initBoards(statsChangeCallback) {
  onStatsChange = statsChangeCallback || onStatsChange;
  boardList = document.getElementById("boardList");
  addBoardBtn = document.getElementById("addBoardBtn");

  boardList.addEventListener("click", handleBoardListClick);
  boardList.addEventListener("keydown", handleBoardListKeydown);

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

  storageGet(BOARDS_KEY, null)
    .then((stored) => {
      boards = stored && stored.length ? stored : cloneDefaultBoards();
      if (!stored) saveBoards();
      renderBoards();
    })
    .catch((err) => {
      console.error("[bird] Failed to load boards, using defaults.", err);
      boards = cloneDefaultBoards();
      renderBoards();
    });
}
