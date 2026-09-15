// Shared across index.html and company.html: watchlist storage, formatting
// helpers, the event-card component, and the source detail panel.

const API_BASE = "/api/tool";
const WATCHLIST_KEY = "tool.watchlist.v1";

/* ---------- password gate ---------- */
/* Real enforcement lives server-side (middleware.js checks the HttpOnly
   tool_auth cookie on every /api/tool/* call). This overlay is the UX layer:
   the page shell loads normally, but everything is blurred and inert until
   the visitor enters the password — no username field, matching the ask
   for a single-secret gate rather than a browser-native Basic Auth prompt. */

function hasPassedGate() {
  return document.cookie.split("; ").some((c) => c === "tool_gate=1" || c.startsWith("tool_gate=1;"));
}

function unlockGate() {
  document.body.classList.remove("gate-locked");
  const overlay = document.getElementById("gateOverlay");
  if (overlay) overlay.remove();
}

function showGateOverlay(onUnlocked) {
  const overlay = document.createElement("div");
  overlay.id = "gateOverlay";
  overlay.className = "gate-overlay";
  overlay.innerHTML = `
    <div class="gate-card">
      <p class="gate-title">投资情报助手</p>
      <p class="gate-sub">请输入访问口令</p>
      <form id="gateForm" autocomplete="off">
        <input id="gatePassword" type="password" placeholder="口令" autocomplete="current-password" />
        <button type="submit">进入</button>
      </form>
      <p id="gateError" class="gate-error" hidden>口令不正确，请重试。</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#gatePassword");
  const errorEl = overlay.querySelector("#gateError");
  input.focus();

  overlay.querySelector("#gateForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    try {
      const response = await fetch(`${API_BASE}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.value }),
      });
      if (!response.ok) throw new Error("unauthorized");
      unlockGate();
      onUnlocked();
    } catch (error) {
      errorEl.hidden = false;
      input.value = "";
      input.focus();
    }
  });
}

// Call this instead of running page init code directly — it either unlocks
// immediately (cookie already present) or shows the gate first and only
// calls onUnlocked() once the password is accepted.
function initPasswordGate(onUnlocked) {
  if (hasPassedGate()) {
    unlockGate();
    onUnlocked();
    return;
  }
  showGateOverlay(onUnlocked);
}

/* ---------- lightweight runtime diagnostics (for bug reports) ---------- */
/* Session-only, capped, never persisted or sent anywhere unless the user
   explicitly attaches it to a feedback submission. */

window.__toolDiagnostics = [];

function pushDiagnostic(text) {
  window.__toolDiagnostics.push(`[${new Date().toLocaleTimeString("zh-CN")}] ${text}`);
  if (window.__toolDiagnostics.length > 5) window.__toolDiagnostics.shift();
}

window.addEventListener("error", (e) => {
  const msg = `JS 错误：${e.message}（${e.filename ? e.filename.split("/").pop() : "未知文件"}:${e.lineno}）`;
  pushDiagnostic(msg);
  showCrashBanner(msg);
});

