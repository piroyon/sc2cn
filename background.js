import { lookup, normalizeScientificName, photoCredit } from "./lookup.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateName",
    title: chrome.i18n.getMessage("menuTitle"),
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "translateName" || !tab?.id) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await chrome.tabs.sendMessage(tab.id, {
      type: "showDialog",
      name: normalizeScientificName(info.selectionText || ""),
      selection: info.selectionText || ""
    });
  } catch (e) {
    // e.g. chrome:// pages and the Web Store, where extensions can't run
    console.error("Cannot show dialog on this page:", e);
  }
});

// Lookups run here so the content script needs no network access of its own.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "photoCredit") {
    if (typeof message.file !== "string" || message.file.length > 300) return;
    photoCredit(message.file).then(
      (credit) => sendResponse({ ok: true, credit }),
      (e) => sendResponse({ ok: false, error: e.message })
    );
    return true;
  }
  if (message.type !== "lookup") return;
  const name = normalizeScientificName(message.name || "");
  if (!name) {
    sendResponse({ ok: false, error: chrome.i18n.getMessage("errorNotScientificName") });
    return;
  }
  lookup(name).then(
    (result) => sendResponse({ ok: true, result }),
    (e) => sendResponse({ ok: false, error: e.message })
  );
  return true; // keep the channel open for the async response
});
