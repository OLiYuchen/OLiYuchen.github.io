// GET /api/tool/search?q=...
// Resolves a free-text query (company name, alias, or ticker/code) into a
// list of candidates across all three market tiers. The frontend either
// auto-navigates (single candidate) or shows a disambiguation list.

const sec = require("./_lib/sec");
const cninfo = require("./_lib/cninfo");
const { settleAll, send, setCors } = require("./_lib/util");

function toCandidate(source, item) {
  if (source === "us") {
    return { market: "us", id: item.ticker, name: item.title, ticker: item.ticker, exchange: "US" };
  }
  const market = item.category === "港股" ? "hk" : "cn";
  return { market, id: item.code, name: item.name, ticker: item.code, exchange: market === "hk" ? "HKEX" : "A股" };
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

  const [usResults, cnResults] = await settleAll([sec.searchCompanies(query), cninfo.searchCompanies(query)]);

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