window.addEventListener("unhandledrejection", (e) => {
  const msg = `未处理的 Promise 异常：${e.reason}`;
  pushDiagnostic(msg);
  showCrashBanner(msg);
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

/* ---------- one-click bug report ---------- */
/* Skips the feedback form entirely: builds the report from context + the
   diagnostics buffer above and hands it straight to the user's mail client,
   while best-effort syncing the same content to Notion in the background. */

const FEEDBACK_EMAIL_ADDRESS = "fyc2003@uw.edu";

function quickReportMailto(context) {
  const subject = `[投资情报助手反馈][Bug-一键上报] ${context || "页面错误"}`.slice(0, 150);
  const body = [
    "此报告由「一键上报」自动生成，未经手动编辑。",
    "",
    `问题：${context || "页面出现异常"}`,
    "",
    "---- 诊断信息 ----",
    collectDiagnosticsText(),
  ].join("\n");
  return `mailto:${FEEDBACK_EMAIL_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function submitQuickReport(context) {
  fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "Bug反馈",
      title: `一键上报：${context || "页面错误"}`.slice(0, 150),
      content: context || "用户通过一键上报按钮提交，未手动填写描述。",
      diagnostics: collectDiagnosticsText(),
      pageUrl: location.href,
    }),
  }).catch(() => {
    // Best-effort only — the mailto below is the guaranteed delivery path.
  });
  window.location.href = quickReportMailto(context);
}

function renderQuickReportLink(context) {
  const link = document.createElement("button");
  link.type = "button";
  link.className = "quick-report-link";
  link.textContent = "一键上报此问题 →";
  link.addEventListener("click", () => submitQuickReport(context));
  return link;
}

let crashBannerShown = false;

function showCrashBanner(context) {
  if (crashBannerShown) return;
  crashBannerShown = true;

  const banner = document.createElement("div");
  banner.className = "crash-banner";
  const message = document.createElement("span");
  message.textContent = "页面出现异常，可能影响当前功能。";
  banner.appendChild(message);

  const reportLink = renderQuickReportLink(context);
  reportLink.classList.add("crash-banner-report");
  banner.appendChild(reportLink);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "crash-banner-close";
  closeBtn.setAttribute("aria-label", "关闭");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    banner.remove();
    crashBannerShown = false;
  });
  banner.appendChild(closeBtn);

  document.body.appendChild(banner);
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

function marketBadgeHtml(market) {
  return `<span class="market-badge market-badge-${escapeHtml(market)}">${escapeHtml(marketLabel(market))}</span>`;
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

/* ---------- info tooltip ---------- */
/* Works on both hover (desktop) and tap (mobile, via :focus from a real
   tabbable element) — plain `title=""` tooltips are slow and invisible on
   touch devices, which doesn't work for "I don't understand this label". */

function infoTipHtml(text) {
  return `<span class="info-tip" tabindex="0" role="button" aria-label="说明">?<span class="info-tip-bubble">${escapeHtml(text)}</span></span>`;
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

/* ---------- event row component ---------- */

// events carry exactly one source each in this data model, so clicking
// anywhere on the row opens that source directly — no separate chip needed
// as the primary click target.
// The AI gloss is deliberately styled and labeled apart from the
// rule-based "重要度" badge above it — different color family (violet,
// matching the A股 market color rather than any importance color), a
// distinct label, and a tooltip disclaimer, so nobody mistakes one for the
// other. See aiInsightDisclaimerText() for the exact wording.
function aiInsightBlockHtml(insightText) {
  if (!insightText) return "";
  return `
    <div class="ai-insight">
      <span class="ai-insight-label">AI研判（仅供参考）${infoTipHtml(aiInsightDisclaimerText())}</span>
      <p class="ai-insight-text">${escapeHtml(insightText)}</p>
    </div>
  `;
}

function aiInsightDisclaimerText() {
  return "由 Claude 根据标题自动生成的简短研判，不是阅读了原文全文得出的结论，可能存在误判，不构成投资建议——请以原始来源为准。";
}

function aiDigestDisclaimerText() {
  return "由 Claude 根据下方事件的标题自动归纳的一句话概览，只反映近期动态的主题分布，不是对公司基本面的评价、也不是投资建议——具体以原始来源为准。";
}

// Tiny inline SVG price sparkline (~20 daily closes). Pure decoration next to
// the live quote — colored by net direction over the window (red up / green
// down, matching the CN-market convention used elsewhere in this tool).
function sparklineSvgHtml(series) {
  if (!Array.isArray(series) || series.length < 3) return "";
  const w = 72;
  const h = 22;
  const pad = 2;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (series.length - 1);
  const points = series
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (v - min) / range);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = series[series.length - 1] >= series[0];
  const cls = up ? "spark-up" : "spark-down";
  return `<svg class="quote-spark ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

// Called once the async /api/tool/insights response arrives, well after the
// event rows already rendered with real data — fills in just this one slot
// rather than re-rendering the whole list, so scroll position etc. survive.
function applyAiInsight(eventId, insightText) {
  const slot = document.querySelector(`.ai-insight-slot[data-event-id="${CSS.escape(eventId)}"]`);
  if (slot) slot.innerHTML = aiInsightBlockHtml(insightText);
}

function renderEventCard(event, { showCompany = false, insight = null } = {}) {
  const row = document.createElement("article");
  row.className = "event-row";
  row.dataset.eventType = event.eventType;
  row.dataset.importance = event.importance;

  const source = event.sources && event.sources[0];
  const companyTag = showCompany
    ? `<button class="event-company-link" data-market="${escapeHtml(event.market)}" data-id="${escapeHtml(event.ticker)}">${escapeHtml(event.company)}</button>`
    : "";

  row.innerHTML = `
    <div class="event-row-head">
      <span class="event-type-badge event-type-${escapeHtml(event.eventType)}">${escapeHtml(EVENT_TYPE_LABEL[event.eventType] || event.eventType)}</span>
      <span class="importance-badge importance-${escapeHtml(event.importance)}">重要度：${escapeHtml(IMPORTANCE_LABEL[event.importance] || event.importance)}</span>
      ${companyTag}
      <time class="event-time">${escapeHtml(formatRelativeTime(event.timestamp))}</time>
    </div>
    <p class="event-title">${escapeHtml(event.title)}</p>
    <div class="ai-insight-slot" data-event-id="${escapeHtml(event.id)}">${insight ? aiInsightBlockHtml(insight) : ""}</div>
    ${source ? `<div class="event-row-foot"><span class="event-source-name">来源：${escapeHtml(source.publisher)}</span><span class="event-more-hint">查看详情与原文 →</span></div>` : ""}
  `;

  if (source) {
    row.classList.add("event-row-clickable");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `查看来源详情：${event.title}`);
    const openThisSource = () => openSourcePanel(source, event);
    row.addEventListener("click", openThisSource);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openThisSource();
      }
    });
  }
  if (showCompany) {
    row.querySelector(".event-company-link").addEventListener("click", (e) => {
      e.stopPropagation();
      const { market, id } = e.currentTarget.dataset;
      navigateToCompany(market, id);
    });
  }
  return row;
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

