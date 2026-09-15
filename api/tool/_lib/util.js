// Shared low-level helpers used by every data source module.

async function fetchWithTimeout(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}, timeoutMs) {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  return response.json();
}

async function fetchText(url, options = {}, timeoutMs) {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  return response.text();
}

// Runs a list of async producers, never letting one rejection take down the others.
// Every entry in the returned array is either the resolved value or null.
async function settleAll(promises) {
  const results = await Promise.allSettled(promises);
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}

function decodeEntities(text) {
  if (!text) return "";
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .trim();
}

function stripHtml(text) {
  return decodeEntities(String(text || "").replace(/<[^>]*>/g, ""));
}

function daysAgo(isoOrMs) {
  if (!isoOrMs) return Infinity;
  const t = typeof isoOrMs === "number" ? isoOrMs : new Date(isoOrMs).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function send(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = {
  fetchWithTimeout,
  fetchJson,
  fetchText,
  settleAll,
  decodeEntities,
  stripHtml,
  daysAgo,
  setCors,
  send,
};
