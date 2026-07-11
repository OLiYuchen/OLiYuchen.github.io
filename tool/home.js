(function () {
  const searchInput = document.getElementById("searchInput");
  const searchDropdown = document.getElementById("searchDropdown");
  const watchlistChipsEl = document.getElementById("watchlistChips");
  const logFeedEl = document.getElementById("logFeed");
  const emptyStateEl = document.getElementById("emptyState");
  const loadingStateEl = document.getElementById("loadingState");
  const lastUpdatedEl = document.getElementById("lastUpdated");
  const refreshBtn = document.getElementById("refreshBtn");

  setupGlobalSearch(searchInput, searchDropdown);

  function renderWatchlistChips() {
    const list = getWatchlist();
    if (!list.length) {
      watchlistChipsEl.innerHTML = `<span class="watchlist-hint">暂无关注公司</span>`;
      return;
    }
    watchlistChipsEl.innerHTML = list
      .map(
        (c) => `
      <span class="watchlist-chip">
        <button class="chip-name" data-market="${c.market}" data-id="${c.id}">${escapeHtml(c.name)}</button>
        <button class="chip-remove" data-market="${c.market}" data-id="${c.id}" aria-label="取消关注">×</button>
      </span>`,
      )
      .join("");

    watchlistChipsEl.querySelectorAll(".chip-name").forEach((btn) => {
      btn.addEventListener("click", () => navigateToCompany(btn.dataset.market, btn.dataset.id));
    });
    watchlistChipsEl.querySelectorAll(".chip-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeFromWatchlist(btn.dataset.market, btn.dataset.id);
        renderWatchlistChips();
        loadLog();
      });
    });
  }

  // A short, deterministic status line per company — real counts and the
  // single latest headline, not an AI-written narrative.
  function buildCompanySummary(events) {
    if (!events.length) return "近期没有可用动态。";
    const sorted = [...events].sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    const latest = sorted[0];
    const highCount = events.filter((e) => e.importance === "high").length;
    let text = `共 ${events.length} 条动态`;
    if (highCount > 0) text += `，其中 ${highCount} 条为高优先级`;
    text += `。最新：《${latest.title}》`;
    return text;
  }

  function renderCompanyLogBlock(company, events, failed) {
    const block = document.createElement("article");
    block.className = "company-log-block";

    const sorted = [...events].sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    const latestTime = sorted.length ? formatRelativeTime(sorted[0].timestamp) : "";
    const summaryText = failed ? "本次未能获取到最新数据，可点击「刷新」重试。" : buildCompanySummary(events);

    block.innerHTML = `
      <div class="company-log-head">
        <button class="company-log-name">${escapeHtml(company.name)}</button>
        <span class="search-result-market">${escapeHtml(marketLabel(company.market))}</span>
        ${latestTime ? `<time class="event-time">${escapeHtml(latestTime)}</time>` : ""}
      </div>
      <p class="company-log-summary">${escapeHtml(summaryText)}</p>
      <a class="company-log-link" href="/tool/company?m=${encodeURIComponent(company.market)}&id=${encodeURIComponent(company.id)}">查看全部动态与来源 →</a>
    `;
    block.querySelector(".company-log-name").addEventListener("click", () => navigateToCompany(company.market, company.id));
    if (failed) {
      block.appendChild(renderQuickReportLink(`首页日志获取失败（${company.market}/${company.id} ${company.name}）`));
    }
    return block;
  }

  async function loadLog() {
    const watchlist = getWatchlist();

    if (!watchlist.length) {
      emptyStateEl.hidden = false;
      logFeedEl.innerHTML = "";
      loadingStateEl.hidden = true;
      lastUpdatedEl.textContent = "";
      return;
    }

    emptyStateEl.hidden = true;
    loadingStateEl.hidden = false;
    logFeedEl.innerHTML = "";

    const results = await Promise.allSettled(
      watchlist.map((c) => fetchJSON(`${API_BASE}/company?market=${c.market}&id=${encodeURIComponent(c.id)}`)),
    );

    loadingStateEl.hidden = true;

    // Companies with the most recent activity surface first.
    const blocks = watchlist.map((company, index) => {
      const result = results[index];
      const events = result.status === "fulfilled" ? result.value.events : [];
      const latestTimestamp = events.length
        ? events.reduce((max, e) => (String(e.timestamp || "") > max ? String(e.timestamp || "") : max), "")
        : "";
      return { company, events, failed: result.status !== "fulfilled", latestTimestamp };
    });
    blocks.sort((a, b) => b.latestTimestamp.localeCompare(a.latestTimestamp));

    blocks.forEach(({ company, events, failed }) => {
      logFeedEl.appendChild(renderCompanyLogBlock(company, events, failed));
    });

    lastUpdatedEl.textContent = `最后更新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  refreshBtn.addEventListener("click", loadLog);

  initPasswordGate(() => {
    renderWatchlistChips();
    loadLog();
  });
})();
