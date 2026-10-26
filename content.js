// Injected on demand (right-click or the toolbar popup), never on every page.
// Shows the result dialog, and can underline scientific names on the page
// with a tooltip on hover.
(() => {
  if (window.__sc2cn) return;
  window.__sc2cn = true;

  const NAME_CLASS = "sc2cn-name";
  const STYLE_ID = "sc2cn-style";
  const SHOW_DELAY = 350;
  const HIDE_DELAY = 300;

  const t = (key, ...substitutions) => chrome.i18n.getMessage(key, substitutions);
  // Japanese UI leads with Japanese names; everything else leads with English.
  const JAPANESE_UI = chrome.i18n.getUILanguage().startsWith("ja");

  const CARD_CSS = `
    :host { all: initial; }
    .backdrop { position: fixed; inset: 0; z-index: 2147483647; background: rgba(0,0,0,.3);
      display: flex; align-items: center; justify-content: center; }
    .tooltip { position: fixed; z-index: 2147483647; }
    .card { background: #fff; color: #222; font: 14px/1.5 system-ui, -apple-system, "Hiragino Sans", sans-serif;
      border-radius: 8px; padding: 16px 18px; width: 320px; max-width: calc(100vw - 32px);
      box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,.25); text-align: left; }
    h2 { margin: 0 0 2px; font-size: 19px; font-weight: 600; }
    p { margin: 0; }
    .sub { color: #444; }
    .sci { font-style: italic; color: #666; margin-top: 2px; }
    .note { font-size: 12px; color: #8a5a00; margin-top: 2px; }
    .taxonomy { font-size: 12px; color: #555; margin-top: 8px; }
    .error { color: #b00020; }
    .muted { color: #777; }
    figure { margin: 10px 0 0; text-align: center; }
    img { display: block; max-width: 100%; max-height: 200px; margin: 0 auto; border-radius: 4px; }
    figcaption { margin-top: 3px; font-size: 11px; color: #777; overflow-wrap: anywhere; }
    .links { margin-top: 10px; font-size: 12px; display: flex; flex-wrap: wrap; gap: 4px 12px; }
    a { color: #1a5fb4; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .actions { margin-top: 12px; text-align: right; }
    button { font: inherit; padding: 3px 14px; cursor: pointer; }
  `;

  // ---- lookup ----

  const results = new Map();
  function lookup(name) {
    if (!results.has(name)) {
      const promise = chrome.runtime.sendMessage({ type: "lookup", name }).then((res) => {
        if (!res?.ok) throw new Error(res?.error || t("errorLookupFailed"));
        return res.result;
      });
      results.set(name, promise);
      promise.catch(() => results.delete(name));
    }
    return results.get(name);
  }

  // ---- card rendering ----

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  function link(href, text) {
    const a = el("a", null, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  // state: { loading: name } | { error, name } | { result, name }
  function renderCard(card, state) {
    card.replaceChildren();
    if (state.loading) {
      card.append(el("p", "sci", state.loading), el("p", "muted", t("searching")));
      return;
    }
    if (state.error) {
      card.append(el("p", "error", state.error));
      if (state.name) card.append(el("p", "sci", state.name));
      return;
    }
    const r = state.result;
    if (!r) {
      card.append(el("p", "error", t("notFound")), el("p", "sci", state.name));
      return;
    }

    const [primary, secondary] = JAPANESE_UI ? [r.ja, r.en] : [r.en, r.ja];
    const title = primary[0] ? primary : secondary[0] ? secondary : [r.scientificName];
    card.append(el("h2", null, title.slice(0, 2).join(" / ")));
    if (primary[0] && secondary[0]) card.append(el("p", "sub", secondary.join(" / ")));
    card.append(el("p", "sci", r.scientificName));
    if (r.synonym) card.append(el("p", "note", t("synonymNote", r.matchedName || r.query)));
    else if (r.matchedName) card.append(el("p", "note", t("matchedNote", r.query, r.matchedName)));

    if (r.classification.length) {
      const taxonomy = el("p", "taxonomy");
      r.classification.forEach((c, i) => {
        if (i) taxonomy.append(" › ");
        const span = el("span", null, JAPANESE_UI ? c.ja || c.name : c.name);
        span.title = `${t("rank" + c.rank[0].toUpperCase() + c.rank.slice(1))}: ${c.name}`;
        taxonomy.append(span);
      });
      card.append(taxonomy);
    }

    if (r.photoUrl) {
      const pageUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(r.photoFile.replace(/ /g, "_"))}`;
      const figure = el("figure");
      const img = el("img");
      img.src = r.photoUrl;
      img.alt = r.scientificName;
      img.referrerPolicy = "no-referrer";
      img.onerror = () => figure.remove();
      const imgLink = link(pageUrl);
      imgLink.append(img);
      const caption = el("figcaption");
      caption.append(link(pageUrl, `${t("photoCredit")} Wikimedia Commons`));
      figure.append(imgLink, caption);
      card.append(figure);
      fillPhotoCredit(caption, r.photoFile, pageUrl);
    }

    const links = el("div", "links");
    const wikipedia = [
      ["ja", "wikipediaJa"],
      ["en", "wikipediaEn"]
    ];
    if (!JAPANESE_UI) wikipedia.reverse();
    for (const [lang, label] of wikipedia) {
      if (r.wikipedia?.[lang]) links.append(link(r.wikipedia[lang], t(label)));
    }
    if (r.gbifUrl) links.append(link(r.gbifUrl, "GBIF"));
    if (r.wikidataUrl) links.append(link(r.wikidataUrl, "Wikidata"));
    if (links.childElementCount) card.append(links);
  }

  // "Photo: NOZO / CC BY 3.0" — author links to the file page, license to its text.
  async function fillPhotoCredit(caption, file, pageUrl) {
    const res = await chrome.runtime.sendMessage({ type: "photoCredit", file }).catch(() => null);
    const credit = res?.ok && res.credit;
    if (!credit || !caption.isConnected || (!credit.author && !credit.license)) return;
    caption.replaceChildren(t("photoCredit") + " ", link(pageUrl, credit.author || "Wikimedia Commons"));
    if (credit.license) {
      caption.append(" / ", credit.licenseUrl ? link(credit.licenseUrl, credit.license) : credit.license);
    }
  }

  // Shadow DOM keeps the page's CSS out and ours in.
  function createHost(id) {
    document.getElementById(id)?.remove();
    const host = document.createElement("div");
    host.id = id;
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = CARD_CSS;
    root.append(style);
    document.documentElement.append(host);
    return { host, root };
  }

  async function showCardFor(card, name, isCurrent) {
    renderCard(card, { loading: name });
    try {
      const result = await lookup(name);
      if (isCurrent()) renderCard(card, { result, name });
    } catch (e) {
      if (isCurrent()) renderCard(card, { error: e.message, name });
    }
  }

  // ---- dialog (right-click) ----

  function showDialog(name, selection) {
    hideTooltip();
    const { host, root } = createHost("sc2cn-dialog");
    const backdrop = el("div", "backdrop");
    const card = el("div", "card");
    const body = el("div");
    const close = el("button", null, t("close"));
    const actions = el("div", "actions");
    actions.append(close);
    card.append(body, actions);
    backdrop.append(card);
    root.append(backdrop);

    const onKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    const dismiss = () => {
      host.remove();
      document.removeEventListener("keydown", onKey, true);
    };
    close.addEventListener("click", dismiss);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) dismiss();
    });
    document.addEventListener("keydown", onKey, true);
    close.focus();

    if (!name) renderCard(body, { error: t("errorNotScientificNameWithText", selection.trim().slice(0, 60)) });
    else showCardFor(body, name, () => host.isConnected);
  }

  // ---- highlight names on the page ----

  const NOT_GENUS = new Set(["In", "Ex", "De", "Et", "Ad", "Per", "Pro", "Sensu", "Sic", "Status", "Via", "Vice", "Ab", "Ante", "Post", "Inter", "Nota", "Bene"]);
  const NOT_EPITHET = new Set(["et", "al", "vivo", "vitro", "situ", "silico", "ovo", "utero", "toto", "vacuo", "planta", "nov", "sp", "spp", "cf", "aff"]);
  // "Danio rerio", "D. rerio", "Mus musculus domesticus", "Brassica rapa subsp. pekinensis"
  const NAME_RE = /\b([A-Z][a-z]+|[A-Z]\.)\s+([a-z][a-z-]{2,})\b(?:\s+(?:(?:subsp|ssp|var)\.\s+)?([a-z][a-z-]{2,})\b)?/g;
  const MAX_ITALIC_TEXT = 80; // long italic runs are prose, not names
  const SKIP = "script, style, noscript, textarea, input, select, code, pre, [contenteditable], ." + NAME_CLASS;

  let highlighted = [];

  function isItalic(element, cache) {
    if (!cache.has(element)) {
      const s = getComputedStyle(element).fontStyle;
      cache.set(element, s === "italic" || s.startsWith("oblique"));
    }
    return cache.get(element);
  }

  function findCandidates() {
    const italicCache = new Map();
    const genusByInitial = new Map();
    const found = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(SKIP) || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.textContent.length > MAX_ITALIC_TEXT) return NodeFilter.FILTER_REJECT;
        return isItalic(parent, italicCache) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    for (let node; (node = walker.nextNode()); ) {
      const text = node.nodeValue;
      for (const m of text.matchAll(NAME_RE)) {
        let [whole, genus, epithet, third] = m;
        if (NOT_GENUS.has(genus) || NOT_EPITHET.has(epithet)) continue;
        // Abbreviated genus ("D. rerio") resolves to the last full genus with that initial.
        if (genus.endsWith(".")) {
          genus = genusByInitial.get(genus[0]);
          if (!genus) continue;
        } else {
          genusByInitial.set(genus[0], genus);
        }
        // A bare third word is only a subspecies if nothing else follows ("Danio rerio embryos").
        const marked = /\s(?:subsp|ssp|var)\.\s/.test(whole);
        if (third && !marked && text.trim() !== whole) {
          whole = whole.slice(0, whole.lastIndexOf(third)).trimEnd();
          third = null;
        }
        found.push({ node, start: m.index, end: m.index + whole.length, name: [genus, epithet, third].filter(Boolean).join(" ") });
      }
    }
    return found;
  }

  function highlight() {
    const candidates = findCandidates();
    // Wrap from the end of each text node so earlier offsets stay valid.
    for (const c of candidates.reverse()) {
      const range = document.createRange();
      range.setStart(c.node, c.start);
      range.setEnd(c.node, c.end);
      const span = document.createElement("span");
      span.className = NAME_CLASS;
      span.dataset.sc2cnName = c.name;
      range.surroundContents(span);
      highlighted.push(span);
    }

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `.${NAME_CLASS} { text-decoration: underline dotted #1a73e8 !important;
        text-decoration-thickness: 2px !important; text-underline-offset: 3px; cursor: help; }`;
      (document.head || document.documentElement).append(style);
    }
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", hideTooltip, true);
    return highlighted.length;
  }

  function unhighlight() {
    for (const span of highlighted) {
      const parent = span.parentNode;
      if (!parent) continue;
      span.replaceWith(...span.childNodes);
      parent.normalize();
    }
    highlighted = [];
    document.getElementById(STYLE_ID)?.remove();
    document.removeEventListener("mouseover", onMouseOver);
    document.removeEventListener("mouseout", onMouseOut);
    window.removeEventListener("scroll", hideTooltip, true);
    hideTooltip();
  }

  // ---- tooltip ----

  let tooltip = null; // { host, box, card, target }
  let showTimer = 0;
  let hideTimer = 0;

  function onMouseOver(e) {
    const target = e.target.closest?.("." + NAME_CLASS);
    if (!target) return;
    clearTimeout(hideTimer);
    if (tooltip?.target === target) return;
    clearTimeout(showTimer);
    showTimer = setTimeout(() => showTooltip(target), SHOW_DELAY);
  }

  function onMouseOut(e) {
    if (!e.target.closest?.("." + NAME_CLASS)) return;
    clearTimeout(showTimer);
    scheduleHide();
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideTooltip, HIDE_DELAY);
  }

  function showTooltip(target) {
    const { host, root } = createHost("sc2cn-tooltip");
    const box = el("div", "tooltip");
    const card = el("div", "card");
    box.append(card);
    root.append(box);
    // Let the pointer move into the tooltip to click its links.
    box.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    box.addEventListener("mouseleave", scheduleHide);
    tooltip = { host, box, card, target };

    const place = () => {
      const rect = target.getBoundingClientRect();
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const below = rect.bottom + 6;
      const top = below + height > window.innerHeight - 8 && rect.top - height - 6 > 8 ? rect.top - height - 6 : below;
      box.style.left = left + "px";
      box.style.top = top + "px";
    };
    const current = () => tooltip?.target === target && host.isConnected;
    new ResizeObserver(() => current() && place()).observe(card);
    showCardFor(card, target.dataset.sc2cnName, current);
    place();
  }

  function hideTooltip() {
    clearTimeout(showTimer);
    tooltip?.host.remove();
    tooltip = null;
  }

  // ---- messages from the background script and popup ----

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case "showDialog":
        showDialog(message.name, message.selection || "");
        sendResponse({ ok: true });
        break;
      case "status":
        sendResponse({ active: highlighted.length > 0 || Boolean(document.getElementById(STYLE_ID)), count: highlighted.length });
        break;
      case "toggleHighlight":
        if (document.getElementById(STYLE_ID)) {
          unhighlight();
          sendResponse({ active: false, count: 0 });
        } else {
          const count = highlight();
          if (count === 0) unhighlight();
          sendResponse({ active: count > 0, count });
        }
        break;
    }
  });
})();
