// GET /api/tool/search?q=...
// Resolves a free-text query (company name, alias, or ticker/code) into a
// list of candidates across all three market tiers. The frontend either
// auto-navigates (single candidate) or shows a disambiguation list.

const sec = require("./_lib/sec");
const cninfo = require("./_lib/cninfo");
const { resolveAlias } = require("./_lib/aliases");
const { settleAll, send, setCors } = require("./_lib/util");

function toCandidate(source, item) {
  if (source === "us") {
    return { market: "us", id: item.ticker, name: item.title, ticker: item.ticker, exchange: "US" };
  }
  const market = item.category === "港股" ? "hk" : "cn";
  return { market, id: item.code, name: item.name, ticker: item.code, exchange: market === "hk" ? "HKEX" : "A股" };
}

const A_SHARE_CODE = /^\d{6}(\.(sh|sz))?$/i;
const HK_CODE = /^\d{3,5}\.hk$/i;
const PURE_CJK = /^[一-鿿]+$/;

// The SEC ticker map is a large file (~1MB+, thousands of entries) that's
// only useful for English tickers/names or a known Chinese alias — skip
// fetching it entirely for queries that structurally can't be a US ticker,
// since that fetch (especially on a cold Vercel function instance) is the
// slowest part of a search request.
function shouldQuerySec(query) {
  if (A_SHARE_CODE.test(query)) return false;
  if (HK_CODE.test(query)) return false;
  if (PURE_CJK.test(query)) return Boolean(resolveAlias(query));
  return true;
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

  const query = String(req.query?.q || "").trim();
  if (!query) {
    send(res, 200, { query, candidates: [] });
    return;
  }

  // Entity resolution results barely change minute to minute, so let
  // Vercel's edge cache serve repeat/popular queries instantly instead of
  // re-hitting SEC/cninfo every keystroke across every user.
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=300, stale-while-revalidate=600");

  const [usResults, cnResults] = await settleAll([
    shouldQuerySec(query) ? sec.searchCompanies(query) : Promise.resolve([]),
    cninfo.searchCompanies(query),
  ]);

  const candidates = [
    ...((usResults || []).map((item) => toCandidate("us", item))),
    ...((cnResults || []).map((item) => toCandidate("cn", item))),
  ];

  // De-duplicate in case both tiers somehow match the same id.
  const seen = new Set();
  const deduped = candidates.filter((c) => {
    const key = `${c.market}:${c.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  send(res, 200, { query, candidates: deduped.slice(0, 10) });
};
