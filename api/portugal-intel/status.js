const requiredEnv = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PORTUGAL_INTEL_ALLOWED_EMAIL",
  "PORTUGAL_INTEL_CRON_SECRET",
  "TAVILY_API_KEY",
  "GEMINI_API_KEY",
  "YOUTUBE_API_KEY",
  "RESEND_API_KEY",
  "PORTUGAL_INTEL_EMAIL_FROM",
  "PORTUGAL_INTEL_EMAIL_TO",
];

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  const configuredEnv = requiredEnv.filter((name) => Boolean(process.env[name]));
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);
  send(res, 200, {
    ready: missingEnv.length === 0,
    coverageState: missingEnv.length === 0 ? "complete" : "partial",
    configuredEnv,
    missingEnv,
    marketTimezone: process.env.PORTUGAL_INTEL_MARKET_TIMEZONE || "Europe/Lisbon",
    deliveryTimezone: process.env.PORTUGAL_INTEL_DELIVERY_TIMEZONE || "Asia/Shanghai",
    digestHour: Number(process.env.PORTUGAL_INTEL_DIGEST_HOUR || 8),
    digestMinute: Number(process.env.PORTUGAL_INTEL_DIGEST_MINUTE || 30),
    minDigestImportance: Number(process.env.PORTUGAL_INTEL_MIN_DIGEST_IMPORTANCE || 55),
    model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
    demoCounts: { candidates: 43, read: 11 },
  });
};
