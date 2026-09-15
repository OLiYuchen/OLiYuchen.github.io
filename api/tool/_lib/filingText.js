// Fetches and plain-texts the actual body of a SEC filing document, so the
// LLM can summarize what a filing *really says* instead of just restating its
// title. Unlike Google News / cninfo detail pages (JS shells with no real
// content — see news.js), EDGAR serves the filing's real text directly, which
// is what makes true filing interpretation possible.
//
// SSRF guard: only ever fetches sec.gov URLs. The caller passes a URL that
// came from our own sec.js buildFilingEvents (always an EDGAR archive link),
// but we re-validate here so this can never be pointed at an arbitrary host.

const { fetchWithTimeout } = require("./util");

const SEC_USER_AGENT = "Fosun Cross-Border Research Tool fyc2003@uw.edu";
const MAX_TEXT_CHARS = 20000; // ~5-6k tokens; caps cost on long 10-K/10-Q bodies

function isSecUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && /(^|\.)sec\.gov$/.test(u.hostname);
  } catch (error) {
    return false;
  }
}

// EDGAR primary documents are XBRL-tagged HTML. Stripping tags leaves the
// real prose, but also a run of XBRL context junk at the very top
// ("aapl-20260430 false 0000320193 ..."). We trim to the first real filing
// landmark so the model sees substance first; if no landmark is found we
// keep the whole thing rather than risk dropping real content.
function extractText(html) {
  let text = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();

  const landmark = text.search(/UNITED STATES\s+SECURITIES|FORM\s+\d|CURRENT REPORT|ANNUAL REPORT|QUARTERLY REPORT|Item\s+\d/i);
  if (landmark > 0 && landmark < text.length - 500) {
    text = text.slice(landmark);
  }
  return text.slice(0, MAX_TEXT_CHARS);
}

// Returns { ok, text, truncated } or { ok: false }. Best-effort — any
// failure just means no AI interpretation is shown for this filing.
async function fetchFilingText(url) {
  if (!isSecUrl(url)) return { ok: false, reason: "not_sec_url" };
  try {
    const response = await fetchWithTimeout(
      url,
      { headers: { "User-Agent": SEC_USER_AGENT, Accept: "text/html,*/*" } },
      9000,
    );
    const html = await response.text();
    const text = extractText(html);
    if (text.length < 80) return { ok: false, reason: "empty" };
    return { ok: true, text, truncated: text.length >= MAX_TEXT_CHARS };
  } catch (error) {
    return { ok: false, reason: "fetch_failed" };
  }
}

module.exports = { fetchFilingText, isSecUrl };
