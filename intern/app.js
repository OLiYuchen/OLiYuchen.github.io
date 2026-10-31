/* ============================================================
   app.js — Intern Log UI logic (Phase 1, local-first).

   Data lives in IndexedDB via Store (storage.js). Notion sync is
   Phase 2. Everything here works fully offline.
   ============================================================ */

/* ---------- tiny helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function esc(t) {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function stripTags(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}
function plainTextToHtml(text) {
  return esc(text)
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line || "<br>").join("<br>");
      return `<p>${lines}</p>`;
    })
    .join("");
}
function normalizeEditorHtml(html) {
  const root = document.createElement("div");
  root.innerHTML = html || "";
  root.querySelectorAll("*").forEach((el) => {
    const keepClass = el.classList.contains("term") || el.classList.contains("term-en") || el.classList.contains("hl");
    el.removeAttribute("style");
    el.removeAttribute("face");
    el.removeAttribute("color");
    el.removeAttribute("size");
    if (!keepClass && el.tagName !== "MARK") el.removeAttribute("class");
  });
  return root.innerHTML;
}
function installPlainPaste(el, onChange) {
  el.addEventListener("paste", (e) => {
    const text = e.clipboardData?.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    document.execCommand("insertHTML", false, plainTextToHtml(text));
    onChange?.();
  });
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ============================================================
   Password gate (Phase 1: client-side).
   No server data flows in Phase 1, so this overlay is a privacy
   veil, not a hard security boundary — that arrives in Phase 2
   with middleware.js + INTERN_PASSWORD. The password is stored as
   a SHA-256 hash (never plaintext). Change it by replacing
   PASSWORD_HASH below with the hash of your own password:
     await crypto.subtle.digest("SHA-256", new TextEncoder().encode("yourpw"))
   or just run  Intern.setPassword("yourpw")  in the console once
   (it prints the hash to paste here).
   ============================================================ */
const GATE_FLAG = "intern.gate.v1";
// SHA-256 of the access password. Default password is "fosun2026" — CHANGE IT:
// run  await Intern.setPassword("your-new-pw")  in the console, paste the
// printed hash here, then reload. (Phase 2 replaces this with server-side
// INTERN_PASSWORD enforcement in middleware.js.)
let PASSWORD_HASH = "8144743c0c980ff5254ea257e266df423537859b0c1fca45e707d29d380fe24c";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function unlockApp() {
  document.body.classList.remove("gate-locked");
}

// Phase 2 gate: authenticate against the server (/api/intern/auth) so we get
// the intern_auth cookie that unlocks the sync API. If the endpoint is
// unreachable (static/local dev with no backend), fall back to the offline
// client-side SHA check so the app is still usable locally (sync stays off).
async function initGate() {
  if (Sync.authed() || localStorage.getItem(GATE_FLAG) === "1" || sessionStorage.getItem(GATE_FLAG) === "1") {
    unlockApp();
    return;
  }
  const form = $("#gateForm");
  const input = $("#gatePassword");
  const error = $("#gateError");
  const showError = () => { error.hidden = false; input.value = ""; input.focus(); };
  input.focus();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.hidden = true;
    const pw = input.value;
    let res;
    try {
      res = await fetch("/api/intern/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
    } catch (netErr) {
      // No backend reachable → offline fallback (local-only, no cloud sync).
      const hash = await sha256Hex(pw);
      if (hash === PASSWORD_HASH) { localStorage.setItem(GATE_FLAG, "1"); unlockApp(); }
      else showError();
      return;
    }
    if (res.ok) {
      localStorage.setItem(GATE_FLAG, "1");
      unlockApp();
      startSync(); // first-time auth → kick off the initial pull+push
    } else if (res.status === 404 || res.status === 405 || res.status === 501) {
      // Static local server: API route is absent, so use the offline gate.
      const hash = await sha256Hex(pw);
      if (hash === PASSWORD_HASH) { localStorage.setItem(GATE_FLAG, "1"); unlockApp(); }
      else showError();
    } else {
      showError(); // 401 wrong password (or other server error)
    }
  });
}

// Idempotent: starts the sync loop once we hold the auth cookie. Re-renders
// the visible lists whenever a sync round completes (so pulled cloud data,
// e.g. notes made on another origin/device, shows up).
let syncStarted = false;
function startSync() {
  if (syncStarted || !Sync.SYNC_ENABLED || !Sync.authed()) return;
  syncStarted = true;
  document.addEventListener("intern:synced", onSynced);
  Sync.syncNow();
}
async function onSynced() {
  await Todo.render();
  await Notebook.renderList();
  await Log.renderHistory();
  await Contacts.renderDirectory($("#contactSearch") ? $("#contactSearch").value : "");
}

