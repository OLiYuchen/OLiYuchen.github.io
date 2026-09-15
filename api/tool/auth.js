// POST /api/tool/auth  { password }
// Validates the shared password and, on success, issues two cookies:
//   - tool_auth: HttpOnly, checked by middleware.js on every /api/tool/*
//     request. This is the actual security boundary.
//   - tool_gate: a small non-HttpOnly marker the frontend can read via
//     document.cookie, purely so it knows not to show the blur overlay
//     again on repeat visits within the cookie lifetime.
// This intentionally must NOT be gated by middleware.js — it's the endpoint
// that issues the credential in the first place.

const { send, setCors } = require("./_lib/util");

const DEV_FALLBACK_PASSWORD = "fosun-dev-only"; // keep in sync with middleware.js
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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

  let raw = "";
  try {
    raw = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  } catch (error) {
    send(res, 400, { ok: false, error: "Invalid request body" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw || "{}");
  } catch (error) {
    send(res, 400, { ok: false, error: "Invalid JSON" });
    return;
  }

  const expected = process.env.TOOL_PASSWORD || DEV_FALLBACK_PASSWORD;
  const submitted = String(payload.password || "");

  if (submitted !== expected) {
    send(res, 401, { ok: false, error: "口令不正确" });
    return;
  }

  // Cookies must not be marked Secure when testing locally over plain
  // http:// — browsers silently drop Secure cookies on non-TLS origins.
  const host = req.headers.host || "";
  const isLocal = /^(localhost|127\.0\.0\.1)/.test(host);
  const secureFlag = isLocal ? "" : "; Secure";

  res.setHeader("Set-Cookie", [
    `tool_auth=${encodeURIComponent(submitted)}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`,
    `tool_gate=1${secureFlag}; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`,
  ]);
  send(res, 200, { ok: true });
};
