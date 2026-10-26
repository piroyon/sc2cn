// Looks up common names, classification and links for a scientific name.
// GBIF gives the taxonomic backbone (and catches synonyms/typos); Wikidata,
// matched through GBIF taxon IDs (P846) or the taxon name (P225), gives
// Japanese/English names, a photo and Wikipedia links.

const GBIF_API = "https://api.gbif.org/v1";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const API_USER_AGENT = "sc2cn/1.3 (Chrome extension: scientific name to common name)";

const RANKS = ["kingdom", "phylum", "class", "order", "family"];

const MAX_NAMES = 3;
const TIMEOUT_MS = 8000;
const SPARQL_TIMEOUT_MS = 5000; // the query service is sometimes very slow; fall back early
const NO_NAMES = { ja: [], en: [] };
const cache = new Map();
const creditCache = new Map();

// "  danio   RERIO " -> "Danio rerio". Returns null unless the text looks like
// a genus, binomial or trinomial name, which also keeps it safe to put in queries.
export function normalizeScientificName(text) {
  const words = text.replace(/[\s　]+/g, " ").trim().split(" ");
  if (words.length > 3) return null;
  const name = words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(" ");
  return /^[A-Z][a-z]+(?: [a-z][a-z-]*){0,2}$/.test(name) ? name : null;
}

export function lookup(name) {
  if (!cache.has(name)) {
    const promise = lookupUncached(name);
    cache.set(name, promise);
    promise.catch(() => cache.delete(name)); // don't cache network errors
  }
  return cache.get(name);
}

async function lookupUncached(name) {
  const match = await getJson(`${GBIF_API}/species/match?` + new URLSearchParams({ name, verbose: "false" }));
  const matched = match.matchType === "EXACT" || (match.matchType === "FUZZY" && match.confidence >= 90);

  // For names GBIF doesn't know but Wikidata does.
  if (!matched) {
    const { byName } = await fetchWikidataTaxa([], name);
    if (!byName) return null;
    const result = { query: name, scientificName: name, classification: [], ...describeTaxon(byName, name, NO_NAMES) };
    return hasAnything(result) ? result : null;
  }

  const usageKey = String(match.acceptedUsageKey ?? match.usageKey);
  const rankKeys = RANKS.map((rank) => match[rank + "Key"]).filter(Boolean).map(String);
  const acceptedName = await acceptedNameOf(match);

  // Everything else only depends on the GBIF match, so fetch it all at once.
  const [{ byGbifKey, byName }, vernacular] = await Promise.all([
    fetchWikidataTaxa([usageKey, ...rankKeys], acceptedName),
    gbifVernacularNames(usageKey).catch(() => NO_NAMES)
  ]);

  const result = {
    query: name,
    scientificName: acceptedName,
    matchedName: match.canonicalName !== name ? match.canonicalName : null,
    synonym: Boolean(match.acceptedUsageKey),
    classification: RANKS.filter((rank) => match[rank]).map((rank) => ({
      rank,
      name: match[rank],
      ja: byGbifKey.get(String(match[rank + "Key"]))?.labels.ja ?? null
    })),
    gbifUrl: `https://www.gbif.org/species/${usageKey}`,
    // Wikidata sometimes has an outdated GBIF ID (e.g. Escherichia coli); the name match covers that.
    ...describeTaxon(byGbifKey.get(usageKey) ?? byName, acceptedName, vernacular)
  };
  return hasAnything(result) ? result : null;
}

// The match response already carries the accepted species/genus name for synonyms;
// only other ranks need another request.
async function acceptedNameOf(match) {
  if (!match.acceptedUsageKey) return match.canonicalName;
  const fromMatch = { SPECIES: match.species, GENUS: match.genus }[match.rank];
  if (fromMatch) return fromMatch;
  return (await getJson(`${GBIF_API}/species/${match.acceptedUsageKey}`)).canonicalName;
}

function hasAnything(result) {
  return result.ja.length > 0 || result.en.length > 0 || result.classification.length > 0;
}

// taxon: see fetchWikidataTaxa. vernacular: GBIF names used when Wikidata has none.
function describeTaxon(taxon, scientificName, vernacular) {
  const isScientific = (s) => s.toLowerCase() === scientificName.toLowerCase();
  const ja = [taxon?.labels.ja, ...(taxon?.commonNames.ja ?? [])].filter((s) => s && !isScientific(s));
  const en = [...(taxon?.commonNames.en ?? []), taxon?.labels.en].filter((s) => s && !isScientific(s));
  return {
    ja: unique(ja.length ? ja : vernacular.ja),
    en: unique(en.length ? en : vernacular.en),
    photoUrl: taxon?.image ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(taxon.image)}?width=320` : null,
    photoFile: taxon?.image ?? null,
    wikipedia: taxon?.wikipedia ?? {},
    wikidataUrl: taxon ? `https://www.wikidata.org/wiki/${taxon.id}` : null
  };
}

