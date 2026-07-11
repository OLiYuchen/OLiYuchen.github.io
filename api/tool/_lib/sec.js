// Tier 1 data source: SEC EDGAR (data.sec.gov / www.sec.gov). Free, official,
// no API key. Covers every SEC-registered company, including US-listed
// Chinese ADRs (BABA, PDD, JD, NIO, ...), which matters a lot for a
// cross-border research tool.

const { fetchJson, decodeEntities } = require("./util");
const { resolveAlias } = require("./aliases");

const SEC_DATA_BASE = "https://data.sec.gov";
const SEC_WWW_BASE = "https://www.sec.gov";
const SEC_USER_AGENT = "Fosun Cross-Border Research Tool fyc2003@uw.edu";

let tickerCache = null;
let tickerCacheAt = 0;
const TICKER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

function secHeaders() {
  return { "User-Agent": SEC_USER_AGENT, Accept: "application/json, text/plain, */*" };
}

function normalizeCik(cik) {
  return String(cik).padStart(10, "0");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// SEC occasionally 403s requests that hit it from a shared serverless IP,
// even with a compliant User-Agent — this looks like coarse, IP-level rate
// limiting on SEC's side rather than anything wrong with the request itself,
// and it tends to clear within seconds. One short retry absorbs most of
// these; if both attempts fail, prefer serving a stale cached copy (ticker/
// CIK/name mappings barely change day to day) over a hard failure.
async function fetchTickerMapRaw() {
  try {
    return await fetchJson(`${SEC_WWW_BASE}/files/company_tickers.json`, { headers: secHeaders() }, 12000);
  } catch (firstError) {
    await sleep(400);
    try {
      return await fetchJson(`${SEC_WWW_BASE}/files/company_tickers.json`, { headers: secHeaders() }, 12000);
    } catch (secondError) {
      throw secondError;
    }
  }
}

async function getTickerMap() {
  if (tickerCache && Date.now() - tickerCacheAt < TICKER_CACHE_TTL_MS) return tickerCache;
  try {
    const raw = await fetchTickerMapRaw();
    tickerCache = Object.values(raw).map((item) => ({
      cik: normalizeCik(item.cik_str),
      ticker: String(item.ticker || "").toUpperCase(),
      title: item.title || "",
    }));
    tickerCacheAt = Date.now();
    return tickerCache;
  } catch (error) {
    if (tickerCache) return tickerCache; // serve stale rather than fail outright
    const labeled = new Error("SEC_TICKER_MAP_UNAVAILABLE");
    labeled.cause = error;
    throw labeled;
  }
}

// Resolves a free-text query (ticker, English legal name, or a Chinese alias
// from aliases.js) to zero or more SEC-registered candidates.
async function searchCompanies(query) {
  const cleaned = String(query || "").trim();
  if (!cleaned) return [];
  const companies = await getTickerMap();
  const upper = cleaned.toUpperCase();

  const aliasTicker = resolveAlias(cleaned);
  if (aliasTicker) {
    const hit = companies.find((c) => c.ticker === aliasTicker);
    if (hit) return [hit];
  }

  const exactTicker = companies.find((c) => c.ticker === upper);
  if (exactTicker) return [exactTicker];

  const exactTitle = companies.find((c) => c.title.toUpperCase() === upper);
  if (exactTitle) return [exactTitle];

  if (cleaned.length >= 3) {
    const partial = companies
      .filter((c) => c.title.toUpperCase().includes(upper))
      .slice(0, 8);
    if (partial.length) return partial;
  }

  return [];
}

async function getByTicker(ticker) {
  const companies = await getTickerMap();
  const upper = String(ticker || "").toUpperCase();
  return companies.find((c) => c.ticker === upper) || null;
}

async function getSubmissions(cik) {
  return fetchJson(`${SEC_DATA_BASE}/submissions/CIK${normalizeCik(cik)}.json`, { headers: secHeaders() }, 9000);
}

async function getFacts(cik) {
  try {
    return await fetchJson(
      `${SEC_DATA_BASE}/api/xbrl/companyfacts/CIK${normalizeCik(cik)}.json`,
      { headers: secHeaders() },
      9000,
    );
  } catch (error) {
    return null;
  }
}

function latestFact(facts, conceptNames) {
  if (!facts?.facts?.["us-gaap"]) return null;
  const candidates = [];
  for (const concept of conceptNames) {
    const record = facts.facts["us-gaap"][concept];
    if (!record) continue;
    const entries = Object.values(record.units || {})
      .flat()
      .filter((item) => item.val != null && item.end);
    for (const entry of entries) {
      candidates.push({
        label: record.label || concept,
        value: entry.val,
        end: entry.end,
        form: entry.form,
        filed: entry.filed,
      });
    }
  }
  candidates.sort((a, b) => String(b.filed || "").localeCompare(String(a.filed || "")));
  return candidates[0] || null;
}

function formatLargeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const abs = Math.abs(number);
  if (abs >= 1e12) return `$${(number / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(number / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(number / 1e6).toFixed(2)}M`;
  return `$${number.toLocaleString()}`;
}

