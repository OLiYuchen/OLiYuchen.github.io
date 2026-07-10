// Gates the API layer behind a single shared password (cookie-based, not
// HTTP Basic Auth) so the tool isn't wide open to anyone who finds the URL —
// it calls third-party APIs on your behalf and there's no per-user account
// system in V1.
//
// The static /tool/* pages are intentionally NOT gated here — they contain
// no real data (data only arrives via client-side fetches to /api/tool/*),
// so they're allowed to load and immediately show a full-page blur overlay
// (see tool/shared.js `initPasswordGate`) asking for just a password, no
// username. Real enforcement happens here, against /api/tool/*: without a
// valid `tool_auth` cookie (set by POST /api/tool/auth), every API call is
// rejected regardless of what the page looks like.
//
// Configure the password via the TOOL_PASSWORD env var in the Vercel
// project settings. Falls back to a placeholder for local/dev use when the
// env var isn't set — set TOOL_PASSWORD in production before sharing the
// link.

export const config = {
  matcher: ["/api/tool/:path*"],
};

const DEV_FALLBACK_PASSWORD = "fosun-dev-only";

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function middleware(request) {
  const url = new URL(request.url);

  // The auth endpoint itself must be reachable without already having the
  // cookie it's responsible for issuing.
  if (url.pathname === "/api/tool/auth") return;
  if (request.method === "OPTIONS") return;

  const expected = process.env.TOOL_PASSWORD || DEV_FALLBACK_PASSWORD;
  const submitted = getCookie(request, "tool_auth");

  if (submitted !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized", message: "请先输入访问口令。" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
