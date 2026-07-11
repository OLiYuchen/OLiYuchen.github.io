// Optional layer on top of the deterministic rule engine in scoring.js: a
// short LLM-written gloss per event ("what is this probably about, worth a
// closer look?"). This is intentionally separate from — and must never be
// confused with — the rule-based "重要度" label, which stays 100% non-AI.
//
// Hard constraint: the model only ever sees the event's title/company/event
// type/form type — there is no article body available (see news.js/cninfo.js
// for why: scraping real excerpts from Google News/cninfo detail pages was
// tried and abandoned earlier in this project, they're JS shells with no
// real content). The prompt is written to make the model say so rather than
// invent specifics that were never in the input.
//
// Called from api/tool/insights.js as a progressive-enhancement endpoint —
// never inline in /api/tool/company, so a slow or failed LLM call can never
// delay or break the core data the rest of the app depends on.

const { fetchWithTimeout } = require("./util");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_VERSION = "2023-06-01";

const SYSTEM_PROMPT = `你是投资研究团队使用的一个辅助工具，任务是为一批新闻/公告标题各写一句极简的中文研判提示，帮助分析师快速判断"这条大概是什么性质、值不值得点进去细看"。

严格规则，必须遵守：
1. 你只能依据用户提供的标题、公司名、事件类型、表格类型进行推断和归类，绝对不能引用、推测或编造任何未在输入中出现的具体数字、金额、日期、人名、交易对手等事实细节。
2. 如果标题信息本身不足以判断实质内容，就直接说"标题信息有限，建议点击查看原文"，不要为了显得有内容而编造。
3. 每条输出必须是1-2句中文，不超过60个字，语气克制、中性，不给出买入/卖出/持有等投资建议，不做价格或走势预测。
4. 只输出严格的 JSON 数组，不要有任何数组之外的文字、前缀或解释：[{"id":"<原样返回输入中的id>","insight":"<你的研判>"}, ...]
5. 数组顺序和条数必须与输入完全一致，每个输入 id 都必须有对应输出。`;

// Cheap opportunistic cache: same event id (e.g. a company someone else just
// viewed on this warm instance) skips a repeat LLM call. Not persistent
// across cold starts — there's no database in this app — just a best-effort
// cost/latency reduction, not a correctness guarantee.
const insightCache = new Map();
const CACHE_MAX_SIZE = 500;

function cacheSet(id, insight) {
  if (insightCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = insightCache.keys().next().value;
    insightCache.delete(oldestKey);
  }
  insightCache.set(id, insight);
}

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function extractJsonArray(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

async function callClaude(items) {
  const userContent = JSON.stringify(
    items.map((e) => ({ id: e.id, title: e.title, company: e.company, eventType: e.eventType, formType: e.formType || null })),
  );

  const response = await fetchWithTimeout(
    ANTHROPIC_API_URL,
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(8192, items.length * 150 + 200),
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    },
    20000,
  );

  const data = await response.json();
  const text = data?.content?.[0]?.text || "";
  return extractJsonArray(text) || [];
}

// events: array of { id, title, company, eventType, formType }
// Returns a plain object { [id]: insightText }, containing only the ids that
// were successfully generated — callers must treat missing ids as "no
// insight available" rather than an error.
async function generateInsights(events) {
  if (!isConfigured() || !events.length) return {};

  const results = {};
  const uncached = [];
  for (const event of events) {
    if (insightCache.has(event.id)) {
      results[event.id] = insightCache.get(event.id);
    } else {
      uncached.push(event);
    }
  }
  if (!uncached.length) return results;

  try {
    const generated = await callClaude(uncached);
    for (const item of generated) {
      if (!item || typeof item.id !== "string" || typeof item.insight !== "string") continue;
      const trimmed = item.insight.trim().slice(0, 200);
      if (!trimmed) continue;
      results[item.id] = trimmed;
      cacheSet(item.id, trimmed);
    }
  } catch (error) {
    // Best-effort only — missing insights degrade to "not shown", never an
    // error surfaced to the user or a failure of the underlying event data.
  }

  return results;
}

module.exports = { isConfigured, generateInsights };