// Author and license of a Commons file, fetched separately so the card can show
// up before it. { author, license, licenseUrl, pageUrl }
export function photoCredit(file) {
  if (!creditCache.has(file)) {
    const promise = photoCreditUncached(file);
    creditCache.set(file, promise);
    promise.catch(() => creditCache.delete(file));
  }
  return creditCache.get(file);
}

async function photoCreditUncached(file) {
  const data = await getJson(
    `${COMMONS_API}?` +
      new URLSearchParams({
        action: "query",
        titles: "File:" + file,
        prop: "imageinfo",
        iiprop: "extmetadata",
        iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl",
        format: "json",
        formatversion: "2",
        origin: "*"
      }),
    { "Api-User-Agent": API_USER_AGENT }
  );
  const meta = data.query?.pages?.[0]?.imageinfo?.[0]?.extmetadata ?? {};
  const licenseUrl = meta.LicenseUrl?.value;
  return {
    author: plainText(meta.Artist?.value ?? "").slice(0, 80) || null,
    license: plainText(meta.LicenseShortName?.value ?? "") || null,
    licenseUrl: /^https?:\/\//.test(licenseUrl ?? "") ? licenseUrl : null,
    pageUrl: commonsPageUrl(file)
  };
}

function commonsPageUrl(file) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
}

// Commons metadata is HTML; the service worker has no DOM, and the result is
// only ever shown with textContent, so a rough strip is enough.
function plainText(html) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
      e[0] === "#" ? fromCodePoint(parseInt(e.slice(1).replace(/^x/i, "0x")), m) : entities[e.toLowerCase()] ?? m
    )
    .replace(/\s+/g, " ")
    .trim();
}

function fromCodePoint(code, fallback) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return fallback; // out-of-range entity
  }
}

async function gbifVernacularNames(usageKey) {
  const data = await getJson(`${GBIF_API}/species/${usageKey}/vernacularNames?limit=300`);
  const pick = (lang) => unique(data.results.filter((r) => r.language === lang).map((r) => r.vernacularName));
  return { ja: pick("jpn"), en: pick("eng") };
}

// ---- Wikidata ----
//
// Both functions below return the same shape:
//   { byGbifKey: Map<gbifKey, taxon>, byName: taxon | null }
//   taxon = { id, labels: { ja, en }, commonNames: { ja: [], en: [] }, image, wikipedia: { ja, en } }

// One SPARQL query that asks only for what we show (~7 KB). Falls back to
// the action API, which is more robust but returns every claim (~600 KB).
async function fetchWikidataTaxa(gbifKeys, taxonName) {
  try {
    return await fetchWikidataTaxaSparql(gbifKeys, taxonName);
  } catch (e) {
    console.warn("Wikidata SPARQL failed, falling back to the action API:", e);
    return fetchWikidataTaxaApi(gbifKeys, taxonName);
  }
}

async function fetchWikidataTaxaSparql(gbifKeys, taxonName) {
  // Keys are digits and the name passed normalizeScientificName; JSON.stringify quotes them anyway.
  const byKey = gbifKeys.length
    ? `{ VALUES ?gbif { ${gbifKeys.map((k) => JSON.stringify(k)).join(" ")} } ?item wdt:P846 ?gbif . } UNION`
    : "";
  const query = `
    SELECT ?item ?gbif ?byName ?label ?common ?image ?article ?wiki ?sitelinks WHERE {
      ${byKey}
      { ?item wdt:P225 ${JSON.stringify(taxonName)} . BIND(true AS ?byName) }
      OPTIONAL { ?item rdfs:label ?label FILTER(lang(?label) IN ("ja", "en")) }
      OPTIONAL { ?item wdt:P1843 ?common FILTER(lang(?common) IN ("ja", "en")) }
      OPTIONAL { ?item wdt:P18 ?image }
      OPTIONAL { ?article schema:about ?item ; schema:isPartOf ?wiki
                 FILTER(?wiki IN (<https://ja.wikipedia.org/>, <https://en.wikipedia.org/>)) }
      OPTIONAL { ?item wikibase:sitelinks ?sitelinks }
    }`;
  const data = await getJson(
    `${WIKIDATA_SPARQL}?` + new URLSearchParams({ query, format: "json" }),
    { Accept: "application/sparql-results+json" },
    SPARQL_TIMEOUT_MS
  );

  const taxa = new Map();
  const byGbifKey = new Map();
  const nameMatches = [];
  for (const row of data.results.bindings) {
    const id = row.item.value.split("/").pop();
    if (!taxa.has(id)) {
      taxa.set(id, {
        id,
        labels: {},
        commonNames: { ja: [], en: [] },
        image: null,
        wikipedia: {},
        sitelinks: Number(row.sitelinks?.value ?? 0)
      });
    }
    const taxon = taxa.get(id);
    if (row.gbif && !byGbifKey.has(row.gbif.value)) byGbifKey.set(row.gbif.value, taxon);
    if (row.byName && !nameMatches.includes(taxon)) nameMatches.push(taxon);
    if (row.label) setLabel(taxon, row.label["xml:lang"], row.label.value);
    if (row.common) addUnique(taxon.commonNames[row.common["xml:lang"]], row.common.value);
    if (row.image && !taxon.image) taxon.image = decodeURIComponent(row.image.value.split("/Special:FilePath/").pop());
    if (row.article) taxon.wikipedia[row.wiki.value.includes("ja.") ? "ja" : "en"] = row.article.value;
  }
  // Homonyms across kingdoms share a name; the best-known one is the likeliest.
  nameMatches.sort((a, b) => b.sitelinks - a.sitelinks);
  return { byGbifKey, byName: nameMatches[0] ?? null };
}

