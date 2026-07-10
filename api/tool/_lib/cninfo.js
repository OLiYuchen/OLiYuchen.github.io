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

// Returns candidates like { code, name, category: "A股"|"港股", orgId, column }
async function searchCompanies(query) {
  const cleaned = String(query || "").trim();
  if (!cleaned) return [];
  const body = new URLSearchParams({ keyWord: cleaned, maxNum: "10" }).toString();
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
  return list
    .filter((item) => item.delisted !== "true")
    .map((item) => ({
      code: item.code,
      name: item.zwjc,
      category: item.category, // "A股" | "港股"
      orgId: item.orgId,
      column: columnForCode(item.code, item.category),
    }));
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

function buildAnnouncementEvents(announcements, company, market) {
  return announcements.map((item) => {
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
  });
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
    financials: { revenue: null, netIncome: null },
  };
}

module.exports = { searchCompanies, findByCode, getAnnouncements, buildAnnouncementEvents, buildOverview };
