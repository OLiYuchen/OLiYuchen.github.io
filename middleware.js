// Gates /tool and its API routes behind a single shared password (HTTP Basic
// Auth) so the tool isn't wide open to anyone who finds the URL — it calls
// third-party APIs on your behalf and there's no per-user account system in
// V1. Configure the password via the TOOL_PASSWORD env var in the Vercel
// project settings. Username is ignored; only the password is checked.
//
// Falls back to a placeholder password for local/dev use when the env var
// isn't set, so `vercel dev` still works out of the box. Set TOOL_PASSWORD
// in production before sharing the link.

export const config = {
  matcher: ["/tool/:path*", "/api/tool/:path*"],
};

const DEV_FALLBACK_PASSWORD = "fosun-dev-only";

function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Investment Tool", charset="UTF-8"' },
  });
}

export default function middleware(request) {
  const expected = process.env.TOOL_PASSWORD || DEV_FALLBACK_PASSWORD;

  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Basic ")) return unauthorized();

  let decoded;
  try {
    decoded = atob(authHeader.slice(6));
  } catch (error) {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(":");
  const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : decoded;

  if (password !== expected) return unauthorized();
}
