// Minimal response helpers for the /api/intern functions — kept self-contained
// so the functions don't depend on cross-directory bundling.

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", res.req ? res.req.headers.origin || "*" : "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = { setCors, send };
