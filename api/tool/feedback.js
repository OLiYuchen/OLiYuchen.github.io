// POST /api/tool/feedback
// Best-effort sync of a feedback submission into Notion (if configured). The
// mailto: link built client-side is the guaranteed delivery path — this
// endpoint only adds a searchable log and must never block or fail loudly.

const notion = require("./_lib/notion");
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

  let body = "";
  try {
    body = await new Promise((resolve, reject) => {
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
    payload = JSON.parse(body || "{}");
  } catch (error) {
    send(res, 400, { error: "Invalid JSON" });
    return;
  }

  const { type, title, content, diagnostics, pageUrl } = payload;
  if (!title || !content) {
    send(res, 400, { error: "title and content are required" });
    return;
  }

  if (!notion.isConfigured()) {
    send(res, 200, { synced: false, reason: "notion_not_configured" });
    return;
  }

  const result = await notion.submitFeedback({ type, title, content, diagnostics, pageUrl });
  send(res, 200, { synced: result.ok, reason: result.ok ? null : result.reason });
};
