// POST /api/intern/sync   (gated by middleware.js → intern_auth cookie)
//   { op: "health" } → diagnostics: token present? parent page reachable?
//                      4 databases created? returns their ids.
//   { op: "pull" }   → { data: { todos, contacts, logs, notes } } from Notion
//   { op: "push", ops: [{ store, record } | { store, id, deleted:true }] }
//                    → upserts/deletes pages, returns per-store counts
//
// GET /api/intern/sync → same as { op:"health" } for easy browser/curl checks.
//
// Best-effort: every error is returned as JSON with a message so failures are
// diagnosable on the deployed function (there is no local Notion token to test
// against). The client treats any non-ok result as "not synced" and keeps
// working locally.

const notion = require("./_lib/notion");
const { send, setCors } = require("./_lib/util");

async function readBody(req) {
  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

module.exports = async function handler(req, res) {
  setCors(res);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

  const payload = req.method === "POST" ? await readBody(req) : {};
  const op = payload.op || (req.method === "GET" ? "health" : "");

  if (!notion.isConfigured()) {
    send(res, 200, { ok: false, reason: "notion_not_configured", message: "NOTION_TOKEN 未配置。" });
    return;
  }

  try {
    if (op === "health") {
      send(res, 200, { ok: true, health: await notion.health() });
      return;
    }
    if (op === "pull") {
      send(res, 200, { ok: true, data: await notion.pull() });
      return;
    }
    if (op === "push") {
      send(res, 200, { ok: true, counts: await notion.push(payload.ops || []) });
      return;
    }
    send(res, 400, { ok: false, error: "unknown op", op });
  } catch (e) {
    send(res, 200, { ok: false, error: e.message, status: e.status || null });
  }
};
