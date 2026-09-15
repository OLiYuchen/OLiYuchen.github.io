function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
  return JSON.parse(raw || "{}");
}

const requiredForDiscovery = ["SUPABASE_SERVICE_ROLE_KEY", "TAVILY_API_KEY", "GEMINI_API_KEY", "YOUTUBE_API_KEY"];
const requiredForDigest = ["SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY", "RESEND_API_KEY", "PORTUGAL_INTEL_EMAIL_FROM", "PORTUGAL_INTEL_EMAIL_TO"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch (error) {
    send(res, 400, { error: "Invalid JSON" });
    return;
  }

  const action = String(payload.action || "");
  if (!["discovery", "digest", "process", "memory"].includes(action)) {
    send(res, 400, { error: "Unsupported action" });
    return;
  }

  const required = action === "digest" ? requiredForDigest : requiredForDiscovery;
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    send(res, 200, {
      ok: false,
      configured: false,
      missingEnv: missing,
      message: action === "digest"
        ? "已记录简报请求；补齐 Supabase、Gemini、Resend 环境变量后可发送真实日报。"
        : "已记录发现请求；补齐 Supabase、Tavily、Gemini、YouTube 环境变量后可运行真实发现流水线。",
    });
    return;
  }

  send(res, 202, {
    ok: true,
    configured: true,
    message: "环境变量已就绪；下一步可接入 Supabase 队列、Tavily 发现、Gemini 提取与 Resend 邮件。",
  });
};