// A US SEC filing is the one source type whose real body text is fetchable
// (EDGAR serves it directly), so it's the only one that gets the on-demand
// "AI 解读原文" — the AI actually reads the linked document, not just its
// title. News/cninfo bodies are JS shells / PDFs, so they don't qualify.
function isSecFilingSource(source) {
  // Must be an actual filing *document* (…/Archives/edgar/data/…), not a
  // browse-edgar list page like the clustered Form-4 row's link — those are
  // indexes, not readable filing text.
  return (
    source &&
    source.sourceType === "regulatory" &&
    typeof source.url === "string" &&
    /\/\/(www\.)?sec\.gov\/Archives\/edgar\/data\//.test(source.url)
  );
}

function openSourcePanel(source, event) {
  const { panel, overlay } = ensureSourcePanel();
  const credibility = CREDIBILITY_LABEL[source.credibility] || "一般来源";

  // event.summary carries real added context for filings (e.g. "PDD 提交了
  // 6-K，建议复核最新财务与风险披露变化"). For news it's currently identical
  // to the title (V1 does not fabricate summaries), so skip showing it twice.
  const hasExtraSummary = event && event.summary && event.summary.trim() !== source.title.trim();
  const canInterpret = isSecFilingSource(source);

  document.getElementById("sourcePanelBody").innerHTML = `
    <span class="credibility-badge credibility-${escapeHtml(source.credibility || "general-media")}">${escapeHtml(credibility)}</span>
    <h3>${escapeHtml(source.title)}</h3>
    ${hasExtraSummary ? `<p class="source-summary">${escapeHtml(event.summary)}</p>` : ""}
    ${canInterpret ? `<div class="filing-ai" id="filingAiSlot"></div>` : ""}
    <dl class="source-meta">
      <dt>发布方</dt><dd>${escapeHtml(source.publisher)}</dd>
      <dt>发布时间</dt><dd>${escapeHtml(source.publishedAt ? new Date(source.publishedAt).toLocaleString("zh-CN") : "时间未知")}</dd>
      <dt>来源类型</dt><dd>${escapeHtml(source.sourceType === "regulatory" ? "监管公告 / 官方披露" : "新闻媒体")}</dd>
    </dl>
    ${
      source.url
        ? `<a class="source-open-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">查看完整原文 ↗</a>${!hasExtraSummary && !canInterpret ? `<p class="source-note">此处仅展示标题与来源元信息，本工具不生成新闻摘要 —— 完整内容请点击查看原文。</p>` : ""}`
        : `<p class="source-unavailable">无法独立核实此信息的原文链接。</p>`
    }
  `;
  panel.hidden = false;
  overlay.hidden = false;
  requestAnimationFrame(() => panel.classList.add("open"));

  if (canInterpret) loadFilingInterpretation(source, event);
}

