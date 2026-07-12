/* ============================================================
   Bird Neumorphic New Tab — "This week" stats strip
   Derived live from task board data — no separate storage.
   ============================================================ */

let statCompletedEl;
let statStreakEl;
let statOpenEl;

export function initStatsStrip() {
  statCompletedEl = document.getElementById("statCompleted");
  statStreakEl = document.getElementById("statStreak");
  statOpenEl = document.getElementById("statOpen");
}

export function updateStats(boards) {
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