/* ============================================================
   TODO
   ============================================================ */
const Todo = (() => {
  const listEl = $("#todoList");
  const doneEl = $("#todoDoneList");
  const countEl = $("#todoCount");
  const doneCountEl = $("#todoDoneCount");

  async function render() {
    const all = (await Store.all("todos")).sort((a, b) => (a.order || 0) - (b.order || 0));
    const active = all.filter((t) => !t.done);
    const done = all.filter((t) => t.done).sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""));
    countEl.textContent = active.length;
    doneCountEl.textContent = done.length;
    listEl.innerHTML = active.map(rowHtml).join("");
    doneEl.innerHTML = done.map(rowHtml).join("");
    bind(listEl);
    bind(doneEl);
  }

  function rowHtml(t) {
    return `<li class="todo-item ${t.done ? "done" : ""}" data-id="${t.id}">
      <input class="todo-check" type="checkbox" ${t.done ? "checked" : ""} aria-label="完成" />
      <span class="todo-text" contenteditable="true" spellcheck="false">${esc(t.text)}</span>
      <button class="todo-del" aria-label="删除">×</button>
    </li>`;
  }

  function bind(root) {
    $$(".todo-item", root).forEach((li) => {
      const id = li.dataset.id;
      li.querySelector(".todo-check").addEventListener("change", (e) => toggle(id, e.target.checked));
      li.querySelector(".todo-del").addEventListener("click", () => del(id));
      const text = li.querySelector(".todo-text");
      text.addEventListener("blur", () => editText(id, text.textContent));
      text.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); text.blur(); } });
    });
  }

  async function add(textVal) {
    const text = textVal.trim();
    if (!text) return;
    await Store.put("todos", { id: Store.uid(), text, done: false, order: Date.now(), createdAt: new Date().toISOString() });
    render();
  }
  async function toggle(id, done) {
    const t = await Store.get("todos", id);
    if (!t) return;
    await Store.put("todos", { ...t, done, doneAt: done ? new Date().toISOString() : null });
    render();
  }
  async function editText(id, text) {
    const t = await Store.get("todos", id);
    if (!t || t.text === text.trim()) return;
    await Store.put("todos", { ...t, text: text.trim() });
  }
  async function del(id) {
    await Store.remove("todos", id);
    render();
  }

  $("#todoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#todoInput");
    add(inp.value);
    inp.value = "";
  });

  return { render };
})();

/* ============================================================
   CONTACTS (people directory, reusable across logs)
   ============================================================ */
const Contacts = (() => {
  async function all() {
    return (await Store.all("contacts")).sort((a, b) => (b.count || 0) - (a.count || 0));
  }
  // Find-or-create by name+title so the same person isn't duplicated.
  async function upsert({ name, title, dept }) {
    name = name.trim();
    if (!name) return null;
    title = (title || "").trim();
    dept = (dept || "").trim();
    const existing = (await Store.all("contacts")).find(
      (c) => c.name === name && (c.title || "") === title,
    );
    if (existing) {
      const updated = { ...existing, dept: dept || existing.dept, count: (existing.count || 0) + 1 };
      await Store.put("contacts", updated);
      return updated;
    }
    const rec = { id: Store.uid(), name, title, dept, count: 1, createdAt: new Date().toISOString() };
    await Store.put("contacts", rec);
    return rec;
  }
  async function get(id) { return Store.get("contacts", id); }

  async function renderSuggest() {
    const dl = $("#contactSuggest");
    const list = await all();
    dl.innerHTML = list.map((c) => `<option value="${esc(c.name)}" label="${esc(c.title || "")}"></option>`).join("");
  }

  async function renderDirectory(filter = "") {
    const el = $("#contactsList");
    const q = filter.trim().toLowerCase();
    let list = await all();
    if (q) list = list.filter((c) => (c.name + c.title + c.dept).toLowerCase().includes(q));
    if (!list.length) {
      el.innerHTML = `<p style="color:var(--ink-faint)">${q ? "没有匹配的联系人。" : "还没有联系人。在「每日 Log」里加人会自动进这里。"}</p>`;
      return;
    }
    el.innerHTML = list.map((c) => `<li class="contact-card">
      <div class="contact-card-name">${esc(c.name)}</div>
      ${c.title ? `<div class="contact-card-title">${esc(c.title)}</div>` : ""}
      ${c.dept ? `<div class="contact-card-dept">${esc(c.dept)}</div>` : ""}
      <div class="contact-card-count">互动 ${c.count || 1} 次</div>
    </li>`).join("");
  }

  return { all, get, upsert, renderSuggest, renderDirectory };
})();

