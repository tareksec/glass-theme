/* ============================================================
   Bird Neumorphic New Tab — Editable info/hero card
   ============================================================ */

import { INFO_KEY, storageGet, storageSet } from "./storage.js";
import { escapeHtml, isSafeHttpUrl } from "./utils.js";

export const DEFAULT_INFO = {
  text: "Focus on tasks\nthat matter",
  linkLabel: "Learn more",
  linkUrl: "",
};

let infoParagraph;
let infoLink;
let infoLinkLabel;
let infoData = { ...DEFAULT_INFO };

function render() {
  infoParagraph.innerHTML = escapeHtml(infoData.text).replace(/\n/g, "<br />");
  infoLinkLabel.textContent = infoData.linkLabel;
  infoLink.href = infoData.linkUrl || "#";
  infoLink.classList.toggle("is-empty-link", !infoData.linkUrl);
}

export function resetInfo() {
  infoData = { ...DEFAULT_INFO };
  render();
}

export function initInfo() {
  infoParagraph = document.getElementById("infoParagraph");
  infoLink = document.getElementById("infoLink");
  infoLinkLabel = document.getElementById("infoLinkLabel");
  const editInfoBtn = document.getElementById("editInfoBtn");

  infoLink.addEventListener("click", (event) => {
    if (!infoData.linkUrl) event.preventDefault();
  });

  editInfoBtn.addEventListener("click", () => {
    const newText = window.prompt("Card text:", infoData.text);
    if (newText === null) return;

    const newLabel = window.prompt("Link label:", infoData.linkLabel);
    if (newLabel === null) return;

    const rawUrl = window.prompt("Link URL (leave blank for no link):", infoData.linkUrl);
    if (rawUrl === null) return;

    const trimmedUrl = rawUrl.trim();
    if (trimmedUrl && !isSafeHttpUrl(trimmedUrl)) {
      window.alert("Please enter a valid http(s):// URL, or leave it blank.");
      return;
    }

    infoData = {
      text: newText.trim() || infoData.text,
      linkLabel: newLabel.trim() || infoData.linkLabel,
      linkUrl: trimmedUrl,
    };

    storageSet(INFO_KEY, infoData);
    render();
  });

  storageGet(INFO_KEY, DEFAULT_INFO)
    .then((info) => {
      infoData = { ...DEFAULT_INFO, ...info };
      render();
    })
    .catch((err) => {
      console.error("[bird] Failed to load info card, using defaults.", err);
      infoData = { ...DEFAULT_INFO };
      render();
    });
}