// Lazy: only fires when a SEC-filing source panel actually opens, so we pay
// the fetch+LLM cost per filing the user chooses to inspect, not per page.
async function loadFilingInterpretation(source, event) {
  const slot = document.getElementById("filingAiSlot");
  if (!slot) return;
  slot.innerHTML = `
    <div class="filing-ai-inner is-loading">
      <span class="filing-ai-label">AI 解读原文（仅供参考）${infoTipHtml(filingSummaryDisclaimerText())}</span>
      <p class="filing-ai-text">正在读取 SEC 原文并解读，请稍候…</p>
    </div>`;

  try {
    const response = await fetch(`${API_BASE}/filing-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: source.url,
        formType: event ? event.formType : "",
        itemLabel: event ? event.itemLabel : "",
        company: event ? event.company : source.publisher,
        title: source.title,
      }),
    });
    const data = response.ok ? await response.json() : null;
    // Panel may have been closed / switched to another source meanwhile.
    if (document.getElementById("filingAiSlot") !== slot) return;

    if (data && data.ok && data.summary) {
      slot.innerHTML = `
        <div class="filing-ai-inner">
          <span class="filing-ai-label">AI 解读原文（仅供参考）${infoTipHtml(filingSummaryDisclaimerText())}</span>
          <p class="filing-ai-text">${escapeHtml(data.summary)}</p>
          ${data.truncated ? `<p class="filing-ai-note">原文较长，AI 仅读取了前一部分，完整内容请查看原文。</p>` : ""}
        </div>`;
    } else {
      // Unconfigured or failed — collapse silently rather than show an error,
      // consistent with the rest of the AI layer being best-effort.
      slot.innerHTML = "";
    }
  } catch (error) {
    if (document.getElementById("filingAiSlot") === slot) slot.innerHTML = "";
  }
}

function filingSummaryDisclaimerText() {
  return "由 Claude 读取该 SEC 文件的真实正文后生成的中文摘要，只依据原文、不编造原文之外的数字或事实；长文档可能仅读取前一部分。仅供快速判断，不构成投资建议——以原文为准。";
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

const searchResultCache = new Map();

function setupGlobalSearch(inputEl, dropdownEl) {
  let debounceTimer = null;
  let latestCandidates = [];
  let latestQuery = "";

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
        ${marketBadgeHtml(c.market)}
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

  function renderLoading() {
    dropdownEl.hidden = false;
    dropdownEl.innerHTML = `<div class="search-result-loading">搜索中…</div>`;
  }

  async function runSearch(query) {
    const trimmed = query.trim();
    latestQuery = trimmed;
    if (!trimmed) {
      renderDropdown([]);
      return;
    }

    const cached = searchResultCache.get(trimmed);
    if (cached) {
      renderDropdown(cached);
      return;
    }

    renderLoading();
    try {
      const data = await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(trimmed)}`);
      const candidates = data.candidates || [];
      searchResultCache.set(trimmed, candidates);
      // Guard against a slower earlier request resolving after a newer one.
      if (latestQuery === trimmed) renderDropdown(candidates);
    } catch (error) {
      if (latestQuery === trimmed) renderDropdown([]);
    }
  }

  inputEl.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(inputEl.value), 150);
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