/* ============================================================
   DAILY LOG
   ============================================================ */
const Log = (() => {
  const dateEl = $("#logDate");
  const bodyEl = $("#logBody");
  const chipsEl = $("#logContactChips");
  const historyEl = $("#logHistory");
  const savedHint = $("#logSavedHint");
  let current = null; // the log record for the selected date

  async function load(dateStr) {
    dateEl.value = dateStr;
    $("#logDateLabel").textContent = dateStr === Store.todayStr() ? "今日 Log" : dateStr;
    let rec = await Store.get("logs", dateStr);
    if (!rec) rec = { id: dateStr, body: "", contactIds: [], createdAt: new Date().toISOString() };
    current = rec;
    bodyEl.innerHTML = normalizeEditorHtml(rec.body || "");
    renderChips();
  }

  const saveBody = debounce(async () => {
    if (!current) return;
    current = { ...current, body: normalizeEditorHtml(bodyEl.innerHTML) };
    await Store.put("logs", current);
    flashSaved();
    renderHistory();
  }, 700);

  function flashSaved() {
    savedHint.textContent = "已保存 ✓";
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => (savedHint.textContent = ""), 1600);
  }

  async function renderChips() {
    const ids = current.contactIds || [];
    const people = (await Promise.all(ids.map((id) => Contacts.get(id)))).filter(Boolean);
    chipsEl.innerHTML = people.map((c) => `<li class="contact-chip" data-id="${c.id}">
      <span>${esc(c.name)}${c.title ? ` <span class="cc-title">· ${esc(c.title)}</span>` : ""}</span>
      <button class="cc-del" aria-label="移除">×</button>
    </li>`).join("");
    $$(".contact-chip", chipsEl).forEach((chip) => {
      chip.querySelector(".cc-del").addEventListener("click", () => removeContact(chip.dataset.id));
    });
  }

  async function addContact({ name, title, dept }) {
    const c = await Contacts.upsert({ name, title, dept });
    if (!c) return;
    current.contactIds = [...new Set([...(current.contactIds || []), c.id])];
    await Store.put("logs", current);
    renderChips();
    renderHistory();
    Contacts.renderSuggest();
  }
  async function removeContact(id) {
    current.contactIds = (current.contactIds || []).filter((x) => x !== id);
    await Store.put("logs", current);
    renderChips();
  }

  async function renderHistory() {
    const logs = (await Store.all("logs")).sort((a, b) => b.id.localeCompare(a.id));
    if (!logs.length) { historyEl.innerHTML = `<li style="color:var(--ink-faint);font-size:13px">还没有 Log。</li>`; return; }
    const rows = await Promise.all(logs.map(async (l) => {
      const people = (await Promise.all((l.contactIds || []).map((id) => Contacts.get(id)))).filter(Boolean);
      const names = people.map((p) => p.name).join("、");
      return `<li class="log-history-item" data-date="${l.id}">
        <div class="log-history-date">${l.id}</div>
        <p class="log-history-preview">${esc(stripTags(l.body)) || "（空）"}</p>
        ${names ? `<div class="log-history-people">👤 ${esc(names)}</div>` : ""}
      </li>`;
    }));
    historyEl.innerHTML = rows.join("");
    $$(".log-history-item", historyEl).forEach((li) => {
      li.addEventListener("click", () => load(li.dataset.date));
    });
  }

  // events
  bodyEl.addEventListener("input", saveBody);
  installPlainPaste(bodyEl, saveBody);
  dateEl.addEventListener("change", () => load(dateEl.value));
  $("#logContactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addContact({ name: $("#contactName").value, title: $("#contactTitle").value, dept: $("#contactDept").value });
    $("#contactName").value = $("#contactTitle").value = $("#contactDept").value = "";
    $("#contactName").focus();
  });

  async function enter() {
    if (!current) await load(Store.todayStr());
    renderHistory();
    Contacts.renderSuggest();
  }

  return { enter, renderHistory };
})();

/* ============================================================
   NOTEBOOK
   ============================================================ */
