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

    const allEvents = [];
    const failed = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allEvents.push(...result.value.events);
      } else {
        failed.push(watchlist[index].name);
      }
    });

    allEvents.sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));

    if (!allEvents.length) {
      logFeedEl.innerHTML = `<p class="empty-state-sub">已关注公司近期没有可用动态。</p>`;
    } else {
      allEvents.slice(0, 60).forEach((event) => {
        logFeedEl.appendChild(renderEventCard(event, { showCompany: true }));
      });
    }

    if (failed.length) {
      const notice = document.createElement("p");
      notice.className = "empty-state-sub";
      notice.textContent = `以下公司本次未能获取到最新数据，可点击“刷新”重试：${failed.join("、")}`;
      logFeedEl.prepend(notice);
    }

    lastUpdatedEl.textContent = `最后更新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  refreshBtn.addEventListener("click", loadLog);

  renderWatchlistChips();
  loadLog();
})();
