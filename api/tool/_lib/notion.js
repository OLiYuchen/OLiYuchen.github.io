// Optional: syncs feedback submissions into a Notion database so they're
// searchable/manageable in one place, in addition to the mailto: email that
// the browser sends directly. Entirely best-effort — if NOTION_TOKEN /
// NOTION_DATABASE_ID aren't configured, or the write fails for any reason,
// callers should treat this as "not synced" and NOT block the user-facing
// mailto flow, which is the guaranteed delivery path.

const { fetchJson } = require("./util");

const NOTION_VERSION = "2022-06-28";
const NOTION_BASE = "https://api.notion.com/v1";

function isConfigured() {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);
}

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

let schemaCache = null;
let schemaCacheAt = 0;
const SCHEMA_CACHE_TTL_MS = 1000 * 60 * 30;

// Introspects the target database so we only send properties that actually
// exist (with a compatible type) — keeps this working even if the user names
// their columns slightly differently, instead of hard failing on mismatch.
async function getSchema() {
  if (schemaCache && Date.now() - schemaCacheAt < SCHEMA_CACHE_TTL_MS) return schemaCache;
  const db = await fetchJson(
    `${NOTION_BASE}/databases/${process.env.NOTION_DATABASE_ID}`,
    { headers: notionHeaders() },
    8000,
  );
  schemaCache = db.properties || {};
  schemaCacheAt = Date.now();
  return schemaCache;
}

function findPropertyByType(schema, type) {
  const entry = Object.entries(schema).find(([, def]) => def.type === type);
  return entry ? entry[0] : null;
}

function findPropertyByNames(schema, candidateNames, type) {
  for (const name of candidateNames) {
    if (schema[name] && schema[name].type === type) return name;
  }
  return null;
}

async function submitFeedback({ type, title, content, diagnostics, pageUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };

  try {
    const schema = await getSchema();
    const titleProp = findPropertyByType(schema, "title");
    if (!titleProp) return { ok: false, reason: "no_title_property" };

    const properties = {
      [titleProp]: { title: [{ text: { content: String(title || "未命名反馈").slice(0, 200) } }] },
    };

    const typeProp = findPropertyByNames(schema, ["类型", "反馈类型", "Type"], "select");
    if (typeProp) properties[typeProp] = { select: { name: type || "其他" } };

    const contentProp = findPropertyByNames(schema, ["内容", "详情", "Content"], "rich_text");
    if (contentProp) properties[contentProp] = { rich_text: [{ text: { content: String(content || "").slice(0, 2000) } }] };

    const diagnosticsProp = findPropertyByNames(schema, ["诊断信息", "Diagnostics"], "rich_text");
    if (diagnosticsProp && diagnostics) {
      properties[diagnosticsProp] = { rich_text: [{ text: { content: String(diagnostics).slice(0, 2000) } }] };
    }

    const urlProp = findPropertyByNames(schema, ["页面URL", "来源页面", "URL"], "url");
    if (urlProp && pageUrl) properties[urlProp] = { url: pageUrl };

    const body = JSON.stringify({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties,
    });

    const response = await fetch(`${NOTION_BASE}/pages`, { method: "POST", headers: notionHeaders(), body });
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return { ok: false, reason: `notion_${response.status}`, detail: errText.slice(0, 300) };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "exception", detail: error.message };
  }
}

module.exports = { isConfigured, submitFeedback };