const Notebook = (() => {
  const listEl = $("#noteList");
  const editor = $("#noteEditor");
  const emptyEl = $("#noteEditorEmpty");
  const titleEl = $("#noteTitle");
  const bodyEl = $("#noteBody");
  const lineHeightEl = $("#noteLineHeight");
  const metaEl = $("#noteMeta");
  let current = null;
  let searchQ = "";

  async function renderList() {
    let notes = (await Store.all("notes")).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    const q = searchQ.trim().toLowerCase();
    if (q) notes = notes.filter((n) => (n.title + " " + stripTags(n.body)).toLowerCase().includes(q));
    if (!notes.length) {
      listEl.innerHTML = `<li style="padding:16px;color:var(--ink-faint);font-size:13px">${q ? "没有匹配的笔记。" : "还没有笔记。点上方「＋ 新笔记」。"}</li>`;
      return;
    }
    listEl.innerHTML = notes.map((n) => `<li class="note-card ${current && n.id === current.id ? "is-active" : ""}" data-id="${n.id}">
      <p class="note-card-title">${esc(n.title) || "无标题"}</p>
      <p class="note-card-preview">${esc(stripTags(n.body))}</p>
      <span class="note-card-date">${fmtDate(n.updatedAt)}</span>
    </li>`).join("");
    $$(".note-card", listEl).forEach((c) => c.addEventListener("click", () => open(c.dataset.id)));
  }

  async function open(id) {
    const n = await Store.get("notes", id);
    if (!n) return;
    current = n;
    emptyEl.hidden = true;
    editor.hidden = false;
    titleEl.value = n.title || "";
    bodyEl.innerHTML = normalizeEditorHtml(n.body || "");
    lineHeightEl.value = n.lineHeight || "1.8";
    bodyEl.style.setProperty("--editor-line-height", lineHeightEl.value);
    metaEl.textContent = `更新于 ${new Date(n.updatedAt).toLocaleString("zh-CN")}`;
    renderList();
  }

  async function create() {
    const n = { id: Store.uid(), title: "", body: "", lineHeight: "1.8", createdAt: new Date().toISOString() };
    await Store.put("notes", n);
    await renderList();
    open(n.id);
    titleEl.focus();
  }

  const save = debounce(async () => {
    if (!current) return;
    current = {
      ...current,
      title: titleEl.value,
      body: normalizeEditorHtml(bodyEl.innerHTML),
      lineHeight: lineHeightEl.value,
    };
    const saved = await Store.put("notes", current);
    current._syncedAt = saved._syncedAt;
    metaEl.textContent = `已保存 ✓ ${new Date().toLocaleTimeString("zh-CN")}`;
    renderList();
  }, 600);

  async function del() {
    if (!current) return;
    if (!confirm("删除这条笔记？此操作不可撤销。")) return;
    await Store.remove("notes", current.id);
    current = null;
    editor.hidden = true;
    emptyEl.hidden = false;
    renderList();
  }

  /* ---- toolbar / formatting ---- */
  function exec(cmd, value) {
    bodyEl.focus();
    if (cmd === "format") document.execCommand("formatBlock", false, value || "p");
    else if (cmd === "bold") document.execCommand("bold");
    else if (cmd === "ul") document.execCommand("insertUnorderedList");
    else if (cmd === "highlight") document.execCommand("hiliteColor", false, "#fbe7b8");
    else if (cmd === "term") wrapTerm();
    else if (cmd === "clear") clearFormatting();
    save();
  }

  function clearFormatting() {
    document.execCommand("removeFormat");
    bodyEl.innerHTML = normalizeEditorHtml(bodyEl.innerHTML);
  }

  // Bilingual term: wrap the selected Chinese text, ask for the English,
  // render as  中文（English）  with the term styling.
  function wrapTerm() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) { alert("先选中要标注的中文，再点「中EN」。"); return; }
    const zh = sel.toString();
    const en = prompt(`为「${zh}」加英文对照：`, "");
    if (en === null) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const span = document.createElement("span");
    span.className = "term";
    span.textContent = zh;
    if (en.trim()) {
      const enSpan = document.createElement("span");
      enSpan.className = "term-en";
      enSpan.textContent = `（${en.trim()}）`;
      span.appendChild(enSpan);
    }
    range.insertNode(span);
    sel.removeAllRanges();
    save();
  }

  /* ---- events ---- */
  titleEl.addEventListener("input", save);
  bodyEl.addEventListener("input", save);
  installPlainPaste(bodyEl, save);
  lineHeightEl.addEventListener("change", () => {
    bodyEl.style.setProperty("--editor-line-height", lineHeightEl.value);
    save();
  });
  $$(".note-toolbar button[data-cmd]").forEach((b) => b.addEventListener("click", () => exec(b.dataset.cmd, b.dataset.value)));
  $("#deleteNoteBtn").addEventListener("click", del);
  $("#newNoteBtn").addEventListener("click", create);
  $("#newNoteInline").addEventListener("click", create);
  $("#importMdBtn").addEventListener("click", () => {
    NotesImport.openImportModal(async (id) => { await renderList(); open(id); });
  });

  function setSearch(q) { searchQ = q; renderList(); }

  return { renderList, setSearch, create, open };
})();