async function getQuote(ticker) {
  const symbol = String(ticker).toUpperCase();
  try {
    const data = await fetchJson(
      `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/info?assetclass=stocks`,
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0",
          Origin: "https://www.nasdaq.com",
          Referer: "https://www.nasdaq.com/",
        },
      },
      8000,
    );
    const primary = data?.data?.primaryData;
    if (!primary?.lastSalePrice) throw new Error("empty quote payload");
    const close = Number(String(primary.lastSalePrice).replace(/[$,]/g, ""));
    const changePercent = Number(String(primary.percentageChange || "").replace(/[%,]/g, ""));
    return {
      available: true,
      symbol,
      exchange: data?.data?.exchange || "NASDAQ",
      close,
      changePercent: Number.isFinite(changePercent) ? changePercent : null,
      time: primary.lastTradeTimestamp || null,
      source: "Nasdaq",
      sourceUrl: `https://www.nasdaq.com/market-activity/stocks/${symbol.toLowerCase()}`,
    };
  } catch (error) {
    return { available: false, symbol, reason: "行情数据当前不可用" };
  }
}

// 10-K/20-F (annual reports) and activist ownership filings are always
// worth flagging. 10-Q genuinely is too (it's the quarterly financial
// update this tool exists to surface) — but 6-K and SC 13G were previously
// lumped in here as blanket "high", which was wrong: 6-K is used by foreign
// private issuers (most Chinese ADRs) for routine matters, not just
// material events, and SC 13G is the *passive* >5%-holder filing that large
// index funds submit routinely — neither is reliably high-signal on its
// own. 8-K is handled separately below via its item codes instead of a
// blanket flag, since "8-K" alone says almost nothing (see SEC_8K_ITEMS).
const HIGH_PRIORITY_FORMS = new Set(["10-K", "10-Q", "20-F", "SC 13D", "SC 13D/A", "SCHEDULE 13D", "SCHEDULE 13D/A"]);

// SEC's own item-code taxonomy for Form 8-K (publicly documented, stable
// since 2004). "8-K" alone is not a useful title — EDGAR's own
// primaryDocDescription for 8-Ks is almost always just the literal string
// "8-K", which is why every 8-K in the feed used to look identical. The
// item code says what actually happened.
const SEC_8K_ITEMS = {
  "1.01": { label: "签订重大协议", importance: "high" },
  "1.02": { label: "终止重大协议", importance: "high" },
  "1.03": { label: "破产或接管程序", importance: "high" },
  "1.04": { label: "矿业安全事项", importance: "medium" },
  "2.01": { label: "完成收购或资产处置", importance: "high" },
  "2.02": { label: "经营业绩（财报发布）", importance: "medium" },
  "2.03": { label: "产生重大直接财务义务", importance: "high" },
  "2.04": { label: "表外安排触发事件", importance: "high" },
  "2.05": { label: "退出/处置相关成本", importance: "high" },
  "2.06": { label: "资产重大减值", importance: "high" },
  "3.01": { label: "退市/不再符合上市要求", importance: "high" },
  "3.02": { label: "未注册证券发行", importance: "medium" },
  "3.03": { label: "股东权利变更", importance: "medium" },
  "4.01": { label: "变更会计师事务所", importance: "high" },
  "4.02": { label: "此前财报不可依赖（重述）", importance: "high" },
  "5.01": { label: "控制权变更", importance: "high" },
  "5.02": { label: "董事/高管变动", importance: "medium" },
  "5.03": { label: "公司章程修订", importance: "low" },
  "5.04": { label: "员工福利计划变更", importance: "low" },
  "5.05": { label: "道德准则修订", importance: "low" },
  "5.07": { label: "股东大会投票结果", importance: "medium" },
  "6.01": { label: "资产支持证券相关信息", importance: "low" },
  "7.01": { label: "Regulation FD 披露", importance: "low" },
  "8.01": { label: "其他事项", importance: "medium" },
  "9.01": { label: "财务报表与附件", importance: "low" },
};

