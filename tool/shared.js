// Shared across index.html and company.html: watchlist storage, formatting
// helpers, the event-card component, and the source detail panel.

const API_BASE = "/api/tool";
const WATCHLIST_KEY = "tool.watchlist.v1";

/* ---------- lightweight runtime diagnostics (for bug reports) ---------- */
/* Session-only, capped, never persisted or sent anywhere unless the user
   explicitly attaches it to a feedback submission. */

window.__toolDiagnostics = [];

function pushDiagnostic(text) {
  window.__toolDiagnostics.push(`[${new Date().toLocaleTimeString("zh-CN")}] ${text}`);
  if (window.__toolDiagnostics.length > 5) window.__toolDiagnostics.shift();
}

window.addEventListener("error", (e) => {
  pushDiagnostic(`JS 错误：${e.message}（${e.filename ? e.filename.split("/").pop() : "未知文件"}:${e.lineno}）`);
});

window.addEventListener("unhandledrejection", (e) => {
  pushDiagnostic(`未处理的 Promise 异常：${e.reason}`);
});

function collectDiagnosticsText() {
  const lines = [
    `页面：${location.href}`,
    `时间：${new Date().toLocaleString("zh-CN")}`,
    `浏览器：${navigator.userAgent}`,
    `视口：${window.innerWidth}x${window.innerHeight}`,
  ];
  try {
    const watchlist = getWatchlist();
    if (watchlist.length) {
      lines.push(`已关注公司：${watchlist.map((c) => `${c.name}(${c.market}:${c.id})`).join("、")}`);
    }
  } catch (error) {
    // localStorage may be unavailable (e.g. private browsing); skip silently.
  }
  if (window.__toolDiagnostics.length) {
    lines.push("最近的页面错误：");
    lines.push(...window.__toolDiagnostics);
  } else {
    lines.push("本次会话未捕获到页面错误。");
  }
  return lines.join("\n");
}

/* ---------- localStorage watchlist (V1 has no server persistence) ---------- */

function getWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}

function isWatched(market, id) {
  return getWatchlist().some((c) => c.market === market && c.id === id);
}

function addToWatchlist(company) {
  const list = getWatchlist();
  if (list.some((c) => c.market === company.market && c.id === company.id)) return list;
  list.unshift({ market: company.market, id: company.id, name: company.name });
  saveWatchlist(list);
  return list;
}

function removeFromWatchlist(market, id) {
  const list = getWatchlist().filter((c) => !(c.market === market && c.id === id));
  saveWatchlist(list);
  return list;
}

/* ---------- formatting ---------- */

const MARKET_LABEL = { us: "美股", cn: "A股", hk: "港股" };
const EVENT_TYPE_LABEL = { news: "新闻", filing: "公告", regulatory: "监管动态", industry: "行业" };
const IMPORTANCE_LABEL = { high: "高", medium: "中", low: "低" };
const CREDIBILITY_LABEL = {
  official: "官方来源",
  "authoritative-media": "权威媒体",
  "general-media": "一般来源",
};

function marketLabel(market) {
  return MARKET_LABEL[market] || market;
}

