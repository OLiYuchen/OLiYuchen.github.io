// Small daily close-price series (~20 trading days) for the price sparkline
// on the company header. Pure visual polish — every path is best-effort and
// returns null on any failure, so a missing sparkline never affects the
// quote number or anything else. Sources reuse the same providers already
// wired up for the live quote, verified by hand against live endpoints:
//   - US:  Nasdaq chart API (same host as the quote in sec.js)
//   - A股: Sina kline JSON (same provider as the quote in marketData.js)
//   - HK:  Eastmoney push2his kline (Sina has no working HK kline endpoint;
//          Eastmoney is a bit flaky, hence best-effort)

const { fetchWithTimeout, fetchJson } = require("./util");

const SPARK_POINTS = 20;

function tail(series, n = SPARK_POINTS) {
  return series.length > n ? series.slice(series.length - n) : series;
}

async function getUsSparkline(ticker) {
  const symbol = String(ticker).toUpperCase();
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 40);
  const fmt = (d) => d.toISOString().slice(0, 10);
  try {
    const data = await fetchJson(
      `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/chart?assetclass=stocks&fromdate=${fmt(from)}&todate=${fmt(to)}`,
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
    const points = (data?.data?.chart || [])
      .map((p) => Number(p?.y))
      .filter((n) => Number.isFinite(n) && n > 0);
    return points.length >= 3 ? tail(points) : null;
  } catch (error) {
    return null;
  }
}

async function getAShareSparkline(company) {
  const prefix = company.column === "sse" ? "sh" : "sz";
  try {
    const data = await fetchJson(
      `https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData?symbol=${prefix}${company.code}&scale=240&ma=no&datalen=${SPARK_POINTS}`,
      { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://finance.sina.com.cn" } },
      8000,
    );
    const points = (Array.isArray(data) ? data : [])
      .map((row) => Number(row?.close))
      .filter((n) => Number.isFinite(n) && n > 0);
    return points.length >= 3 ? tail(points) : null;
  } catch (error) {
    return null;
  }
}

async function getHkSparkline(code) {
  try {
    const response = await fetchWithTimeout(
      `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=116.${code}&fields1=f1&fields2=f51,f53&klt=101&fqt=1&end=20500101&lmt=${SPARK_POINTS}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      8000,
    );
    const data = await response.json();
    const points = (data?.data?.klines || [])
      .map((line) => Number(String(line).split(",")[1]))
      .filter((n) => Number.isFinite(n) && n > 0);
    return points.length >= 3 ? tail(points) : null;
  } catch (error) {
    return null;
  }
}

// market: "us" | "cn" | "hk". `company` needs { ticker/code, column } as
// appropriate. Returns a number[] of daily closes, or null.
async function getSparkline(market, company) {
  try {
    if (market === "us") return await getUsSparkline(company.ticker || company.id);
    if (market === "hk") return await getHkSparkline(company.code || company.id);
    return await getAShareSparkline(company);
  } catch (error) {
    return null;
  }
}

module.exports = { getSparkline };