// Picks the highest-importance item on a (possibly multi-item) 8-K, e.g.
// "2.02,9.01" — 9.01 (exhibits) almost always rides along with something
// else and shouldn't be what the label/importance is based on.
function classify8kItems(itemsField) {
  const codes = String(itemsField || "").split(",").map((c) => c.trim()).filter(Boolean);
  const known = codes.map((code) => ({ code, ...SEC_8K_ITEMS[code] })).filter((x) => x.label);
  if (!known.length) return null;
  const rank = { high: 3, medium: 2, low: 1 };
  known.sort((a, b) => rank[b.importance] - rank[a.importance]);
  return known[0];
}

// Plain-Chinese names for common form types. EDGAR's own
// primaryDocDescription is usually just the form code repeated ("FORM 4"),
// which reads as meaningless duplication to anyone who doesn't know SEC
// form numbers by heart.
const FORM_LABELS = {
  "4": "内部人持股变动申报",
  "3": "内部人初始持股申报",
  "5": "内部人年度持股申报",
  "144": "拟出售受限证券通知",
  "10-K": "年度报告",
  "10-Q": "季度报告",
  "20-F": "年度报告（外国发行人）",
  "6-K": "临时报告（外国发行人）",
  "S-8": "员工持股计划证券注册",
  SD: "特殊披露（冲突矿产等）",
  "SC 13G": "被动大额持股申报（≥5%）",
  "SC 13G/A": "被动大额持股申报（修订）",
  "SC 13D": "主动大额持股申报（≥5%）",
  "SC 13D/A": "主动大额持股申报（修订）",
  "SCHEDULE 13G": "被动大额持股申报（≥5%）",
  "SCHEDULE 13G/A": "被动大额持股申报（修订）",
  "SCHEDULE 13D": "主动大额持股申报（≥5%）",
  "SCHEDULE 13D/A": "主动大额持股申报（修订）",
  "DEF 14A": "股东大会委托投票说明书",
  "DEFA14A": "委托投票补充材料",
  "424B2": "发行说明书补充文件",
  "S-3ASR": "证券货架注册（自动生效）",
};

// Insider-ownership forms arrive in bursts (every executive's grant/sale is
// a separate filing) and are individually near-identical rows with zero
// distinguishing text — the submissions API doesn't expose the insider's
// name. Individually they're noise; collapsed into one row with a count
// they're honest signal ("内部人这两周有 5 笔申报").
const ROUTINE_CLUSTER_FORMS = new Set(["4", "3", "5", "144"]);

function clusterRoutineFilings(events, company) {
  const kept = [];
  const groups = new Map();
  for (const event of events) {
    if (ROUTINE_CLUSTER_FORMS.has(event.formType)) {
      if (!groups.has(event.formType)) groups.set(event.formType, []);
      groups.get(event.formType).push(event);
    } else {
      kept.push(event);
    }
  }

  for (const [form, group] of groups) {
    if (group.length === 1) {
      kept.push(group[0]);
      continue;
    }
    // Events arrive newest-first from EDGAR, so group[0] is the latest.
    const latest = group[0];
    const label = FORM_LABELS[form] || form;
    const dates = group
      .map((g) => (g.timestamp || "").slice(5, 10).replace("-", "/"))
      .filter(Boolean);
    const sourceId = `sec-cluster-${form}-${company.cik}`;
    kept.push({
      ...latest,
      id: `filing-cluster-${form}-${company.cik}`,
      title: `${form}：${label} · 近期共 ${group.length} 份`,
      summary: `${company.title} 近期提交了 ${group.length} 份 ${form}（${label}），日期：${dates.join("、")}。此类申报多为例行披露，已合并为一条展示，点击来源可在 SEC EDGAR 查看该类型的全部原始文件。`,
      sourceIds: [sourceId],
      sources: [
        {
          id: sourceId,
          sourceType: "regulatory",
          credibility: "official",
          publisher: "U.S. Securities and Exchange Commission (SEC)",
          title: `${company.title} 的全部 ${form}（${label}）申报列表`,
          publishedAt: latest.timestamp,
          url: `${SEC_WWW_BASE}/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=${encodeURIComponent(form)}&dateb=&owner=include&count=40`,
        },
      ],
    });
  }

  return kept.sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
}

