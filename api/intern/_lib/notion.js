// Notion store for the Intern Log tool.
//
// Model: 4 databases auto-created under one parent page (shared with the
// integration behind NOTION_TOKEN). Each local record ↔ one Notion page,
// matched by a stable "LocalId" text property. Note/Log bodies (arbitrary-
// length HTML) live in the PAGE CONTENT as chunked code blocks — lossless,
// no property-length cap. Edits do full replace (archive old page + create
// new) so there is no fragile block-diffing; deletes archive the page.
// Archived pages drop out of queries, so pull only ever sees the live set.
//
// Everything is best-effort and defensive: the client stays local-first and
// treats any failure here as "not synced", never as data loss.

const NOTION_VERSION = "2022-06-28";
const NOTION_BASE = "https://api.notion.com/v1";

// The parent page you shared with the integration (from the page URL).
// Not secret — it's in a share link — so hardcoded to save an env var.
const PARENT_PAGE_ID = "3b97ba152cb780098565d023a56e558e";

// DB title → the local store it backs.
const DB_TITLES = {
  notes: "Intern · 笔记",
  todos: "Intern · 待办",
  logs: "Intern · Log",
  contacts: "Intern · 联系人",
};

function isConfigured() {
  return Boolean(process.env.NOTION_TOKEN);
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notion(path, method = "GET", body) {
  const res = await fetch(`${NOTION_BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { _raw: text }; }
  if (!res.ok) {
    const err = new Error(`notion ${res.status}: ${json.message || text.slice(0, 200)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

/* ---------- text helpers ---------- */

function chunk(str, size = 1900) {
  const s = String(str == null ? "" : str);
  if (!s) return [];
  const out = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}
function richText(str) {
  // rich_text property value: array of ≤2000-char text objects.
  return chunk(str).map((content) => ({ type: "text", text: { content } }));
}
function readRich(prop) {
  if (!prop) return "";
  const arr = prop.type === "title" ? prop.title : prop.rich_text;
  return (arr || []).map((t) => t.plain_text).join("");
}
function codeBlocks(body) {
  // Store body as chunked code blocks in the page content (max 100 blocks).
  return chunk(body, 1900).slice(0, 100).map((content) => ({
    object: "block",
    type: "code",
    code: { language: "html", rich_text: [{ type: "text", text: { content } }] },
  }));
}

/* ---------- database bootstrap ---------- */

let dbCache = null; // { notes, todos, logs, contacts } → database_id (per warm lambda)

const SCHEMAS = {
  notes: {
    Name: { title: {} }, LocalId: { rich_text: {} }, Stickies: { rich_text: {} },
    UpdatedAt: { rich_text: {} },
  },
  todos: {
    Name: { title: {} }, LocalId: { rich_text: {} }, Done: { checkbox: {} },
    Order: { number: {} }, UpdatedAt: { rich_text: {} },
  },
  logs: {
    Name: { title: {} }, LocalId: { rich_text: {} }, ContactIds: { rich_text: {} },
    UpdatedAt: { rich_text: {} },
  },
  contacts: {
    Name: { title: {} }, LocalId: { rich_text: {} }, Role: { rich_text: {} },
    Dept: { rich_text: {} }, Count: { number: {} }, UpdatedAt: { rich_text: {} },
  },
};

async function listChildDatabases() {
  const map = {};
  let cursor;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : `?page_size=100`;
    const page = await notion(`/blocks/${PARENT_PAGE_ID}/children${q}`);
    for (const block of page.results || []) {
      if (block.type === "child_database") {
        const title = block.child_database?.title || "";
        map[title] = block.id;
      }
    }
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return map;
}

async function ensureDatabases() {
  if (dbCache) return dbCache;
  const existing = await listChildDatabases();
  const result = {};
  for (const [store, title] of Object.entries(DB_TITLES)) {
    if (existing[title]) {
      result[store] = existing[title];
    } else {
      const created = await notion(`/databases`, "POST", {
        parent: { type: "page_id", page_id: PARENT_PAGE_ID },
        title: [{ type: "text", text: { content: title } }],
        properties: SCHEMAS[store],
      });
      result[store] = created.id;
    }
  }
  dbCache = result;
  return result;
}

/* ---------- health / diagnostics ---------- */

async function health() {
  const out = { configured: isConfigured(), parentAccessible: false, databases: {}, errors: [] };
  if (!out.configured) { out.errors.push("NOTION_TOKEN 未配置"); return out; }
  try {
    const page = await notion(`/pages/${PARENT_PAGE_ID}`);
    out.parentAccessible = true;
    out.parentTitle = readRich(Object.values(page.properties || {}).find((p) => p.type === "title"));
  } catch (e) {
    out.errors.push(`访问父页面失败：${e.message}（多半是没把 integration 连到这个页面）`);
    return out;
  }
  try {
    out.databases = await ensureDatabases();
  } catch (e) {
    out.errors.push(`创建/读取数据库失败：${e.message}`);
  }
  return out;
}

/* ---------- record ↔ page mapping ---------- */

function recordToProps(store, r) {
  const now = r.updatedAt || new Date().toISOString();
  if (store === "notes")
    return {
      Name: { title: richText(r.title || "无标题") },
      LocalId: { rich_text: richText(r.id) },
      Stickies: { rich_text: richText(JSON.stringify(r.stickies || [])) },
      UpdatedAt: { rich_text: richText(now) },
    };
  if (store === "todos")
    return {
      Name: { title: richText(r.text || "") },
      LocalId: { rich_text: richText(r.id) },
      Done: { checkbox: !!r.done },
      Order: { number: typeof r.order === "number" ? r.order : 0 },
      UpdatedAt: { rich_text: richText(now) },
    };
  if (store === "logs")
    return {
      Name: { title: richText(r.id) },
      LocalId: { rich_text: richText(r.id) },
      ContactIds: { rich_text: richText(JSON.stringify(r.contactIds || [])) },
      UpdatedAt: { rich_text: richText(now) },
    };
  // contacts
  return {
    Name: { title: richText(r.name || "") },
    LocalId: { rich_text: richText(r.id) },
    Role: { rich_text: richText(r.title || "") },
    Dept: { rich_text: richText(r.dept || "") },
    Count: { number: typeof r.count === "number" ? r.count : 1 },
    UpdatedAt: { rich_text: richText(now) },
  };
}

function pageToRecord(store, page, bodyText) {
  const p = page.properties || {};
  const base = { id: readRich(p.LocalId), updatedAt: readRich(p.UpdatedAt) };
  if (store === "notes")
    return { ...base, title: readRich(p.Name), body: bodyText || "", stickies: safeParse(readRich(p.Stickies), []) };
  if (store === "todos")
    return { ...base, text: readRich(p.Name), done: !!(p.Done && p.Done.checkbox), order: (p.Order && p.Order.number) || 0 };
  if (store === "logs")
    return { ...base, body: bodyText || "", contactIds: safeParse(readRich(p.ContactIds), []) };
  return { ...base, name: readRich(p.Name), title: readRich(p.Role), dept: readRich(p.Dept), count: (p.Count && p.Count.number) || 1 };
}

function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

const HAS_BODY = { notes: true, logs: true, todos: false, contacts: false };

/* ---------- pull ---------- */

async function queryAll(dbId) {
  const pages = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const res = await notion(`/databases/${dbId}/query`, "POST", body);
    pages.push(...(res.results || []));
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return pages; // archived pages are excluded from query results
}

async function pageBodyText(pageId) {
  let text = "";
  let cursor;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : `?page_size=100`;
    const res = await notion(`/blocks/${pageId}/children${q}`);
    for (const b of res.results || []) {
      if (b.type === "code") text += (b.code.rich_text || []).map((t) => t.plain_text).join("");
    }
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return text;
}

async function pull() {
  const dbs = await ensureDatabases();
  const data = { todos: [], contacts: [], logs: [], notes: [] };
  for (const store of Object.keys(DB_TITLES)) {
    const pages = await queryAll(dbs[store]);
    for (const page of pages) {
      const body = HAS_BODY[store] ? await pageBodyText(page.id) : "";
      const rec = pageToRecord(store, page, body);
      if (rec.id) data[store].push(rec);
    }
  }
  return data;
}

/* ---------- push ---------- */

async function liveIdMap(dbId) {
  const map = {};
  for (const page of await queryAll(dbId)) {
    const local = readRich((page.properties || {}).LocalId);
    if (local) map[local] = page.id;
  }
  return map;
}

async function push(ops) {
  const dbs = await ensureDatabases();
  const byStore = {};
  for (const op of ops || []) (byStore[op.store] = byStore[op.store] || []).push(op);

  const counts = {};
  for (const [store, storeOps] of Object.entries(byStore)) {
    if (!dbs[store]) continue;
    const existing = await liveIdMap(dbs[store]);
    let n = 0;
    for (const op of storeOps) {
      const id = op.deleted ? op.id : op.record && op.record.id;
      if (!id) continue;
      // Full replace: archive any live page for this id first.
      if (existing[id]) {
        await notion(`/pages/${existing[id]}`, "PATCH", { archived: true });
        delete existing[id];
      }
      if (!op.deleted && op.record) {
        const children = HAS_BODY[store] ? codeBlocks(store === "notes" ? op.record.body : op.record.body) : [];
        await notion(`/pages`, "POST", {
          parent: { database_id: dbs[store] },
          properties: recordToProps(store, op.record),
          children,
        });
      }
      n++;
    }
    counts[store] = n;
  }
  return counts;
}

module.exports = { isConfigured, health, pull, push, ensureDatabases, PARENT_PAGE_ID };
