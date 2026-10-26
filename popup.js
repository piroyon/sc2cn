const t = (key, ...substitutions) => chrome.i18n.getMessage(key, substitutions);

// Static text: elements carry data-i18n="messageKey".
document.documentElement.lang = chrome.i18n.getUILanguage();
for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);

const button = document.getElementById("toggle");
const status = document.getElementById("status");

function render({ active, count }) {
  button.textContent = t(active ? "highlightOff" : "highlightOn");
  status.className = "";
  status.textContent = active ? t("highlightCount", String(count)) : "";
}

function showError(text) {
  status.className = "error";
  status.textContent = text;
}

async function activeTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

// Only asks; doesn't inject anything until the button is pressed.
async function refresh() {
  try {
    render(await chrome.tabs.sendMessage(await activeTabId(), { type: "status" }));
  } catch {
    render({ active: false, count: 0 });
  }
}

button.addEventListener("click", async () => {
  const tabId = await activeTabId();
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  } catch {
    showError(t("unavailableHere"));
    return;
  }
  const state = await chrome.tabs.sendMessage(tabId, { type: "toggleHighlight" });
  render(state);
  if (!state.active) status.textContent = t("highlightNone");
});

refresh();
