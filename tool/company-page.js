(function () {
  const searchInput = document.getElementById("searchInput");
  const searchDropdown = document.getElementById("searchDropdown");
  const loadingStateEl = document.getElementById("loadingState");
  const errorStateEl = document.getElementById("errorState");
  const errorMessageEl = document.getElementById("errorMessage");
  const companyContentEl = document.getElementById("companyContent");
  const companyHeaderEl = document.getElementById("companyHeader");
  const coverageNoticeEl = document.getElementById("coverageNotice");
  const screeningBlockEl = document.getElementById("screeningBlock");
  const screeningListEl = document.getElementById("screeningList");
  const screeningEmptyEl = document.getElementById("screeningEmpty");
  const filterChipsEl = document.getElementById("filterChips");
  const sortToggleEl = document.getElementById("sortToggle");
  const eventListEl = document.getElementById("eventList");
  const feedEmptyEl = document.getElementById("feedEmpty");

  setupGlobalSearch(searchInput, searchDropdown);

  const params = new URLSearchParams(window.location.search);
  const market = params.get("m");
  const id = params.get("id");

  let currentEvents = [];
  let activeFilter = "all";
  let activeSort = "time";
  let aiInsights = {};
  const IMPORTANCE_RANK = { high: 3, medium: 2, low: 1 };

  function showError(message) {
    loadingStateEl.hidden = true;
    errorStateEl.hidden = false;
    errorMessageEl.textContent = message;
    errorStateEl.querySelector(".quick-report-link")?.remove();
    errorStateEl.appendChild(renderQuickReportLink(`公司页加载失败（${market}/${id}）：${message}`));
  }

  function renderCompanyHeader(company) {
    const watched = isWatched(company.market, company.id);

    const quoteTip =
      company.market === "us"
        ? "美股行情来自一个非官方公开接口，偶尔会临时失效，不代表该公司数据整体不可用——新闻、公告等信息不受影响。"
        : "行情来自新浪财经公开接口，偶尔会临时失效，不代表该公司数据整体不可用——新闻、公告等信息不受影响。";
    const externalQuoteLink = company.externalQuoteUrl
      ? ` · <a class="external-ref-link" href="${escapeHtml(company.externalQuoteUrl)}" target="_blank" rel="noopener noreferrer">去${company.market === "us" ? "Nasdaq" : "东方财富"}查看实时行情 ↗</a>`
      : "";
    let quoteHtml = `<span class="empty-state-sub">行情数据当前不可用${infoTipHtml(quoteTip)}${externalQuoteLink}</span>`;
    if (company.quote && company.quote.available) {
      const changeClass = company.quote.changePercent >= 0 ? "change-up" : "change-down";
      const changeSign = company.quote.changePercent >= 0 ? "+" : "";
      quoteHtml = `
        <span class="price">${company.quote.close}</span>
        <span class="${changeClass}">${changeSign}${company.quote.changePercent}%</span>
        <span class="empty-state-sub"> · ${escapeHtml(company.quote.source)}</span>
      `;
    }

    let financialsHtml = "";
    if (company.financials?.revenue || company.financials?.netIncome) {
      financialsHtml = `<div class="company-financials">`;
      if (company.financials.revenue) {
        financialsHtml += `<span>营收（${escapeHtml(company.financials.revenue.end)}）：<strong>${escapeHtml(company.financials.revenue.formatted)}</strong></span>`;
      }
      if (company.financials.netIncome) {
        financialsHtml += `<span>净利润（${escapeHtml(company.financials.netIncome.end)}）：<strong>${escapeHtml(company.financials.netIncome.formatted)}</strong></span>`;
      }
      financialsHtml += `</div>`;
    }

    companyHeaderEl.innerHTML = `
      <div class="company-header-left">
        <h1>${escapeHtml(company.name)}</h1>
        <div class="company-meta">
          ${marketBadgeHtml(company.market)}
          <span>${escapeHtml(company.ticker)}</span>
          <span>${escapeHtml(company.exchange)}</span>
          <span>${escapeHtml(company.industry)}</span>
        </div>
        <div class="company-quote">${quoteHtml}</div>
        ${financialsHtml}
      </div>
      <button id="watchBtn" class="watch-btn ${watched ? "watched" : ""}">${watched ? "已关注" : "加入关注"}</button>
    `;

    document.getElementById("watchBtn").addEventListener("click", (e) => {
      const nowWatched = isWatched(company.market, company.id);
      if (nowWatched) {
        removeFromWatchlist(company.market, company.id);
        e.target.textContent = "加入关注";
        e.target.classList.remove("watched");
      } else {
        addToWatchlist(company);
        e.target.textContent = "已关注";
        e.target.classList.add("watched");
      }
    });
  }

  function renderScreening(screening, sourcesById) {
    screeningListEl.innerHTML = "";
    screeningBlockEl.classList.toggle("is-empty", !screening.length);
    if (!screening.length) {
      screeningEmptyEl.hidden = false;
      return;
    }
    screeningEmptyEl.hidden = true;
    screening.forEach((bullet) => screeningListEl.appendChild(renderScreeningBullet(bullet, sourcesById)));
  }

  function renderEvents() {
    let filtered = activeFilter === "all" ? currentEvents : currentEvents.filter((e) => e.eventType === activeFilter);
    if (activeSort === "importance") {
      filtered = [...filtered].sort((a, b) => {
        const rank = IMPORTANCE_RANK[b.importance] - IMPORTANCE_RANK[a.importance];
        return rank !== 0 ? rank : String(b.timestamp || "").localeCompare(String(a.timestamp || ""));
      });
    }
    eventListEl.innerHTML = "";
    if (!filtered.length) {
      feedEmptyEl.hidden = false;
      return;
    }
    feedEmptyEl.hidden = true;
    filtered.forEach((event) => eventListEl.appendChild(renderEventCard(event, { insight: aiInsights[event.id] })));
  }

  // Fires only after the real event data is already rendered — a slow or
  // failed LLM call must never delay or break the core page. Fills in
  // insight slots in place (see applyAiInsight) rather than re-rendering,
  // so it doesn't disturb whatever filter/sort state the user is on.
  async function loadAiInsightsProgressively() {
    if (!currentEvents.length) return;
    try {
      const payload = {
        events: currentEvents.map((e) => ({ id: e.id, title: e.title, company: e.company, eventType: e.eventType, formType: e.formType })),
      };
      const response = await fetch(`${API_BASE}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.insights) return;
      aiInsights = { ...aiInsights, ...data.insights };
      Object.entries(data.insights).forEach(([eventId, text]) => applyAiInsight(eventId, text));
    } catch (error) {
      // Silent — this is a nice-to-have layer, not core functionality.
    }
  }

  filterChipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    filterChipsEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.type;
    renderEvents();
  });

  sortToggleEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".sort-option");
    if (!btn) return;
    sortToggleEl.querySelectorAll(".sort-option").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeSort = btn.dataset.sort;
    renderEvents();
  });

  async function load() {
    if (!market || !id || !["us", "cn", "hk"].includes(market)) {
      showError("链接参数缺失，请通过搜索进入公司工作台。");
      return;
    }
    try {
      const data = await fetchJSON(`${API_BASE}/company?market=${market}&id=${encodeURIComponent(id)}`);
      loadingStateEl.hidden = true;
      companyContentEl.hidden = false;

      document.title = `${data.company.name} · 投资情报助手`;
      renderCompanyHeader(data.company);

      if (data.coverageNotice) {
        coverageNoticeEl.hidden = false;
        const officialLink =
          market === "hk"
            ? ` <a class="external-ref-link" href="https://www1.hkexnews.hk/search/titlesearch.xhtml" target="_blank" rel="noopener noreferrer">去披露易官网查看 ↗</a>`
            : "";
        coverageNoticeEl.innerHTML = `<span>${escapeHtml(data.coverageNotice)}</span>${officialLink}`;
      }

      const sourcesById = new Map(data.sources.map((s) => [s.id, s]));
      renderScreening(data.screening, sourcesById);

      currentEvents = data.events;
      renderEvents();
      loadAiInsightsProgressively();
    } catch (error) {
      showError(error.status === 404 ? "未找到匹配公司，请检查名称或代码格式。" : (error.message || "加载失败，请稍后重试。"));
    }
  }

  initPasswordGate(load);
})();
