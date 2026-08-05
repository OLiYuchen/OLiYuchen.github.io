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
    const withMeta = { ...record, _dirty: true, updatedAt: record.updatedAt || now };
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

  return { openDB, all, get, put, remove, uid, todayStr, requestPersistence, STORES };
})();

/* ============================================================
   Sync — best-effort mirror to Notion via /api/intern/sync.
   Phase 1 ships this DISABLED (SYNC_ENABLED = false) so the app
   is 100% local and needs no Notion setup to work. Flip the flag
   (and build the Notion DBs) in Phase 2. Writes are debounced and
   batched; failures are swallowed and retried on next change.
   ============================================================ */

const Sync = (() => {
  const SYNC_ENABLED = false; // Phase 2: set true once Notion DBs exist
  const API = "/api/intern/sync";
  const pending = new Map(); // key `${store}:${id}` -> {store, record|delete}
  let timer = null;
  let listeners = [];

  function setBadge(state) {
    listeners.forEach((fn) => fn(state));
  }
  function onStatus(fn) {
    listeners.push(fn);
  }

  function schedule(store, record) {
    if (!SYNC_ENABLED) {
      setBadge("local");
      return;
    }
    pending.set(`${store}:${record.id}`, { store, record });
    debounce();
  }
  function scheduleDelete(store, id) {
    if (!SYNC_ENABLED) return;
    pending.set(`${store}:${id}`, { store, id, deleted: true });
    debounce();
  }

  function debounce() {
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  }

  async function flush() {
    if (!SYNC_ENABLED || pending.size === 0) return;
    const batch = [...pending.values()];
    pending.clear();
    setBadge("syncing");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ops: batch }),
      });
      if (!res.ok) throw new Error(`sync ${res.status}`);
      setBadge("local");
    } catch (err) {
      // Re-queue so the next change retries these too. Never surfaces
      // as a blocking error — local data is already safe.
      batch.forEach((op) => pending.set(`${op.store}:${op.record ? op.record.id : op.id}`, op));
      setBadge("error");
    }
  }

  return { schedule, scheduleDelete, onStatus, flush, SYNC_ENABLED };
})();
