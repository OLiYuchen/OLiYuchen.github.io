// Tier 2 / Tier 3 data source: 巨潮资讯网 (cninfo.com.cn), the official
// disclosure aggregator used by SSE/SZSE-listed companies and, usefully for a
// cross-border tool, many HK-listed companies that are relevant to mainland
// investors (e.g. Tencent 00700, BYD Electronic 00285). No API key needed.
//
// Coverage is honest, not exhaustive: cninfo indexes what is relevant to the
// mainland market, so a pure-international HK or A-share-unrelated company
// may not appear here. Callers should treat empty results as "not covered"
// rather than "no news", and the frontend must say so explicitly.

const { fetchJson, fetchText } = require("./util");

const SEARCH_URL = "http://www.cninfo.com.cn/new/information/topSearch/query";
const ANNOUNCEMENT_URL = "http://www.cninfo.com.cn/new/hisAnnouncement/query";
const HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "Mozilla/5.0 (compatible; FosunCrossBorderTool/1.0)",
};

function columnForCode(code, category) {
  if (category === "港股") return "hke";
  if (code.startsWith("6")) return "sse";
  return "szse";
}

const VALID_CATEGORIES = new Set(["A股", "港股"]);

// cninfo's search endpoint only accepts a bare numeric code (e.g. "600519"
// or "00700") — it silently returns zero results for a suffixed query like
// "600519.SH" or "00700.HK", even though that's the format documented in
// this app's own UI. Strip the suffix here and use it as a market hint to
// filter/prioritize results instead.
function normalizeQuery(query) {
  const match = query.match(/^(\d+)\.(sh|sz|hk)$/i);
  if (!match) return { keyword: query, marketHint: null, exactCode: null };
  const [, digits, suffix] = match;
  const marketHint = suffix.toUpperCase() === "HK" ? "港股" : "A股";
  const exactCode = marketHint === "港股" ? digits.padStart(5, "0") : digits;
  return { keyword: exactCode, marketHint, exactCode };
}

// Returns candidates like { code, name, category: "A股"|"港股", orgId, column }
async function searchCompanies(query) {
  const cleaned = String(query || "").trim();
  if (!cleaned) return [];
  const { keyword, marketHint, exactCode } = normalizeQuery(cleaned);

  const body = new URLSearchParams({ keyWord: keyword, maxNum: "10" }).toString();
  let raw;
  try {
    raw = await fetchText(SEARCH_URL, { method: "POST", headers: HEADERS, body }, 8000);
  } catch (error) {
    return [];
  }
  let list;
  try {
    list = JSON.parse(raw);
  } catch (error) {
    return [];
  }
  if (!Array.isArray(list)) return [];

  let results = list
    .filter((item) => item.delisted !== "true")
    .filter((item) => VALID_CATEGORIES.has(item.category)) // exclude bonds/ABS/other non-equity noise
    .map((item) => ({
      code: item.code,
      name: item.zwjc,
      category: item.category, // "A股" | "港股"
      orgId: item.orgId,
      column: columnForCode(item.code, item.category),
    }));

  if (marketHint) results = results.filter((item) => item.category === marketHint);

  if (exactCode) {
    // An explicit code query should put the exact match first, ahead of
    // cninfo's fuzzy substring matches (e.g. "700" also matching "002700").
    results.sort((a, b) => (b.code === exactCode ? 1 : 0) - (a.code === exactCode ? 1 : 0));
  }

  return results;
}

async function findByCode(code) {
  const matches = await searchCompanies(code);
  return matches.find((m) => m.code === code) || matches[0] || null;
}

async function getAnnouncements(company) {
  const seDate = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return `${fmt(start)}~${fmt(end)}`;
  })();

  const body = new URLSearchParams({
    stock: `${company.code},${company.orgId}`,
    tabName: "fulltext",
    pageSize: "30",
    pageNum: "1",
    column: company.column,
    seDate,
  }).toString();

  try {
    const data = await fetchJson(ANNOUNCEMENT_URL, { method: "POST", headers: HEADERS, body }, 9000);
    return Array.isArray(data?.announcements) ? data.announcements : [];
  } catch (error) {
    return [];
  }
}