/* ============================================================
   Tabs + global search + boot
   ============================================================ */
function setupTabs() {
  const map = {
    tabNotebook: "viewNotebook",
    tabLog: "viewLog",
    tabContacts: "viewContacts",
  };
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active"); tab.setAttribute("aria-selected", "true");
      Object.entries(map).forEach(([tabId, viewId]) => { $("#" + viewId).hidden = tabId !== tab.id; });
      if (tab.id === "tabLog") Log.enter();
      if (tab.id === "tabContacts") Contacts.renderDirectory($("#contactSearch").value);
    });
  });
}

function setupSearch() {
  $("#globalSearch").addEventListener("input", (e) => Notebook.setSearch(e.target.value));
  $("#contactSearch").addEventListener("input", (e) => Contacts.renderDirectory(e.target.value));
}

function setupBackup() {
  const exportBtn = $("#exportBtn");
  const importBtn = $("#importBtn");
  const importFile = $("#importFile");

  exportBtn.addEventListener("click", async () => {
    const dump = await Store.exportAll();
    const counts = Store.STORES.map((s) => `${s} ${(dump.data[s] || []).length}`).join(" · ");
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `intern-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    exportBtn.textContent = "已导出 ✓";
    exportBtn.title = `已备份：${counts}`;
    setTimeout(() => (exportBtn.textContent = "导出备份"), 1800);
  });

  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async () => {
    const file = importFile.files[0];
    if (!file) return;
    try {
      const dump = JSON.parse(await file.text());
      if (!dump || !dump.data) throw new Error("bad");
      const total = Object.values(dump.data).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
      const ok = confirm(
        `将从备份合并导入约 ${total} 条记录：\n相同条目会用备份覆盖，其余现有数据保留（不会删除）。\n\n继续？`,
      );
      if (!ok) { importFile.value = ""; return; }
      await Store.importAll(dump, { replace: false });
      importFile.value = "";
      await Todo.render();
      await Notebook.renderList();
      alert("导入完成 ✓");
    } catch (e) {
      alert("导入失败：这个文件不是有效的备份 JSON。");
      importFile.value = "";
    }
  });
}

function setupSyncBadge() {
  const badge = $("#syncBadge");
  const LABEL = { syncing: "同步中…", synced: "已同步 Notion ✓", error: "同步失败（本地已存）", local: "本地已存" };
  Sync.onStatus((state) => {
    badge.className = "sync-badge" + (state === "syncing" ? " syncing" : state === "error" ? " error" : "");
    badge.textContent = LABEL[state] || "本地已存";
  });
}

// Console helper to rotate the gate password without editing files by hand.
window.Intern = {
  async setPassword(pw) {
    const hash = await sha256Hex(pw);
    console.log("把 app.js 里的 PASSWORD_HASH 换成：\n" + hash);
    return hash;
  },
  lock() { localStorage.removeItem(GATE_FLAG); sessionStorage.removeItem(GATE_FLAG); location.reload(); },
};

async function boot() {
  await initGate();
  setupTabs();
  setupSearch();
  setupBackup();
  setupSyncBadge();
  await Todo.render();
  await NotesImport.seedNotes(); // load bundled starter notes on first run
  await Notebook.renderList();

  // If we already hold the auth cookie (returning visitor), kick off sync now
  // that the local data is rendered. First-time auth starts it from the gate.
  startSync();

  // Harden local durability (best-effort; Notion sync is the real fix).
  Store.requestPersistence().then((r) => {
    const badge = $("#syncBadge");
    if (!badge) return;
    badge.title = r.persisted
      ? "已启用持久化存储：浏览器不会自动回收本地数据（手动清除数据仍会清空）"
      : "未获持久化授权：本地数据在清除浏览器数据或长期不访问时可能丢失，建议尽快接 Notion 或定期导出备份";
  });
}

document.addEventListener("DOMContentLoaded", boot);