function buildFilingEvents(submissions, company) {
  const recent = submissions?.filings?.recent;
  if (!recent?.accessionNumber) return [];
  const events = recent.accessionNumber.slice(0, 20).map((accession, index) => {
    const accessionNoDash = accession.replace(/-/g, "");
    const doc = recent.primaryDocument[index];
    const form = recent.form[index];
    const filingDate = recent.filingDate[index];
    const reportDate = recent.reportDate[index];
    const description = recent.primaryDocDescription?.[index] || `${form} filing`;
    const sourceId = `sec-${accession}`;

    const topItem = form === "8-K" ? classify8kItems(recent.items?.[index]) : null;
    const formLabel = FORM_LABELS[form];
    const displayLabel = topItem
      ? `${form}：${topItem.label}`
      : formLabel
        ? `${form}：${formLabel}`
        : `${form}：${description}`;
    const importance = topItem
      ? topItem.importance
      : HIGH_PRIORITY_FORMS.has(form)
        ? "high"
        : ROUTINE_CLUSTER_FORMS.has(form)
          ? "low"
          : "medium";

    return {
      id: `filing-${accession}`,
      market: "us",
      eventType: "filing",
      company: company.title,
      ticker: company.ticker,
      formType: form,
      itemLabel: topItem ? topItem.label : null,
      // Routine insider forms shouldn't get the "recent → bump low to
      // medium" treatment in scoring.js — recency doesn't make them less
      // routine.
      routine: ROUTINE_CLUSTER_FORMS.has(form),
      timestamp: filingDate ? `${filingDate}T00:00:00Z` : null,
      title: displayLabel,
      summary: `${company.title} 提交了 ${form}${formLabel ? `（${formLabel}）` : ""}${reportDate ? `，报告期截至 ${reportDate}` : ""}。`,
      importance,
      sourceIds: [sourceId],
      sources: [
        {
          id: sourceId,
          sourceType: "regulatory",
          credibility: "official",
          publisher: "U.S. Securities and Exchange Commission (SEC)",
          title: displayLabel,
          publishedAt: filingDate ? `${filingDate}T00:00:00Z` : null,
          url: `${SEC_WWW_BASE}/Archives/edgar/data/${Number(company.cik)}/${accessionNoDash}/${doc}`,
        },
      ],
    };
  });
  return clusterRoutineFilings(events, company);
}

function buildOverview(company, submissions, facts, quote) {
  const revenue = latestFact(facts, [
    "Revenues",
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "SalesRevenueNet",
  ]);
  const netIncome = latestFact(facts, ["NetIncomeLoss"]);
  return {
    market: "us",
    name: decodeEntities(submissions?.name || company.title),
    id: company.ticker,
    ticker: company.ticker,
    exchange: submissions?.exchanges?.[0] || "N/A",
    industry: submissions?.sicDescription || "N/A",
    cik: company.cik,
    quote,
    // Shown whenever the live quote fetch fails or is unavailable, so the
    // user always has somewhere real to check instead of a dead end.
    externalQuoteUrl: `https://www.nasdaq.com/market-activity/stocks/${company.ticker.toLowerCase()}`,
    financials: {
      revenue: revenue ? { label: revenue.label, value: revenue.value, formatted: formatLargeNumber(revenue.value), end: revenue.end } : null,
      netIncome: netIncome ? { label: netIncome.label, value: netIncome.value, formatted: formatLargeNumber(netIncome.value), end: netIncome.end } : null,
    },
  };
}

module.exports = {
  searchCompanies,
  getByTicker,
  getSubmissions,
  getFacts,
  getQuote,
  buildFilingEvents,
  buildOverview,
};
