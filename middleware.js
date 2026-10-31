// Gates the API layer behind a shared password (cookie-based, not HTTP Basic
// Auth) so the tools aren't wide open to anyone who finds the URL — they call
// third-party APIs on your behalf and there's no per-user account system.
//
// Two independent tools, two independent gates:
//   /api/tool/*   → tool_auth cookie   (password: TOOL_PASSWORD)
//   /api/intern/* → intern_auth cookie (password: INTERN_PASSWORD)
//
// The static /tool/* and /intern/* pages are intentionally NOT gated here —
// they contain no real data (data only arrives via client-side fetches to the
// /api/* endpoints), so they load and show a blur overlay asking for the
// password. Real enforcement happens here, against the API. Configure the
// passwords via env vars in the Vercel project settings; a dev fallback keeps
// local use working when they're unset.

export const config = {
  matcher: ["/api/tool/:path*", "/api/intern/:path*"],
};

const TOOL_DEV_FALLBACK = "fosun-dev-only";
const INTERN_DEV_FALLBACK = "fosun-dev-only";

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized", message: "请先输入访问口令。" }), {
    status: 401,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export default function middleware(request) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return;

  // Each tool's auth endpoint must be reachable without already holding the
  // cookie it is responsible for issuing.
  if (url.pathname === "/api/tool/auth" || url.pathname === "/api/intern/auth") return;

  if (url.pathname.startsWith("/api/intern/")) {
    const expected = process.env.INTERN_PASSWORD || INTERN_DEV_FALLBACK;
    if (getCookie(request, "intern_auth") !== expected) return unauthorized();
    return;
  }

  // default: /api/tool/*
  const expected = process.env.TOOL_PASSWORD || TOOL_DEV_FALLBACK;
  if (getCookie(request, "tool_auth") !== expected) return unauthorized();
}
