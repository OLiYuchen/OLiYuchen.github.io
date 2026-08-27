// POST /api/tool/filing-summary  { url, formType, itemLabel, company, title }
// Lazily invoked when a user opens the source panel for a US SEC filing:
// fetches the filing's real document text from EDGAR and has Claude summarize
// what it actually discloses. Deliberately NOT part of /api/tool/company —
// fetching + summarizing every filing on every page load would be slow and
// mostly wasted, since most filings are never opened. On-demand + cached.
//
// Always 200 with { ok, summary }: ok:false (unconfigured / non-SEC url /
// fetch failed / empty body) is a normal, expected state, not an error —
// the source panel just shows no AI interpretation in that case.

const aiInsight = require("./_lib/aiInsight");
const filingText = require("./_lib/filingText");
const { send, setCors } = require("./_lib/util");

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!aiInsight.isConfigured()) {
    send(res, 200, { ok: false, reason: "not_configured", summary: "" });
    return;
  }

  let raw = "";
  try {
    raw = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  } catch (error) {
    send(res, 400, { error: "Invalid request body" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw || "{}");
  } catch (error) {
    send(res, 400, { error: "Invalid JSON" });
    return;
  }

  const url = typeof payload.url === "string" ? payload.url : "";
  // SSRF guard also lives in filingText.fetchFilingText, but reject early and
  // clearly here too — this endpoint only ever interprets SEC documents.
  if (!filingText.isSecUrl(url)) {
    send(res, 200, { ok: false, reason: "unsupported_source", summary: "" });
    return;
  }

  const fetched = await filingText.fetchFilingText(url);
  if (!fetched.ok) {
    send(res, 200, { ok: false, reason: fetched.reason || "fetch_failed", summary: "" });
    return;
  }

  const summary = await aiInsight.generateFilingSummary(
    {
      url,
      formType: typeof payload.formType === "string" ? payload.formType : "",
      itemLabel: typeof payload.itemLabel === "string" ? payload.itemLabel : "",
      company: typeof payload.company === "string" ? payload.company : "",
      title: typeof payload.title === "string" ? payload.title : "",
    },
    fetched.text,
  );

  if (!summary) {
    send(res, 200, { ok: false, reason: "generation_failed", summary: "" });
    return;
  }

  send(res, 200, { ok: true, summary, truncated: Boolean(fetched.truncated) });
};