async function fetchWikidataTaxaApi(gbifKeys, taxonName) {
  const statements = [...gbifKeys.map((k) => "P846=" + k), "P225=" + taxonName].join("|");
  const found = await getJson(
    `${WIKIDATA_API}?` +
      new URLSearchParams({ action: "query", list: "search", srsearch: `haswbstatement:"${statements}"`, srlimit: "20", format: "json", origin: "*" }),
    { "Api-User-Agent": API_USER_AGENT }
  );
  const ids = found.query.search.map((s) => s.title);
  const byGbifKey = new Map();
  let byName = null;
  if (ids.length === 0) return { byGbifKey, byName };

  const data = await getJson(
    `${WIKIDATA_API}?` +
      new URLSearchParams({
        action: "wbgetentities",
        ids: ids.join("|"),
        props: "labels|claims|sitelinks",
        languages: "ja|en",
        sitefilter: "jawiki|enwiki",
        format: "json",
        origin: "*"
      }),
    { "Api-User-Agent": API_USER_AGENT }
  );
  // Keep the search order: the first hit is the most relevant.
  for (const entity of ids.map((id) => data.entities[id]).filter(Boolean)) {
    const claims = (property) => (entity.claims?.[property] ?? []).map((c) => c.mainsnak?.datavalue?.value).filter((v) => v !== undefined);
    const taxon = { id: entity.id, labels: {}, commonNames: { ja: [], en: [] }, image: claims("P18")[0] ?? null, wikipedia: {} };
    for (const lang of ["ja", "en"]) {
      if (entity.labels?.[lang]) setLabel(taxon, lang, entity.labels[lang].value);
      const title = entity.sitelinks?.[lang + "wiki"]?.title;
      if (title) taxon.wikipedia[lang] = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
    }
    for (const v of claims("P1843")) if (taxon.commonNames[v.language]) addUnique(taxon.commonNames[v.language], v.text);
    for (const key of claims("P846")) if (!byGbifKey.has(key)) byGbifKey.set(key, taxon);
    if (!byName && claims("P225").includes(taxonName)) byName = taxon;
  }
  return { byGbifKey, byName };
}

// Japanese labels that are just the Latin name again are not useful.
function setLabel(taxon, lang, value) {
  if (lang === "ja" && /^[A-Za-z .-]+$/.test(value)) return;
  taxon.labels[lang] = value;
}

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

// Case-insensitive de-duplication ("Human", "Humans", "human" -> first two).
function unique(names) {
  const seen = new Set();
  const out = [];
  for (const n of names) {
    const key = n.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(n);
    }
  }
  return out.slice(0, MAX_NAMES);
}

// Falls back to the key outside the extension (e.g. when testing in a plain page).
function message(key) {
  return globalThis.chrome?.i18n?.getMessage(key) || key;
}

async function getJson(url, headers = {}, timeout = TIMEOUT_MS, retry = true) {
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json", ...headers }, signal: AbortSignal.timeout(timeout) });
  } catch (e) {
    throw e.name === "TimeoutError" ? new Error(message("errorTimeout")) : e;
  }
  if (response.status === 429) {
    const wait = Number(response.headers.get("Retry-After")) || 2;
    if (retry && wait <= 10) {
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      return getJson(url, headers, timeout, false);
    }
    throw new Error(message("errorTooManyRequests"));
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
