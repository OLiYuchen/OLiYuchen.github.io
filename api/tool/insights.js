// POST /api/tool/insights  { events: [{ id, title, company, eventType, formType }] }
// Progressive enhancement, called by the frontend AFTER /api/tool/company
// has already rendered real data — deliberately a separate endpoint so a
// slow or misconfigured LLM call can never delay or break the core page.
//
// Response is always 200 with { ok, insights }: `ok: false` only means "the
// LLM layer isn't configured or failed", which is a normal, expected state
// (e.g. ANTHROPIC_API_KEY not set) — not an application error.

const aiInsight = require("./_lib/aiInsight");
const { send, setCors } = require("./_lib/util");

const MAX_EVENTS_PER_REQUEST = 60;

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
    send(res, 200, { ok: false, reason: "not_configured", insights: {} });
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

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (!events.length) {
    send(res, 200, { ok: true, insights: {} });
    return;
  }

  const validEvents = events
    .filter((e) => e && typeof e.id === "string" && typeof e.title === "string")
    .slice(0, MAX_EVENTS_PER_REQUEST);

  const insights = await aiInsight.generateInsights(validEvents);
  send(res, 200, { ok: true, insights });
};
