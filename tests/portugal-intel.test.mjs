import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function mockReq(method = "GET", body = "") {
  return {
    method,
    on(event, cb) {
      if (event === "data" && body) cb(Buffer.from(body));
      if (event === "end") cb();
    },
  };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value) {
      this.body = value || "";
    },
  };
}

async function call(handlerPath, req) {
  const handler = require(path.join(root, handlerPath));
  const res = mockRes();
  await handler(req, res);
  return { status: res.statusCode, json: JSON.parse(res.body || "{}") };
}

const html = read("portugal-intel/index.html");
const js = read("portugal-intel/app.js");
const css = read("portugal-intel/styles.css");

assert.match(html, /\/portugal-intel\/styles\.css/);
assert.match(html, /\/portugal-intel\/app\.js/);
assert.match(html, /每日推送/);
assert.doesNotMatch(html + js + css, /signal-ledger|Company Watch|公司信号账本|Corgi/);

assert.match(js, /function localStatus/);
assert.match(js, /function localAction/);
assert.match(js, /本地测试扫描已完成/);
assert.match(js, /本地测试简报已生成/);

const status = await call("api/portugal-intel/status.js", mockReq("GET"));
assert.equal(status.status, 200);
assert.ok(Array.isArray(status.json.missingEnv));
assert.equal(status.json.marketTimezone, "Europe/Lisbon");

const discovery = await call("api/portugal-intel/actions.js", mockReq("POST", JSON.stringify({ action: "discovery" })));
assert.equal(discovery.status, 200);
assert.equal(discovery.json.configured, false);
assert.match(discovery.json.message, /发现请求|真实发现流水线/);

const digest = await call("api/portugal-intel/actions.js", mockReq("POST", JSON.stringify({ action: "digest" })));
assert.equal(digest.status, 200);
assert.equal(digest.json.configured, false);
assert.match(digest.json.message, /简报请求|真实日报/);

const badAction = await call("api/portugal-intel/actions.js", mockReq("POST", JSON.stringify({ action: "unknown" })));
assert.equal(badAction.status, 400);

console.log("portugal-intel tests passed");
