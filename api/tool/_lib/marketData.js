// Fills the two biggest gaps versus the US tier for A股/港股: a real-time
// quote and (for A股 only) structured financial figures. Both were verified
// by hand against live endpoints before wiring in — see commit history /
// conversation notes for the curl tests. Neither needs a login or API key;
// both are public data-push endpoints the providers' own websites use.
//
// Reliability notes from that testing:
// - Sina's quote push (hq.sinajs.cn) was consistently fast and stable for
//   both A股 and HK in repeated tests, but REQUIRES a Referer header from a
//   sina.com.cn-style origin or it returns "Forbidden".
// - Eastmoney's push2 real-time quote endpoint was flaky (intermittent
//   connection failures / 502s) in testing, so it is NOT used here.
// - Eastmoney's datacenter-web API (used by their own "数据中心" pages) was
//   stable and is the source for A股 structured financials — no reliable
//   free equivalent was found for HK financials, so that gap remains open.

const { fetchWithTimeout } = require("./util");

const SINA_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Referer: "https://finance.sina.com.cn",
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// A股 sina format (comma-separated, positions are stable and well-documented
// publicly): 0 name, 1 open, 2 prevClose, 3 current, 4 high, 5 low, ...,
// 30 date, 31 time. Only numeric positions are read — the name field can be
// GBK-mangled when read as UTF-8, but that never shifts comma positions
// since GBK continuation bytes never encode as 0x2C.
function parseAShareQuote(raw, code) {
  const match = raw.match(/="([^"]*)"/);
  if (!match) return null;
  const fields = match[1].split(",");
  const current = toNumber(fields[3]);
  const prevClose = toNumber(fields[2]);
  if (current == null || !current) return null;
  const change = prevClose ? current - prevClose : null;
  const changePercent = prevClose ? (change / prevClose) * 100 : null;
  return {
    available: true,
    symbol: code,
    close: current,
    changePercent: changePercent != null ? Number(changePercent.toFixed(2)) : null,
    time: fields[30] && fields[31] ? `${fields[30]} ${fields[31]}` : null,
    source: "新浪财经",
    sourceUrl: `https://finance.sina.com.cn/realstock/company/${code.startsWith("6") ? "sh" : "sz"}${code}/nc.shtml`,
  };
}

// HK sina format (rt_hk prefix): 0 English name, 1 Chinese name, 2 open,
// 3 prevClose, 4 high, 5 low, 6 current, 7 change, 8 changePercent,
// ..., 17 date, 18 time.
function parseHkQuote(raw, code) {
  const match = raw.match(/="([^"]*)"/);
  if (!match) return null;
  const fields = match[1].split(",");
  const current = toNumber(fields[6]);
  if (current == null || !current) return null;
  const changePercent = toNumber(fields[8]);
  return {
    available: true,
    symbol: code,
    close: current,
    changePercent: changePercent != null ? Number(changePercent.toFixed(2)) : null,
    time: fields[17] && fields[18] ? `${fields[17]} ${fields[18]}` : null,
    source: "新浪财经",
    sourceUrl: `https://finance.sina.com.cn/hkstock/quotes/${code}.html`,
  };
}

async function getQuote(company, market) {
  const listKey = market === "hk" ? `rt_hk${company.code}` : `${company.column === "sse" ? "sh" : "sz"}${company.code}`;
  try {
    const response = await fetchWithTimeout(`http://hq.sinajs.cn/list=${listKey}`, { headers: SINA_HEADERS }, 7000);
    const raw = await response.text();
    const parsed = market === "hk" ? parseHkQuote(raw, company.code) : parseAShareQuote(raw, company.code);
    return parsed || { available: false, reason: "行情数据当前不可用" };
  } catch (error) {
    return { available: false, reason: "行情数据当前不可用" };
  }
}

function formatRmb(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const abs = Math.abs(number);
  if (abs >= 1e8) return `¥${(number / 1e8).toFixed(2)}亿`;
  if (abs >= 1e4) return `¥${(number / 1e4).toFixed(2)}万`;
  return `¥${number.toLocaleString()}`;
}

// A股 only — no free structured financials source was found for 港股 in
// this round (see conversation notes); getFinancials is not called for hk.
async function getFinancials(company) {
  const exchange = company.column === "sse" ? "SH" : "SZ";
  const filter = encodeURIComponent(`(SECUCODE="${company.code}.${exchange}")`);
  // Without an explicit sort, this report returns rows oldest-first — a
  // caught-in-review bug: pageSize=1 alone would silently return the
  // OLDEST quarter on record, not the latest one. sortColumns must be
  // "REPORTDATE" (no underscore) — "REPORT_DATE" 404s with "排序列不存在".
  const url = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_LICO_FN_CPD&columns=ALL&filter=${filter}&sortColumns=REPORTDATE&sortTypes=-1&pageSize=1`;
  try {
    const response = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" } }, 8000);
    const data = await response.json();
    const row = data?.result?.data?.[0];
    if (!row) return { revenue: null, netIncome: null };
    const end = row.REPORTDATE ? String(row.REPORTDATE).slice(0, 10) : null;
    return {
      revenue: row.TOTAL_OPERATE_INCOME != null ? { label: "营业总收入", value: row.TOTAL_OPERATE_INCOME, formatted: formatRmb(row.TOTAL_OPERATE_INCOME), end } : null,
      netIncome: row.PARENT_NETPROFIT != null ? { label: "归母净利润", value: row.PARENT_NETPROFIT, formatted: formatRmb(row.PARENT_NETPROFIT), end } : null,
    };
  } catch (error) {
    return { revenue: null, netIncome: null };
  }
}

module.exports = { getQuote, getFinancials };
