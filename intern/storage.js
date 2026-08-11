/* ============================================================
   storage.js — local-first data layer for Intern Log.

   IndexedDB is the source of truth: every write lands here first
   and synchronously-enough that the UI never blocks or loses a
   note, even offline. Notion is a best-effort background MIRROR
   (Phase 2) — if it's unconfigured or fails, the app is fully
   usable regardless. This mirrors the existing tool's philosophy
   (see api/tool/feedback.js: the guaranteed path never depends on
   the remote sync succeeding).

   Stores (object stores keyed by `id`):
     todos    { id, text, done, createdAt, doneAt, order }
     contacts { id, name, title, dept, createdAt, count }
     logs     { id=date(YYYY-MM-DD), body(html), contactIds[], updatedAt }
     notes    { id, title, body(html), stickies[], createdAt, updatedAt }
   Each record also carries { _dirty, _syncedAt } for the sync layer.
   ============================================================ */

const Store = (() => {
  const DB_NAME = "intern-log";
  const DB_VERSION = 1;
  const STORES = ["todos", "contacts", "logs", "notes"];
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: "id" });
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(storeName, mode, fn) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const t = db.transaction(storeName, mode);
          const store = t.objectStore(storeName);
          let result;
          Promise.resolve(fn(store)).then((r) => (result = r));
          t.oncomplete = () => resolve(result);
          t.onerror = () => reject(t.error);
          t.onabort = () => reject(t.error);
        }),
    );
  }

  function reqAsPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function all(storeName) {
    return tx(storeName, "readonly", (store) => reqAsPromise(store.getAll()));
  }

  async function get(storeName, id) {
    return tx(storeName, "readonly", (store) => reqAsPromise(store.get(id)));
  }

  async function put(storeName, record) {
    const now = new Date().toISOString();
    // Always bump updatedAt on write — sync's last-write-wins merge depends on
    // it advancing on every edit (createdAt is preserved via the spread).
    const withMeta = { ...record, _dirty: true, updatedAt: now };
    await tx(storeName, "readwrite", (store) => store.put(withMeta));
    Sync.schedule(storeName, withMeta);
    return withMeta;
  }

  async function remove(storeName, id) {
    await tx(storeName, "readwrite", (store) => store.delete(id));
    Sync.scheduleDelete(storeName, id);
  }

  /* ---------- id + helpers ---------- */
  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  function todayStr() {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().slice(0, 10);
  }

  // Ask the browser to mark this origin's storage as persistent, so it is
  // exempt from automatic eviction under disk pressure (and from routine
  // "clear cache" style cleanup in Chromium). Best-effort: unsupported or
  // denied just falls back to normal (best-effort) storage. Does NOT stop a
  // manual "clear site data", nor Safari's fixed 7-day cap — Notion sync is
  // the real durability fix.
  async function requestPersistence() {
    try {
      if (!navigator.storage || !navigator.storage.persist) return { supported: false, persisted: false };
      let persisted = await navigator.storage.persisted();
      if (!persisted) persisted = await navigator.storage.persist();
      return { supported: true, persisted };
    } catch (e) {
      return { supported: false, persisted: false };
    }
  }

  // Full snapshot of every store — the backup file's contents. Plain records,
  // no framework wrapping, so a backup is human-readable and re-importable.
  async function exportAll() {
    const data = {};
    for (const s of STORES) data[s] = await all(s);
    return { _app: "intern-log", _version: DB_VERSION, _exportedAt: new Date().toISOString(), data };
  }

  // Restore from a backup. Default is a safe MERGE (same id overwrites, other
  // existing records are kept). Pass { replace:true } to wipe first. Writes
  // records verbatim (raw put, bypassing the dirty/sync bookkeeping).
  async function importAll(dump, opts = {}) {
    if (!dump || typeof dump !== "object" || !dump.data) throw new Error("无效的备份文件");
    const counts = {};
    for (const s of STORES) {
      const recs = dump.data[s];
      if (!Array.isArray(recs)) continue;
      if (opts.replace) await tx(s, "readwrite", (store) => store.clear());
      for (const rec of recs) {
        if (rec && rec.id != null) await tx(s, "readwrite", (store) => store.put({ ...rec }));
      }
      counts[s] = recs.length;
    }
    return counts;
  }

  // Write a record verbatim (no _dirty flip, no sync scheduling). Used by the
  // sync layer to land records pulled from Notion without bouncing them back.
  async function putRaw(storeName, record) {
    await tx(storeName, "readwrite", (store) => store.put(record));
    return record;
  }

  return { openDB, all, get, put, putRaw, remove, uid, todayStr, requestPersistence, exportAll, importAll, STORES };
})();

