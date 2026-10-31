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

const DIGEST_SYSTEM_PROMPT = `你是投资研究团队使用的辅助工具。用户会给你一家公司近期的新闻/公告标题列表（含事件类型），请你合成一句话的中文「近期速读」，帮分析师30秒内了解"这家公司近期主要在忙什么"。

严格规则，必须遵守：
1. 只能依据用户提供的标题和事件类型进行归纳，绝对不能引用、推测或编造任何未在输入中出现的具体数字、金额、日期、人名、交易对手等事实细节。
2. 归纳"主题/动作"（如回购、子公司分拆、高管变动、发债、诉讼、财报发布等），不要逐条复述标题。
3. 1-2句中文，不超过80字，语气克制、中性。不给出买入/卖出/持有等投资建议，不做价格或走势预测，不做好坏评价。
4. 如果标题信息太少或过于零散、无法归纳出主题，就只回复：近期动态较少或较分散，建议直接浏览下方列表。
5. 只输出这段中文本身，不要有引号、前缀、解释或 JSON。`;

async function callClaudeDigest(companyName, events) {
  const userContent = JSON.stringify({
    company: companyName,
    items: events.map((e) => ({ title: e.title, eventType: e.eventType })),
  });

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
        max_tokens: 300,
        system: DIGEST_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    },
    20000,
  );

  const data = await response.json();
  return (data?.content?.[0]?.text || "").trim();
}

const digestCache = new Map();

// events: array of { title, eventType }. Returns a one-line Chinese digest
// string, or "" if unconfigured / failed / not enough to summarize. Uses the
// top events by importance (passed in already-sorted by the caller); capped
// so the prompt stays small and cheap.
async function generateDigest(companyName, events) {
  if (!isConfigured() || !events.length) return "";

  const top = events.slice(0, 15);
  const cacheKey = `${companyName}|${top.map((e) => e.title).join("|")}`;
  if (digestCache.has(cacheKey)) return digestCache.get(cacheKey);

  try {
    const text = (await callClaudeDigest(companyName, top)).slice(0, 200);
    if (digestCache.size >= CACHE_MAX_SIZE) {
      digestCache.delete(digestCache.keys().next().value);
    }
    digestCache.set(cacheKey, text);
    return text;
  } catch (error) {
    return "";
  }
}

const FILING_SUMMARY_SYSTEM_PROMPT = `你是投资研究团队使用的辅助工具。用户会给你一份美国SEC监管文件（如8-K/10-Q/10-K等）的真实正文（可能被截断），请你用中文说明这份文件实质披露了什么，帮分析师快速判断要不要读全文。

严格规则，必须遵守：
1. 只能依据用户提供的正文进行归纳，绝对不能引用、推测或编造正文中未出现的数字、金额、日期、人名、交易对手等事实。正文里有的数字可以引用；正文里没有的，一律不写。
2. 【数字规则，极其重要】美国财报数字通常以"千/百万美元"为单位列示（如报表标注 in millions / in thousands，数字如 111,184 实为 111,184 百万美元）。**严禁自行换算单位（不要换成"亿""billion"），也不要改写数字格式。**如需引用某个数字，请连同正文中它旁边的单位说明一起原样照抄（例如写成"净销售额 111,184（百万美元，per 10-Q）"）；如果你无法确定某数字的单位，就不要引用该数字，只做定性描述。宁可少给数字，也绝不给错误或换算过的数字。
3. 聚焦"这份文件披露了什么实质事项"（如：宣布某项收购/发债/高管变动/业绩/诉讼/会计政策变更等）。优先做定性归纳（如"营收同比增长、主要由服务业务拉动"），数字能不引就不引；确需引用时严格遵守第2条。用要点式或3-5句话说清楚。
4. 若正文被截断、或主要是XBRL标签/格式化数据、缺少可读的实质内容，就直说"该文件正文以结构化数据/附表为主，未能提取到明确的叙述性披露，建议查看原文"，不要硬编内容。
5. 语气克制、中性、专业。不给出买入/卖出/持有等投资建议，不做股价走势预测，不做好坏评价。
6. 只输出中文正文本身（可用简单的分点），不要有前缀、标题或JSON。总长度控制在220字以内。`;

async function callClaudeFilingSummary(context, text) {
  const userContent = `文件类型：${context.formType || "未知"}${context.itemLabel ? `（${context.itemLabel}）` : ""}
公司：${context.company || "未知"}
标题：${context.title || ""}

以下是该SEC文件的真实正文（可能被截断）：
"""
${text}
"""`;

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
        max_tokens: 600,
        system: FILING_SUMMARY_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    },
    25000,
  );

  const data = await response.json();
  return (data?.content?.[0]?.text || "").trim();
}

// Cache by the immutable filing URL — a filed document never changes, so a
// summary is safe to reuse forever within this instance's lifetime.
const filingSummaryCache = new Map();

// context: { url, formType, itemLabel, company, title }, text: extracted
// filing body. Returns a Chinese summary string, or "" on any failure.
async function generateFilingSummary(context, text) {
  if (!isConfigured() || !text) return "";
  if (context.url && filingSummaryCache.has(context.url)) return filingSummaryCache.get(context.url);

  try {
    const summary = (await callClaudeFilingSummary(context, text)).slice(0, 800);
    if (context.url) {
      if (filingSummaryCache.size >= CACHE_MAX_SIZE) {
        filingSummaryCache.delete(filingSummaryCache.keys().next().value);
      }
      filingSummaryCache.set(context.url, summary);
    }
    return summary;
  } catch (error) {
    return "";
  }
}

module.exports = { isConfigured, generateInsights, generateDigest, generateFilingSummary };