// Some announcement types recur with the exact same title (HK companies
// file 翌日披露报表 daily during buyback programs; A-share companies repeat
// 股票交易异常波动公告 etc.) — as individual rows they read as accidental
// duplicates. Identical titles collapse into one row carrying the latest
// filing's link plus a count and the covered dates, so it's clear these are
// separate filings over time and where to find the rest.
function clusterIdenticalTitles(events) {
  const byTitle = new Map();
  const order = [];
  for (const event of events) {
    const key = event.title;
    if (!byTitle.has(key)) {
      byTitle.set(key, []);
      order.push(key);
    }
    byTitle.get(key).push(event);
  }

  return order.map((key) => {
    const group = byTitle.get(key);
    if (group.length === 1) return group[0];
    // Announcements arrive newest-first, so group[0] is the latest one.
    const latest = group[0];
    const dates = group.map((g) => (g.timestamp || "").slice(5, 10).replace("-", "/")).filter(Boolean);
    return {
      ...latest,
      id: `${latest.id}-cluster`,
      title: `${latest.title} · 近期共 ${group.length} 份`,
      summary: `${latest.company} 近期披露了 ${group.length} 份同名公告《${latest.title}》，日期：${dates.join("、")}。已合并为一条展示，点击来源查看最新一份原文。`,
    };
  });
}

function buildAnnouncementEvents(announcements, company, market) {
  return clusterIdenticalTitles(announcements.map((item) => {
    const sourceId = `cninfo-${item.announcementId}`;
    const timestamp = item.announcementTime ? new Date(Number(item.announcementTime)).toISOString() : null;
    const url = item.adjunctUrl
      ? `http://www.cninfo.com.cn/new/disclosure/detail?announcementId=${item.announcementId}&orgId=${company.orgId}&announcementTime=${timestamp ? timestamp.slice(0, 10) : ""}`
      : `http://www.cninfo.com.cn/new/announcement/download?announcementId=${item.announcementId}`;
    return {
      id: `announcement-${item.announcementId}`,
      market,
      eventType: "filing",
      company: company.name,
      ticker: company.code,
      formType: "公告",
      timestamp,
      title: item.announcementTitle,
      summary: `${company.name} 披露公告：${item.announcementTitle}。`,
      importance: "medium", // refined further by scoring.js keyword rules
      sourceIds: [sourceId],
      sources: [
        {
          id: sourceId,
          sourceType: "regulatory",
          credibility: "official",
          publisher: market === "hk" ? "香港交易所披露易 / 巨潮资讯网" : "巨潮资讯网 (cninfo.com.cn)",
          title: item.announcementTitle,
          publishedAt: timestamp,
          url,
        },
      ],
    };
  }));
}

// No free real-time quote source is wired up for A股/港股 in V1 — always
// point to a real, working external quote site instead of a dead end.
function externalQuoteUrl(company, market) {
  if (market === "hk") return `http://quote.eastmoney.com/hk/${company.code}.html`;
  const prefix = company.column === "sse" ? "sh" : "sz";
  return `http://quote.eastmoney.com/${prefix}${company.code}.html`;
}

function buildOverview(company, market) {
  return {
    market,
    name: company.name,
    id: company.code,
    ticker: company.code,
    exchange: market === "hk" ? "HKEX" : company.column === "sse" ? "上交所" : "深交所",
    industry: "N/A",
    quote: { available: false, reason: "行情数据当前不可用" },
    externalQuoteUrl: externalQuoteUrl(company, market),
    financials: { revenue: null, netIncome: null },
  };
}

module.exports = { searchCompanies, findByCode, getAnnouncements, buildAnnouncementEvents, buildOverview };
