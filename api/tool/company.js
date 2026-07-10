// GET /api/tool/company?market=us|cn|hk&id=...
// Aggregates overview + news + filings/announcements + rule-based screening
// for a single company. This is the payload behind the company workspace page.

const sec = require("./_lib/sec");
const cninfo = require("./_lib/cninfo");
const news = require("./_lib/news");
const scoring = require("./_lib/scoring");
const { settleAll, send, setCors } = require("./_lib/util");

async function loadUsCompany(id) {
  const company = await sec.getByTicker(id);
  if (!company) return null;

  const [submissions, facts, quote] = await settleAll([
    sec.getSubmissions(company.cik),
    sec.getFacts(company.cik),
    sec.getQuote(company.ticker),
  ]);
  if (!submissions) return null;

  const overview = sec.buildOverview(company, submissions, facts, quote || { available: false, reason: "行情数据当前不可用" });
  const filingEvents = sec.buildFilingEvents(submissions, company);

  const [enNews, zhNews] = await settleAll([
    news.fetchNews(`"${company.title}" OR ${company.ticker}`, { hl: "en-US", gl: "US", ceid: "US:en" }),
    news.fetchNews(`"${company.title}"`, { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }),
  ]);
  const newsEvents = news.buildNewsEvents([...(enNews || []), ...(zhNews || [])], { id: overview.id, name: overview.name }, "us");

  return { overview, events: [...filingEvents, ...newsEvents], coverageNotice: null };
}

async function loadCnHkCompany(id, marketHint) {
  const matches = await cninfo.searchCompanies(id);
  const company =
    matches.find((m) => m.code === id && (!marketHint || (marketHint === "hk") === (m.category === "港股"))) ||
    matches[0];
  if (!company) return null;

  const market = company.category === "港股" ? "hk" : "cn";
  const overview = cninfo.buildOverview(company, market);

  const [announcements, zhNews] = await settleAll([
    cninfo.getAnnouncements(company),
    news.fetchNews(`"${company.name}"`, { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }),
  ]);

  const filingEvents = cninfo.buildAnnouncementEvents(announcements || [], company, market);
  const newsEvents = news.buildNewsEvents(zhNews || [], { id: company.code, name: company.name }, market);

  const coverageNotice =
    market === "hk"
      ? "港股数据覆盖有限，公告数据来自巨潮资讯网聚合的港股披露信息，建议同时查阅港交所披露易官网核实完整记录。"
      : (filingEvents.length === 0 ? "未从巨潮资讯网获取到该公司近期公告，可能是接口暂时不可用或该公司近期无披露。" : null);

  return { overview, events: [...filingEvents, ...newsEvents], coverageNotice };
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "GET") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  const market = String(req.query?.market || "").toLowerCase();
  const id = String(req.query?.id || "").trim();
  if (!id || !["us", "cn", "hk"].includes(market)) {
    send(res, 400, { error: "market must be one of us|cn|hk and id is required" });
    return;
  }

  try {
    const result = market === "us" ? await loadUsCompany(id) : await loadCnHkCompany(id, market);
    if (!result) {
      send(res, 404, { error: "Company not found", message: "未找到匹配公司，请检查名称或代码格式。" });
      return;
    }

    const classifiedEvents = scoring
      .classifyEvents(result.events)
      .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    const screening = scoring.buildScreening(classifiedEvents);
    const sources = classifiedEvents.flatMap((e) => e.sources);

    send(res, 200, {
      market,
      id,
      company: result.overview,
      events: classifiedEvents,
      screening,
      sources,
      coverageNotice: result.coverageNotice,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    send(res, 500, {
      error: "Company intelligence request failed",
      message: error.message,
    });
  }
};