/* ============================================================
   Sync — two-way mirror to Notion via /api/intern/sync.

   Model: local IndexedDB stays the source of truth for the UI (instant,
   offline-capable). Notion is the durable cloud mirror AND the point where
   data from different origins/devices converges.

   - pull(): fetch all records from Notion; for each, if it's newer than the
     local copy (or local is missing) write it locally with putRaw (so it is
     NOT re-queued for push). Never deletes local records — safest bias.
   - pushDirty(): send every locally-changed record (_dirty) plus any pending
     deletes; on success clear the dirty flags / delete queue.
   - syncNow(): pull then pushDirty. Runs on boot (after auth) and whenever a
     change is made (debounced). Any failure just leaves local intact and
     shows an error badge — data is never at risk.

   Auth: calls go same-origin with the intern_auth cookie (set by
   /api/intern/auth via the password gate). Without it the API 401s and we
   fall back to local-only.
   ============================================================ */

const Sync = (() => {
  const SYNC_ENABLED = true;
  const API = "/api/intern/sync";
  const DELETES_KEY = "intern.pendingDeletes";
  let listeners = [];
  let running = false;
  let pushTimer = null;

  function setBadge(state) { listeners.forEach((fn) => fn(state)); }
  function onStatus(fn) { listeners.push(fn); }

  // We hold the auth cookie iff the non-HttpOnly marker cookie is present.
  function authed() {
    return document.cookie.split("; ").some((c) => c === "intern_gate=1" || c.startsWith("intern_gate=1"));
  }

  function loadDeletes() { try { return JSON.parse(localStorage.getItem(DELETES_KEY) || "[]"); } catch { return []; } }
  function saveDeletes(list) { localStorage.setItem(DELETES_KEY, JSON.stringify(list)); }

  function stripMeta(rec) {
    const out = {};
    for (const k of Object.keys(rec)) if (!k.startsWith("_")) out[k] = rec[k];
    return out;
  }

  async function api(op, extra) {
    const res = await fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op, ...extra }),
    });
    if (res.status === 401) { const e = new Error("unauthorized"); e.code = 401; throw e; }
    const json = await res.json().catch(() => ({}));
    if (!json.ok) throw new Error(json.error || json.message || `sync ${res.status}`);
    return json;
  }

  // Change hooks called by Store.put / Store.remove. A local change only needs
  // to PUSH (pulling on every keystroke-debounce would be wasteful); the full
  // pull+push runs on boot via syncNow().
  function schedule() {
    if (!SYNC_ENABLED) { setBadge("local"); return; }
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => runPush(), 1500);
  }

  async function runPush() {
    if (!SYNC_ENABLED || !authed() || running) return;
    running = true;
    setBadge("syncing");
    try { await pushDirty(); setBadge("synced"); }
    catch (err) { setBadge(err.code === 401 ? "local" : "error"); }
    finally { running = false; }
  }
  function scheduleDelete(store, id) {
    if (!SYNC_ENABLED) return;
    const list = loadDeletes();
    if (!list.some((d) => d.store === store && d.id === id)) { list.push({ store, id }); saveDeletes(list); }
    schedule();
  }

  async function pull() {
    const { data } = await api("pull");
    for (const store of Store.STORES) {
      for (const remote of data[store] || []) {
        if (!remote || remote.id == null) continue;
        const local = await Store.get(store, remote.id);
        const newer = !local || String(remote.updatedAt || "") >= String(local.updatedAt || "");
        if (newer) await Store.putRaw(store, { ...remote, _dirty: false, _syncedAt: new Date().toISOString() });
      }
    }
  }

  async function pushDirty() {
    const ops = [];
    const dirtyRefs = [];
    for (const store of Store.STORES) {
      for (const rec of await Store.all(store)) {
        if (rec._dirty) { ops.push({ store, record: stripMeta(rec) }); dirtyRefs.push({ store, rec }); }
      }
    }
    const deletes = loadDeletes();
    for (const d of deletes) ops.push({ store: d.store, id: d.id, deleted: true });
    if (ops.length === 0) return;

    await api("push", { ops });

    // Mark pushed records clean and clear the delete queue.
    for (const { store, rec } of dirtyRefs) await Store.putRaw(store, { ...rec, _dirty: false, _syncedAt: new Date().toISOString() });
    saveDeletes([]);
  }

  async function syncNow() {
    if (!SYNC_ENABLED || !authed() || running) return;
    running = true;
    setBadge("syncing");
    try {
      await pull();
      await pushDirty();
      setBadge("synced");
      listeners.forEach(() => {});
      document.dispatchEvent(new CustomEvent("intern:synced"));
    } catch (err) {
      setBadge(err.code === 401 ? "local" : "error");
    } finally {
      running = false;
    }
  }

  return { schedule, scheduleDelete, onStatus, syncNow, authed, SYNC_ENABLED };
})();
