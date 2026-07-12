/* ============================================================
   Bird Neumorphic New Tab — Quick Notes widget
   Autosaves 500ms after the user stops typing (debounced storage
   write) with a live character count.
   ============================================================ */

import { NOTES_KEY, storageGet, storageSet } from "./storage.js";
import { debounce } from "./utils.js";

let notesTextarea;
let notesCount;

function updateNotesCount() {
  const length = notesTextarea.value.length;
  notesCount.textContent = `${length} character${length === 1 ? "" : "s"}`;
}

export function resetNotes() {
  notesTextarea.value = "";
  updateNotesCount();
}

export function initNotes() {
  notesTextarea = document.getElementById("notesTextarea");
  notesCount = document.getElementById("notesCount");

  const saveNotes = debounce((value) => storageSet(NOTES_KEY, value), 500);

  notesTextarea.addEventListener("input", () => {
    updateNotesCount();
    saveNotes(notesTextarea.value);
  });

  storageGet(NOTES_KEY, "")
    .then((notes) => {
      notesTextarea.value = notes;
      updateNotesCount();
    })
    .catch((err) => {
      console.error("[bird] Failed to load notes, starting blank.", err);
      notesTextarea.value = "";
      updateNotesCount();
    });
}