function formatRelativeTime(iso) {
  if (!iso) return "时间未知";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "时间未知";
  const diffMs = Date.now() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) return "1小时内";
  if (diffHours < 24) return `${Math.floor(diffHours)}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- fetch helper ---------- */

async function fetchJSON(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || data.error || `请求失败 (${response.status})`);
    err.status = response.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/* ---------- event card component ---------- */

// events carry exactly one source each in this data model, so the card's
// citation chip opens that source directly.
function renderEventCard(event, { showCompany = false } = {}) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventType = event.eventType;
  card.dataset.importance = event.importance;

  const source = event.sources && event.sources[0];
  const companyTag = showCompany
    ? `<button class="event-company-link" data-market="${escapeHtml(event.market)}" data-id="${escapeHtml(event.ticker)}">${escapeHtml(event.company)}</button>`
    : "";

  card.innerHTML = `
    <div class="event-row-top">
      <span class="event-type-badge event-type-${escapeHtml(event.eventType)}">${escapeHtml(EVENT_TYPE_LABEL[event.eventType] || event.eventType)}</span>
      ${companyTag}
      <time class="event-time">${escapeHtml(formatRelativeTime(event.timestamp))}</time>
    </div>
    <p class="event-title">${escapeHtml(event.title)}</p>
    <div class="event-row-bottom">
      <span class="importance-badge importance-${escapeHtml(event.importance)}">重要度：${escapeHtml(IMPORTANCE_LABEL[event.importance] || event.importance)}</span>
      ${source ? `<button class="source-chip" data-source-id="${escapeHtml(source.id)}">${escapeHtml(source.publisher)}</button>` : ""}
    </div>
  `;

  if (source) {
    card.querySelector(".source-chip").addEventListener("click", () => openSourcePanel(source));
  }
  if (showCompany) {
    card.querySelector(".event-company-link").addEventListener("click", (e) => {
      const { market, id } = e.currentTarget.dataset;
      navigateToCompany(market, id);
    });
  }
  return card;
}

function renderScreeningBullet(bullet, sourcesById) {
  const row = document.createElement("li");
  row.className = `screening-item importance-${bullet.importance}`;
  const chips = (bullet.sourceIds || [])
    .map((id) => sourcesById.get(id))
    .filter(Boolean)
    .map((source) => `<button class="source-chip" data-source-id="${escapeHtml(source.id)}">${escapeHtml(source.publisher)}</button>`)
    .join("");
  row.innerHTML = `<p>${escapeHtml(bullet.text)}</p><div class="screening-sources">${chips}</div>`;
  row.querySelectorAll(".source-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const source = sourcesById.get(chip.dataset.sourceId);
      if (source) openSourcePanel(source);
    });
  });
  return row;
}

/* ---------- source detail panel ---------- */

function ensureSourcePanel() {
  let panel = document.getElementById("sourcePanel");
  let overlay = document.getElementById("sourceOverlay");
  if (panel) return { panel, overlay };

  overlay = document.createElement("div");
  overlay.id = "sourceOverlay";
  overlay.className = "source-overlay";
  overlay.hidden = true;

  panel = document.createElement("aside");
  panel.id = "sourcePanel";
  panel.className = "source-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="source-panel-head">
      <span>来源详情</span>
      <button id="sourcePanelClose" aria-label="关闭">×</button>
    </div>
    <div class="source-panel-body" id="sourcePanelBody"></div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  overlay.addEventListener("click", closeSourcePanel);
  panel.querySelector("#sourcePanelClose").addEventListener("click", closeSourcePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSourcePanel();
  });
  return { panel, overlay };
}

function openSourcePanel(source) {
  const { panel, overlay } = ensureSourcePanel();
  const credibility = CREDIBILITY_LABEL[source.credibility] || "一般来源";
  document.getElementById("sourcePanelBody").innerHTML = `
    <span class="credibility-badge credibility-${escapeHtml(source.credibility || "general-media")}">${escapeHtml(credibility)}</span>
    <h3>${escapeHtml(source.title)}</h3>
    <dl class="source-meta">
      <dt>发布方</dt><dd>${escapeHtml(source.publisher)}</dd>
      <dt>发布时间</dt><dd>${escapeHtml(source.publishedAt ? new Date(source.publishedAt).toLocaleString("zh-CN") : "时间未知")}</dd>
      <dt>来源类型</dt><dd>${escapeHtml(source.sourceType === "regulatory" ? "监管公告 / 官方披露" : "新闻媒体")}</dd>
    </dl>
    ${source.url ? `<a class="source-open-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">查看原文 ↗</a>` : `<p class="source-unavailable">无法独立核实此信息的原文链接。</p>`}
  `;
  panel.hidden = false;
  overlay.hidden = false;
  requestAnimationFrame(() => panel.classList.add("open"));
}

function closeSourcePanel() {
  const panel = document.getElementById("sourcePanel");
  const overlay = document.getElementById("sourceOverlay");
  if (!panel) return;
  panel.classList.remove("open");
  overlay.hidden = true;
  setTimeout(() => {
    panel.hidden = true;
  }, 150);
}

/* ---------- navigation ---------- */

function navigateToCompany(market, id) {
  window.location.href = `/tool/company?m=${encodeURIComponent(market)}&id=${encodeURIComponent(id)}`;
}

/* ---------- global search box (shared header) ---------- */

function setupGlobalSearch(inputEl, dropdownEl) {
  let debounceTimer = null;
  let latestCandidates = [];

  function renderDropdown(candidates) {
    latestCandidates = candidates;
    if (!candidates.length) {
      dropdownEl.hidden = true;
      dropdownEl.innerHTML = "";
      return;
    }
    dropdownEl.innerHTML = candidates
      .map(
        (c, i) => `
      <button class="search-result-item" data-index="${i}">
        <span class="search-result-market">${escapeHtml(marketLabel(c.market))}</span>
        <span class="search-result-name">${escapeHtml(c.name)}</span>
        <span class="search-result-code">${escapeHtml(c.ticker)}</span>
      </button>`,
      )
      .join("");
    dropdownEl.hidden = false;
    dropdownEl.querySelectorAll(".search-result-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = latestCandidates[Number(btn.dataset.index)];
        navigateToCompany(c.market, c.id);
      });
    });
  }

  async function runSearch(query) {
    if (!query.trim()) {
      renderDropdown([]);
      return;
    }
    try {
      const data = await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      renderDropdown(data.candidates || []);
    } catch (error) {
      renderDropdown([]);
    }
  }

  inputEl.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(inputEl.value), 250);
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (latestCandidates.length >= 1) {
        navigateToCompany(latestCandidates[0].market, latestCandidates[0].id);
      }
    } else if (e.key === "Escape") {
      dropdownEl.hidden = true;
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdownEl.contains(e.target) && e.target !== inputEl) {
      dropdownEl.hidden = true;
    }
  });
}
