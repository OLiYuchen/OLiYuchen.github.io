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

async function getTickerMap() {
  if (tickerCache && Date.now() - tickerCacheAt < TICKER_CACHE_TTL_MS) return tickerCache;
  const raw = await fetchJson(`${SEC_WWW_BASE}/files/company_tickers.json`, { headers: secHeaders() }, 12000);
  tickerCache = Object.values(raw).map((item) => ({
    cik: normalizeCik(item.cik_str),
    ticker: String(item.ticker || "").toUpperCase(),
    title: item.title || "",
  }));
  tickerCacheAt = Date.now();
  return tickerCache;
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

const HIGH_PRIORITY_FORMS = new Set(["8-K", "10-K", "10-Q", "20-F", "6-K", "SC 13D", "SC 13D/A", "SC 13G", "SC 13G/A"]);

function buildFilingEvents(submissions, company) {
  const recent = submissions?.filings?.recent;
  if (!recent?.accessionNumber) return [];
  return recent.accessionNumber.slice(0, 20).map((accession, index) => {
    const accessionNoDash = accession.replace(/-/g, "");
    const doc = recent.primaryDocument[index];
    const form = recent.form[index];
    const filingDate = recent.filingDate[index];
    const reportDate = recent.reportDate[index];
    const description = recent.primaryDocDescription?.[index] || `${form} filing`;
    const sourceId = `sec-${accession}`;
    return {
      id: `filing-${accession}`,
      market: "us",
      eventType: "filing",
      company: company.title,
      ticker: company.ticker,
      formType: form,
      timestamp: filingDate ? `${filingDate}T00:00:00Z` : null,
      title: `${form}：${description}`,
      summary: `${company.title} 提交了 ${form}${reportDate ? `，报告期截至 ${reportDate}` : ""}。`,
      importance: HIGH_PRIORITY_FORMS.has(form) ? "high" : "medium",
      sourceIds: [sourceId],
      sources: [
        {
          id: sourceId,
          sourceType: "regulatory",
          credibility: "official",
          publisher: "U.S. Securities and Exchange Commission (SEC)",
          title: `${form}：${description}`,
          publishedAt: filingDate ? `${filingDate}T00:00:00Z` : null,
          url: `${SEC_WWW_BASE}/Archives/edgar/data/${Number(company.cik)}/${accessionNoDash}/${doc}`,
        },
      ],
    };
  });
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
