// Deterministic rule engine. This intentionally does NOT call an LLM — per
// the PRD, V1 uses keyword + event-type rules and must be labeled in the UI
// as "规则筛选，非 AI 生成的投资分析" so users don't overestimate what it does.

const { daysAgo } = require("./util");

const REGULATORY_KEYWORDS = [
  "立案调查", "立案侦查", "被调查", "问询函", "关注函", "监管函", "警示函",
  "处罚决定", "行政处罚", "重大资产重组", "股权冻结", "诉讼", "仲裁",
  "退市风险", "退市", "财务造假", "停牌", "违规", "反垄断", "制裁", "举报",
  "证监会", "交易所监管", "内幕交易", "操纵市场",
  "investigation", "subpoena", "lawsuit", "litigation", "sanction", "sanctions",
  "delisting", "restatement", "material weakness", "antitrust", "fraud", "indictment",
  "sec probe", "doj", "class action",
];

const FINANCIAL_PERIODIC_KEYWORDS = [
  "年度报告", "半年度报告", "季度报告", "业绩预告", "业绩快报", "权益分派",
];

// Deliberately narrow and precise rather than broad — these exist to
// surface genuinely macro/sector-level items, not to pad out the "行业"
// tab. Given the underlying feed is a per-company news/filing search (not a
// sector-wide search), most results are inherently company-specific, so a
// mostly-empty 行业 tab for any given company is expected behavior, not a
// sign the keyword list is broken. See the About page for this caveat.
const INDUSTRY_KEYWORDS = [
  "行业", "产业链", "供应链", "板块", "关税", "出口管制", "监管政策", "反垄断调查",
  "industry", "sector", "tariff", "supply chain", "export control", "policy", "antitrust probe",
];

// 10-K/10-Q/20-F (periodic financial reports) and activist ownership
// filings (SC 13D) are reliably worth flagging on their own. 8-K is
// item-code classified upstream in sec.js instead (see SEC_8K_ITEMS there)
// — a blanket "every 8-K is high" was wrong, since 8-K covers everything
// from bankruptcy to routine Reg FD disclosures. 6-K (foreign private
// issuers' catch-all, used for routine matters by most Chinese ADRs) and
// SC 13G (passive >5%-holder filings, often just index funds crossing a
// threshold) were previously here too and are removed for the same reason.
const HIGH_PRIORITY_FORMS = new Set(["10-K", "10-Q", "20-F", "SC 13D", "SC 13D/A", "SCHEDULE 13D", "SCHEDULE 13D/A"]);

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
  } else if (event.eventType === "filing" && (HIGH_PRIORITY_FORMS.has(event.formType) || event.importance === "high")) {
    // The `event.importance === "high"` half of this catches 8-Ks that
    // sec.js already flagged high via item code (e.g. 1.03 bankruptcy,
    // 2.01 acquisition) — those don't need to be in HIGH_PRIORITY_FORMS
    // themselves since the item code already did the real classification.
    importance = "high";
    trigger = { kind: "form", label: event.itemLabel ? `${event.formType}（${event.itemLabel}）` : `${event.formType} 是高优先级监管表格` };
  } else if (financialKeyword) {
    importance = importance === "low" ? "medium" : importance;
    trigger = { kind: "financial", label: `包含定期报告关键词 "${financialKeyword}"` };
  } else if (industryKeyword && event.eventType === "news") {
    eventType = "industry";
  }

  // Recency bump — but not for routine insider filings (Form 4 etc.,
  // flagged upstream in sec.js): being filed yesterday doesn't make an
  // ordinary stock-grant report any less routine.
  const isRecent = daysAgo(event.timestamp) <= 3;
  if (isRecent && importance === "low" && !event.routine) importance = "medium";

  return { ...event, eventType, importance, trigger };
}

function classifyEvents(events) {
  return events.map(classifyEvent);
}

const IMPORTANCE_RANK = { high: 3, medium: 2, low: 1 };

// A company that files several distinct high-priority filings in the same
// window used to produce bullets that read as identical duplicates (e.g.
// three "提交了 8-K，建议复核..." lines with no date) — every bullet now
// carries its filing date so it's clear these are separate events in time,
// not repeats.
function formatBulletDate(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

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
    const dateStr = formatBulletDate(event.timestamp);
    const dateNote = dateStr ? `（${dateStr}）` : "";
    let text;
    if (event.trigger.kind === "keyword") {
      text = `${event.trigger.label}${dateNote}：《${event.title}》，建议优先核实影响范围。`;
    } else if (event.trigger.kind === "form") {
      const itemNote = event.itemLabel ? `：${event.itemLabel}` : "";
      text = `${event.company} 提交了 ${event.formType}${dateNote}${itemNote}，建议复核最新财务与风险披露变化。`;
    } else {
      text = `${event.company}${dateNote} 披露定期报告相关信息：《${event.title}》，建议复核业绩与指引变化。`;
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
