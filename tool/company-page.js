(function () {
  const searchInput = document.getElementById("searchInput");
  const searchDropdown = document.getElementById("searchDropdown");
  const loadingStateEl = document.getElementById("loadingState");
  const errorStateEl = document.getElementById("errorState");
  const errorMessageEl = document.getElementById("errorMessage");
  const companyContentEl = document.getElementById("companyContent");
  const companyHeaderEl = document.getElementById("companyHeader");
  const coverageNoticeEl = document.getElementById("coverageNotice");
  const screeningListEl = document.getElementById("screeningList");
  const screeningEmptyEl = document.getElementById("screeningEmpty");
  const filterChipsEl = document.getElementById("filterChips");
  const eventListEl = document.getElementById("eventList");
  const feedEmptyEl = document.getElementById("feedEmpty");

  setupGlobalSearch(searchInput, searchDropdown);

  const params = new URLSearchParams(window.location.search);
  const market = params.get("m");
  const id = params.get("id");

  let currentEvents = [];
  let activeFilter = "all";

  function showError(message) {
    loadingStateEl.hidden = true;
    errorStateEl.hidden = false;
    errorMessageEl.textContent = message;
  }

  function renderCompanyHeader(company) {
    const watched = isWatched(company.market, company.id);

    let quoteHtml = `<span class="empty-state-sub">行情数据当前不可用</span>`;
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
          <span>${escapeHtml(marketLabel(company.market))}</span>
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
    if (!screening.length) {
      screeningEmptyEl.hidden = false;
      return;
    }
    screeningEmptyEl.hidden = true;
    screening.forEach((bullet) => screeningListEl.appendChild(renderScreeningBullet(bullet, sourcesById)));
  }

  function renderEvents() {
    const filtered = activeFilter === "all" ? currentEvents : currentEvents.filter((e) => e.eventType === activeFilter);
    eventListEl.innerHTML = "";
    if (!filtered.length) {
      feedEmptyEl.hidden = false;
      return;
    }
    feedEmptyEl.hidden = true;
    filtered.forEach((event) => eventListEl.appendChild(renderEventCard(event)));
  }

  filterChipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    filterChipsEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.type;
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
        coverageNoticeEl.textContent = data.coverageNotice;
      }

      const sourcesById = new Map(data.sources.map((s) => [s.id, s]));
      renderScreening(data.screening, sourcesById);

      currentEvents = data.events;
      renderEvents();
    } catch (error) {
      showError(error.status === 404 ? "未找到匹配公司，请检查名称或代码格式。" : (error.message || "加载失败，请稍后重试。"));
    }
  }

  load();
})();
