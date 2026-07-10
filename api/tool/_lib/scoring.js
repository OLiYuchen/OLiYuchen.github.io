// Deterministic rule engine. This intentionally does NOT call an LLM — per
// the PRD, V1 uses keyword + event-type rules and must be labeled in the UI
// as "规则筛选，非 AI 生成的投资分析" so users don't overestimate what it does.

const { daysAgo } = require("./util");

const REGULATORY_KEYWORDS = [
  "立案调查", "立案侦查", "被调查", "问询函", "关注函", "监管函", "警示函",
  "处罚决定", "行政处罚", "重大资产重组", "股权冻结", "诉讼", "仲裁",
  "退市风险", "退市", "财务造假", "停牌", "违规", "反垄断", "制裁",
  "investigation", "subpoena", "lawsuit", "litigation", "sanction", "sanctions",
  "delisting", "restatement", "material weakness", "antitrust", "fraud", "indictment",
];

const FINANCIAL_PERIODIC_KEYWORDS = [
  "年度报告", "半年度报告", "季度报告", "业绩预告", "业绩快报", "权益分派",
];

const INDUSTRY_KEYWORDS = [
  "行业", "产业链", "供应链", "板块", "关税", "出口管制", "监管政策",
  "industry", "sector", "tariff", "supply chain", "export control", "policy",
];

const HIGH_PRIORITY_FORMS = new Set(["8-K", "10-K", "10-Q", "20-F", "6-K", "SC 13D", "SC 13D/A", "SC 13G", "SC 13G/A"]);

function findKeyword(text, list) {
  const lower = String(text || "").toLowerCase();
  return list.find((kw) => lower.includes(kw.toLowerCase())) || null;
}

// Mutates nothing; returns a new event object with refined eventType,
// importance, and (if triggered) a `trigger` explaining why.
function classifyEvent(event) {
  const title = event.title || "";
  const regKeyword = findKeyword(title, REGULATORY_KEYWORDS);
  const financialKeyword = findKeyword(title, FINANCIAL_PERIODIC_KEYWORDS);
  const industryKeyword = !regKeyword ? findKeyword(title, INDUSTRY_KEYWORDS) : null;

  let eventType = event.eventType;
  let importance = event.importance;
  let trigger = null;

  if (regKeyword) {
    eventType = "regulatory";
    importance = "high";
    trigger = { kind: "keyword", label: `触发关键词 "${regKeyword}"` };
  } else if (event.eventType === "filing" && HIGH_PRIORITY_FORMS.has(event.formType)) {
    importance = "high";
    trigger = { kind: "form", label: `${event.formType} 是高优先级监管表格` };
  } else if (financialKeyword) {
    importance = importance === "low" ? "medium" : importance;
    trigger = { kind: "financial", label: `包含定期报告关键词 "${financialKeyword}"` };
  } else if (industryKeyword && event.eventType === "news") {
    eventType = "industry";
  }

  const isRecent = daysAgo(event.timestamp) <= 3;
  if (isRecent && importance === "low") importance = "medium";

  return { ...event, eventType, importance, trigger };
}

function classifyEvents(events) {
  return events.map(classifyEvent);
}

const IMPORTANCE_RANK = { high: 3, medium: 2, low: 1 };

// Builds the "初筛区块" bullets: up to 4 rule-triggered highlights, each
// pointing back at the source event so the UI can render a citation chip.
function buildScreening(events) {
  const triggered = events
    .filter((e) => e.trigger)
    .sort((a, b) => {
      const rank = IMPORTANCE_RANK[b.importance] - IMPORTANCE_RANK[a.importance];
      if (rank !== 0) return rank;
      return daysAgo(a.timestamp) - daysAgo(b.timestamp);
    })
    .slice(0, 4);

  return triggered.map((event) => {
    let text;
    if (event.trigger.kind === "keyword") {
      text = `${event.trigger.label}：《${event.title}》，建议优先核实影响范围。`;
    } else if (event.trigger.kind === "form") {
      text = `${event.company} 提交了 ${event.formType}，建议复核最新财务与风险披露变化。`;
    } else {
      text = `${event.company} 披露定期报告相关信息：《${event.title}》，建议复核业绩与指引变化。`;
    }
    return {
      id: `screen-${event.id}`,
      text,
      importance: event.importance,
      sourceIds: event.sourceIds,
    };
  });
}

module.exports = { classifyEvents, buildScreening };
