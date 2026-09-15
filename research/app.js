(() => {
  "use strict";

  const STORAGE_KEY = "research-os-state-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const now = () => new Date().toISOString();
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);

  const initialState = {
    version: 1,
    project: {
      name: "Corgi ETF 基础设施研究",
      shortName: "Corgi ETF 研究",
      goal: "理解 Corgi 获得大型机构信任的原因、ETF 业务的实际角色，以及投资人对未来增长的预期。"
    },
    sources: [
      { id: "src-1", title: "Corgi 2025 机构业务说明", type: "PDF", origin: "Investor Relations", owner: "Olivia", date: "2026-08-08", visibility: "Project", status: "Ready" },
      { id: "src-2", title: "SEC ETF 注册文件 S-1", type: "PDF", origin: "sec.gov", owner: "Ethan", date: "2026-08-07", visibility: "Project", status: "Ready" },
      { id: "src-3", title: "创始人访谈：从托管到基础设施", type: "URL", origin: "Institutional Investor", owner: "Maya", date: "2026-08-06", visibility: "Project", status: "Ready" },
      { id: "src-4", title: "竞品 ETF 服务模式对比", type: "Note", origin: "Olivia's research", owner: "Olivia", date: "2026-08-10", visibility: "Private", status: "Ready" },
      { id: "src-5", title: "Q2 投资人问答逐字稿", type: "DOCX", origin: "External Drive", owner: "Olivia", date: "2026-08-11", visibility: "Private", status: "Ready" }
    ],
    privateItems: [
      { id: "private-1", kind: "Note", title: "机构信任可能来自合规流程", content: "暂时不确定是品牌效应还是合规能力。需要比较合作伙伴的 due diligence 要求。", updated: "12 分钟前" },
      { id: "private-2", kind: "Source", sourceId: "src-5", title: "Q2 投资人问答逐字稿", content: "已提取 8 条潜在发现，其中 2 条可能影响当前结论。", updated: "35 分钟前" },
      { id: "private-3", kind: "Draft", title: "ETF 收入不是单一管理费", content: "收入似乎包含创建赎回、托管和数据服务，还需要一手资料验证。", updated: "昨天" },
      { id: "private-4", kind: "Source", sourceId: "src-4", title: "竞品 ETF 服务模式对比", content: "已对比 6 家同类公司的服务边界与收费方式。", updated: "昨天" }
    ],
    questions: [
      { id: "q-1", title: "Corgi 在 ETF 发行链路中究竟承担什么角色？", why: "这决定 ETF 业务的利润率和合规风险应该如何评估。", status: "Investigating", priority: "High", progress: 72, contributions: 3 },
      { id: "q-2", title: "大型机构选择 Corgi 的关键决策标准是什么？", why: "需要区分合规、流动性、技术与历史业绩的真实贡献。", status: "Investigating", priority: "High", progress: 45, contributions: 2 },
      { id: "q-3", title: "投资人预期的下一个增长引擎是什么？", why: "当前叙事同时包含 ETF 规模、数据服务和海外扩张。", status: "Open", priority: "Medium", progress: 18, contributions: 1 }
    ],
    contributions: [
      {
        id: "c-1", title: "Corgi 主要提供 ETF 基础设施，而非直接发行人", type: "Finding", summary: "SEC 注册文件将法定发行责任归于外部信托主体；Corgi 承担创建赎回、托管接入和运营支持。", why: "这会重新定义收入质量、资本占用和监管风险。", author: "Ethan", date: "今天 09:42", status: "Verified", confidence: "High", importance: "Critical", sourceIds: ["src-2"], questionId: "q-1", pinned: true, verifications: 2
      },
      {
        id: "c-2", title: "机构客户更看重可审计的运营记录", type: "Evidence", summary: "三个客户案例均将持续可审计性和异常处理时间列为合作筛选条件，品牌并非首要原因。", why: "机构信任可能是一项可被复制的运营能力，而不是不可复制的品牌资产。", author: "Maya", date: "昨天 16:18", status: "Needs Verification", confidence: "Medium", importance: "Important", sourceIds: ["src-3"], questionId: "q-2", pinned: true, verifications: 0
      },
      {
        id: "c-3", title: "ETF 业务已形成独立的服务收入组合", type: "Analysis", summary: "披露中的 ETF 相关收入不只来自资产规模抽成，还包含运营、数据和托管接入费。", why: "多元收入结构可能降低对 ETF 资产规模波动的敏感性。", author: "Olivia", date: "昨天 11:05", status: "Published", confidence: "Medium", importance: "Normal", sourceIds: ["src-1"], questionId: "q-3", pinned: false, verifications: 1
      },
      {
        id: "c-4", title: "直接发行人叙事可能高估了 Corgi 的资本风险", type: "Counterargument", summary: "早期研究将 Corgi 视为 ETF 直接发行人，但法定文件不支持这一判断。", why: "需要修正团队对监管责任和估值倍数的假设。", author: "Ethan", date: "8 月 9 日", status: "Verified", confidence: "High", importance: "Important", sourceIds: ["src-2"], questionId: "q-1", pinned: false, verifications: 2
      }
    ],
    synthesis: {
      version: 3,
      updated: "今天 10:06",
      summary: "Corgi 的机构信任并不主要来自品牌或直接发行资格，而是来自可审计的运营流程、托管接入与 ETF 全生命周期服务。现有证据表明，Corgi 更像是外部发行主体的基础设施合作伙伴。",
      know: [
        "Corgi 为 ETF 提供创建赎回、托管接入和运营支持。",
        "外部信托主体承担法定发行人责任。",
        "机构客户在采购中显式评估可审计性和异常响应。"
      ],
      changed: "团队已从“Corgi 直接发行 ETF”修正为“Corgi 支持外部发行人运作 ETF”。",
      conflicts: "ETF 收入中不同服务线的毛利率仍无法从公开披露中分离。",
      suggestion: null
    },
    logs: [
      { id: "log-1", date: "今天 10:06", impact: "Major", title: "团队修正了对 Corgi ETF 角色的理解", summary: "Ethan 基于 SEC 一手文件发布两条发现，证明 Corgi 提供基础设施而非承担法定发行人责任。一条发现已被置顶，并纳入结论 v3。", related: ["Corgi 主要提供 ETF 基础设施", "SEC ETF 注册文件 S-1"] },
      { id: "log-2", date: "昨天 17:02", impact: "Meaningful", title: "机构信任的解释从品牌转向运营能力", summary: "Maya 整理的客户案例表明，可审计性和异常处理时间是三个机构的共同筛选条件。该发现仍待另一位成员验证。", related: ["机构客户更看重可审计的运营记录"] },
      { id: "log-3", date: "8 月 9 日", impact: "Meaningful", title: "ETF 收入结构出现新线索", summary: "Olivia 识别出运营、数据和托管接入等多个收入来源，但目前无法从公开披露中分离各服务线毛利率。", related: ["Corgi 2025 机构业务说明"] }
    ]
  };

  let state = loadState();
  let currentView = "overview";
  let privateFilter = "All";
  let teamFilters = { query: "", status: "All", type: "All" };
  let toastTimer;

  const content = $("#content");
  const sourceDialog = $("#sourceDialog");
  const noteDialog = $("#noteDialog");
  const publishDialog = $("#publishDialog");
  const challengeDialog = $("#challengeDialog");
  const questionDialog = $("#questionDialog");
  const searchDialog = $("#searchDialog");

  $$("button[value='cancel']").forEach((button) => { button.formNoValidate = true; });

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === 1) return saved;
    } catch (error) {
      console.warn("Unable to read saved research state", error);
    }
    return structuredClone(initialState);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateCounts();
  }

  function updateIcons(root = document) {
    if (window.lucide) window.lucide.createIcons({ root });
  }

  function updateCounts() {
    $("#privateCount").textContent = state.privateItems.length;
    $("#questionCount").textContent = state.questions.filter((item) => item.status !== "Resolved").length;
    $("#sidebarProjectName").textContent = state.project.shortName;
    $("#topProjectName").textContent = state.project.name;
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function formatSourceIcon(type) {
    if (type === "URL") return "link";
    if (type === "PDF") return "file-text";
    if (type === "DOCX") return "file-type-2";
    if (type === "Text" || type === "Note") return "notebook-pen";
    return "file";
  }

  function authorAvatar(author) {
    const config = {
      Olivia: ["OF", "avatar-olivia"],
      Ethan: ["EC", "avatar-ethan"],
      Maya: ["ML", "avatar-maya"],
      System: ["AI", "avatar-system"]
    }[author] || [author.slice(0, 2).toUpperCase(), "avatar-system"];
    return `<span class="avatar ${config[1]}">${escapeHTML(config[0])}</span>`;
  }

  function statusTag(status) {
    const type = status === "Verified" ? "accent" : status === "Challenged" ? "danger" : status === "Needs Verification" ? "warning" : "";
    const labels = { Verified: "已验证", Challenged: "已质疑", "Needs Verification": "待验证", Published: "已发布" };
    return `<span class="tag ${type}">${escapeHTML(labels[status] || status)}</span>`;
  }

  function pageHead(title, description, actions = "") {
    return `<div class="page-head"><div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(description)}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</div>`;
  }

  function render() {
    const renderers = {
      overview: renderOverview,
      "my-research": renderMyResearch,
      "team-research": renderTeamResearch,
      questions: renderQuestions,
      synthesis: renderSynthesis,
      "research-log": renderResearchLog,
      sources: renderSources
    };
    content.innerHTML = renderers[currentView]();
    $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === currentView));
    updateCounts();
    updateIcons(content);
    content.focus({ preventScroll: true });
  }

  function renderOverview() {
    const pinned = state.contributions.filter((item) => item.pinned).slice(0, 3);
    const openQuestions = state.questions.filter((item) => item.status !== "Resolved").slice(0, 3);
    const recentLogs = state.logs.slice(0, 2);
    return `
      ${pageHead("项目概览", "快速了解当前结论、最近的认知变化和下一个研究入口。", `<button class="btn secondary" data-view="my-research"><i data-lucide="lock-keyhole"></i>继续私人研究</button><button class="btn primary" data-action="publish"><i data-lucide="send"></i>发布贡献</button>`)}
      <div class="goal-line"><i data-lucide="target"></i><div><strong>研究目标</strong><p>${escapeHTML(state.project.goal)}</p></div></div>
      <div class="overview-grid">
        <div class="stack">
          <section class="section-block">
            <div class="section-head"><div><h2>当前结论</h2><p>团队基于现有证据的最新共识</p></div><button class="section-link" data-view="synthesis">查看 v${state.synthesis.version}</button></div>
            <div class="synthesis-body">
              <div class="synthesis-meta"><span class="tag accent"><i data-lucide="circle-check"></i>Active</span><span class="tag">v${state.synthesis.version}</span><span class="tag">${escapeHTML(state.synthesis.updated)} 更新</span></div>
              <p class="summary">${escapeHTML(state.synthesis.summary)}</p>
              <div class="synthesis-evidence"><i data-lucide="waypoints"></i><span>基于 ${state.contributions.length} 条贡献与 ${state.sources.filter((item) => item.visibility === "Project").length} 个团队来源</span><button class="section-link" data-view="synthesis">查看溯源</button></div>
            </div>
          </section>
          <section class="section-block">
            <div class="section-head"><div><h2>最近发生了什么变化</h2><p>仅显示对团队认知有实质影响的更新</p></div><button class="section-link" data-view="research-log">全部日志</button></div>
            <div class="change-list">${recentLogs.map((log) => `
              <article class="change-row"><div><span class="change-time">${escapeHTML(log.date)}</span><span class="change-impact">${escapeHTML(log.impact)}</span></div><div class="change-content"><h3>${escapeHTML(log.title)}</h3><p>${escapeHTML(log.summary)}</p><button data-view="research-log">查看 Research Diff →</button></div></article>`).join("")}</div>
          </section>
          <section class="section-block">
            <div class="section-head"><div><h2>最近贡献</h2><p>正式发布到团队的研究</p></div><button class="section-link" data-view="team-research">查看全部</button></div>
            <div class="contribution-list">${state.contributions.slice(0, 2).map(renderContribution).join("")}</div>
          </section>
        </div>
        <div class="stack">
          <section class="section-block">
            <div class="section-head"><div><h2>置顶发现</h2><p>团队当前最需要知道的事</p></div></div>
            <div class="pinned-list">${pinned.length ? pinned.map((item) => `<article class="pinned-item"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.author)} · ${escapeHTML(item.date)}</p><span class="tag ${item.importance === "Critical" ? "danger" : "warning"}">${escapeHTML(item.importance)}</span></article>`).join("") : emptyInline("还没有置顶发现")}</div>
          </section>
          <section class="section-block">
            <div class="section-head"><div><h2>待解问题</h2><p>建议从这里继续研究</p></div><button class="section-link" data-view="questions">全部</button></div>
            <div class="question-list">${openQuestions.map(renderCompactQuestion).join("")}</div>
          </section>
        </div>
      </div>`;
  }

  function renderCompactQuestion(item) {
    return `<article class="question-row"><div class="question-row-top"><h3>${escapeHTML(item.title)}</h3><span class="tag ${item.priority === "High" ? "warning" : ""}">${escapeHTML(item.priority)}</span></div><p>${item.contributions} 条相关贡献 · ${item.status === "Investigating" ? "调研中" : "待回答"}</p><div class="progress" aria-label="回答进度 ${item.progress}%"><span style="width:${item.progress}%"></span></div></article>`;
  }

  function emptyInline(text) {
    return `<div class="empty-state"><i data-lucide="inbox"></i><h3>${escapeHTML(text)}</h3></div>`;
  }

  function renderMyResearch() {
    const items = state.privateItems.filter((item) => privateFilter === "All" || item.kind === privateFilter);
    const tabs = [["All", "全部"], ["Source", "资料"], ["Note", "笔记"], ["Draft", "贡献草稿"]];
    return `
      ${pageHead("我的研究", "只有你可见的探索空间。内容不会自动进入团队结论。", `<button class="btn secondary" data-action="new-note"><i data-lucide="notebook-pen"></i>新建笔记</button><button class="btn primary" data-action="add-source"><i data-lucide="paperclip"></i>添加资料</button>`)}
      <div class="toolbar"><div class="research-tabs">${tabs.map(([value, label]) => `<button class="${privateFilter === value ? "is-active" : ""}" data-private-filter="${value}">${label}</button>`).join("")}</div><span class="tag accent"><i data-lucide="lock-keyhole"></i>私人</span></div>
      ${items.length ? `<div class="private-grid">${items.map(renderPrivateItem).join("")}</div>` : `<section class="section-block">${emptyInline("这个分类还没有内容")}</section>`}`;
  }

  function renderPrivateItem(item) {
    const icons = { Note: "notebook-pen", Source: "file-search", Draft: "file-pen-line" };
    const labels = { Note: "私人笔记", Source: "私人资料", Draft: "贡献草稿" };
    return `<article class="private-item"><div class="private-top"><span class="private-type"><i data-lucide="${icons[item.kind]}"></i>${labels[item.kind]}</span><button class="icon-btn" data-action="private-menu" aria-label="更多操作"><i data-lucide="more-horizontal"></i></button></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.content)}</p><div class="private-actions"><span>${escapeHTML(item.updated)}</span><button class="btn secondary small" data-action="publish" data-private-id="${item.id}"><i data-lucide="send"></i>整理并发布</button></div></article>`;
  }

  function renderTeamResearch() {
    let contributions = [...state.contributions];
    if (teamFilters.status !== "All") contributions = contributions.filter((item) => item.status === teamFilters.status);
    if (teamFilters.type !== "All") contributions = contributions.filter((item) => item.type === teamFilters.type);
    if (teamFilters.query.trim()) {
      const query = teamFilters.query.toLowerCase();
      contributions = contributions.filter((item) => `${item.title} ${item.summary} ${item.author}`.toLowerCase().includes(query));
    }
    contributions.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return `
      ${pageHead("团队研究", "所有已发布的正式研究贡献，每条都保留作者、状态与证据来源。", `<button class="btn primary" data-action="publish"><i data-lucide="send"></i>发布贡献</button>`)}
      <div class="toolbar"><div class="toolbar-group"><div class="search-control"><i data-lucide="search"></i><input id="teamQuery" value="${escapeHTML(teamFilters.query)}" placeholder="搜索贡献" /></div><select class="filter-control" id="statusFilter" aria-label="按状态筛选"><option value="All">全部状态</option>${["Verified", "Needs Verification", "Challenged", "Published"].map((value) => `<option ${teamFilters.status === value ? "selected" : ""}>${value}</option>`).join("")}</select><select class="filter-control" id="typeFilter" aria-label="按类型筛选"><option value="All">全部类型</option>${["Finding", "Evidence", "Analysis", "Hypothesis", "Counterargument", "Context", "Recommendation"].map((value) => `<option ${teamFilters.type === value ? "selected" : ""}>${value}</option>`).join("")}</select></div><span class="tag">${contributions.length} 条结果</span></div>
      <section class="section-block"><div class="contribution-list">${contributions.length ? contributions.map(renderContribution).join("") : emptyInline("没有符合条件的贡献")}</div></section>`;
  }

  function renderContribution(item) {
    const sources = item.sourceIds.map((id) => state.sources.find((source) => source.id === id)).filter(Boolean);
    const question = state.questions.find((entry) => entry.id === item.questionId);
    return `<article class="contribution-item ${item.pinned ? "is-pinned" : ""}" data-contribution-id="${item.id}">
      <div class="contribution-head"><div class="contribution-title-wrap"><div class="synthesis-meta">${item.pinned ? `<span class="tag accent"><i data-lucide="pin"></i>置顶</span>` : ""}<span class="tag blue">${escapeHTML(item.type)}</span>${statusTag(item.status)}<span class="tag">${escapeHTML(item.confidence)} confidence</span></div><h3>${escapeHTML(item.title)}</h3><p class="contribution-summary">${escapeHTML(item.summary)}</p></div>${item.importance !== "Normal" ? `<span class="tag ${item.importance === "Critical" ? "danger" : "warning"}">${escapeHTML(item.importance)}</span>` : ""}</div>
      <div class="contribution-meta"><span class="author">${authorAvatar(item.author)}${escapeHTML(item.author)}</span><span class="meta-divider"></span><span>${escapeHTML(item.date)}</span>${question ? `<span class="meta-divider"></span><span>关联：${escapeHTML(question.title)}</span>` : ""}</div>
      <div class="contribution-why"><strong>为什么重要：</strong>${escapeHTML(item.why)}</div>
      <div class="contribution-footer"><div class="citation-links">${sources.map((source) => `<span class="citation-link"><i data-lucide="${formatSourceIcon(source.type)}"></i>${escapeHTML(source.title)}</span>`).join("") || `<span class="tag warning">未关联来源</span>`}</div><div class="contribution-actions"><button class="btn ghost small" data-action="pin" data-id="${item.id}"><i data-lucide="pin"></i>${item.pinned ? "取消置顶" : "置顶"}</button><button class="btn secondary small" data-action="verify" data-id="${item.id}" ${item.status === "Verified" ? "disabled" : ""}><i data-lucide="badge-check"></i>${item.status === "Verified" ? `已验证 ${item.verifications || ""}` : "验证"}</button><button class="btn secondary small" data-action="challenge" data-id="${item.id}"><i data-lucide="message-square-warning"></i>质疑</button></div></div>
    </article>`;
  }

  function renderQuestions() {
    return `
      ${pageHead("待解问题", "团队当前还需要回答的事。问题不强制指定负责人，可由多位成员同时推进。", `<button class="btn primary" data-action="new-question"><i data-lucide="plus"></i>添加问题</button>`)}
      <section class="section-block"><div class="question-list">${state.questions.map((item) => `<article class="question-page-row"><div><div class="synthesis-meta"><span class="tag ${item.status === "Resolved" ? "accent" : "blue"}">${escapeHTML(item.status)}</span><span class="tag ${item.priority === "High" ? "warning" : ""}">${escapeHTML(item.priority)} priority</span></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.why)}</p></div><div class="question-page-meta"><span>${item.contributions} 条相关贡献</span><span>当前回答进度 ${item.progress}%</span><div class="progress"><span style="width:${item.progress}%"></span></div><button class="section-link" data-action="publish" data-question-id="${item.id}">发布相关贡献 →</button></div></article>`).join("")}</div></section>`;
  }

  function renderSynthesis() {
    const suggestion = state.synthesis.suggestion;
    return `
      ${pageHead("当前结论", "团队基于现有证据最合理的统一认知。AI 只能提交建议，不会静默改写正式版本。", `<button class="btn secondary" data-action="version-history"><i data-lucide="history"></i>版本历史</button>`)}
      <div class="synthesis-layout">
        <article class="document">
          <div class="document-meta"><span><span class="tag accent">Active</span> &nbsp; v${state.synthesis.version}</span><span>${escapeHTML(state.synthesis.updated)} · 由 Olivia 接受</span></div>
          <section><h2>执行摘要</h2><p>${renderProvenance(state.synthesis.summary)}</p></section>
          <section><h2>我们已经知道</h2><ul>${state.synthesis.know.map((item) => `<li>${renderProvenance(item)}</li>`).join("")}</ul></section>
          <section><h2>最近发生的变化</h2><p>${renderProvenance(state.synthesis.changed)}</p></section>
          <section><h2>冲突与不确定性</h2><p>${escapeHTML(state.synthesis.conflicts)}</p></section>
          <div class="synthesis-evidence"><i data-lucide="waypoints"></i><span>结论 → ${state.contributions.length} 条贡献 → ${state.sources.filter((item) => item.visibility === "Project").length} 个团队来源</span></div>
        </article>
        <div class="stack">
          ${suggestion ? renderSuggestion(suggestion) : `<section class="section-block"><div class="section-head"><div><h2>结论更新建议</h2><p>AI 发现实质变化后会显示在这里</p></div></div><div class="empty-state"><i data-lucide="circle-check"></i><h3>目前没有待审核更新</h3><p>当前版本已包含所有有实质影响的已验证贡献。</p></div></section>`}
          <section class="section-block"><div class="section-head"><div><h2>溯源说明</h2><p>每个正式结论的证据链</p></div></div><div class="pinned-list"><article class="pinned-item"><h3>结论句子</h3><p>↓ 追溯到团队贡献</p></article><article class="pinned-item"><h3>研究贡献</h3><p>↓ 追溯到引用证据</p></article><article class="pinned-item"><h3>原始资料</h3><p>保留来源、作者与发布时间</p></article></div></section>
        </div>
      </div>`;
  }

  function renderProvenance(text) {
    return `<span class="provenance" title="点击可追溯到相关贡献与来源">${escapeHTML(text)}</span>`;
  }

  function renderSuggestion(suggestion) {
    return `<section class="suggestion-panel"><div class="section-head"><div><h2>待审核更新</h2><p>AI 基于 1 条新贡献生成</p></div><span class="tag warning">Human review</span></div><div class="diff-block"><span class="diff-label">当前表述</span><div class="diff-old">${escapeHTML(suggestion.previous)}</div><span class="diff-label" style="margin-top:12px">建议表述</span><div class="diff-new">${escapeHTML(suggestion.proposed)}</div></div><p class="suggestion-reason"><strong>原因：</strong>${escapeHTML(suggestion.reason)}</p><div class="suggestion-actions"><button class="btn primary small" data-action="accept-synthesis"><i data-lucide="check"></i>接受为 v${state.synthesis.version + 1}</button><button class="btn secondary small" data-action="reject-synthesis">拒绝</button></div></section>`;
  }

  function renderResearchLog() {
    return `
      ${pageHead("研究日志", "将大量操作压缩成真正值得团队阅读的认知变化。", "")}
      <div class="toolbar"><div class="research-tabs"><button class="is-active">今天</button><button>本周</button><button>自定义</button></div><span class="tag"><i data-lucide="sparkles"></i>AI 聚合了 27 条原始事件</span></div>
      <section class="section-block"><div class="log-list">${state.logs.map((log) => `<article class="log-row"><div class="log-date">${escapeHTML(log.date)}<br><span class="tag ${log.impact === "Major" ? "danger" : "warning"}">${escapeHTML(log.impact)}</span></div><div class="log-icon"><i data-lucide="${log.impact === "Major" ? "git-compare-arrows" : "lightbulb"}"></i></div><div class="log-content"><h3>${escapeHTML(log.title)}</h3><p>${escapeHTML(log.summary)}</p><div class="log-related">${log.related.map((item) => `<span class="citation-link"><i data-lucide="link-2"></i>${escapeHTML(item)}</span>`).join("")}</div></div></article>`).join("")}</div></section>`;
  }

  function renderSources() {
    return `
      ${pageHead("资料来源", "资料是证据载体，不是知识本体。私人资料不会进入团队 AI 上下文。", `<button class="btn primary" data-action="add-source"><i data-lucide="paperclip"></i>添加资料</button>`)}
      <div class="toolbar"><div class="toolbar-group"><select class="filter-control"><option>全部可见性</option><option>仅团队</option><option>仅私人</option></select><select class="filter-control"><option>全部类型</option><option>PDF</option><option>URL</option><option>DOCX</option></select></div><span class="tag">${state.sources.length} 个来源</span></div>
      <section class="section-block"><div class="source-list"><div class="source-row source-header"><span>名称</span><span>可见性</span><span>添加者</span><span>日期</span><span></span></div>${state.sources.map((source) => `<article class="source-row"><div class="source-name"><i data-lucide="${formatSourceIcon(source.type)}"></i><div><strong>${escapeHTML(source.title)}</strong><span>${escapeHTML(source.origin)} · ${escapeHTML(source.type)}</span></div></div><div class="source-cell"><span class="tag ${source.visibility === "Private" ? "accent" : "blue"}"><i data-lucide="${source.visibility === "Private" ? "lock-keyhole" : "users"}"></i>${source.visibility === "Private" ? "私人" : "团队"}</span></div><div class="source-cell">${escapeHTML(source.owner)}</div><div class="source-cell">${escapeHTML(source.date)}</div><button class="icon-btn" aria-label="资料操作"><i data-lucide="more-horizontal"></i></button></article>`).join("")}</div></section>`;
  }

  function navigate(view) {
    if (!view || view === currentView) return;
    currentView = view;
    document.body.classList.remove("sidebar-open");
    render();
  }

  function openSourceDialog() {
    $("#sourceForm").reset();
    toggleSourceFields("URL");
    sourceDialog.showModal();
    updateIcons(sourceDialog);
    setTimeout(() => $("#sourceForm [name='title']").focus(), 0);
  }

  function toggleSourceFields(type) {
    $(".source-url", sourceDialog).hidden = type !== "URL";
    $(".source-file", sourceDialog).hidden = type !== "File";
    $(".source-text", sourceDialog).hidden = type !== "Text";
  }

  function openPublishDialog(options = {}) {
    const form = $("#publishForm");
    form.reset();
    const privateItem = options.privateId ? state.privateItems.find((item) => item.id === options.privateId) : null;
    form.elements.title.value = privateItem?.title || "";
    form.elements.summary.value = privateItem?.content || "";
    form.elements.why.value = "";
    $("#publishQuestion").innerHTML = `<option value="">不关联问题</option>${state.questions.map((item) => `<option value="${item.id}" ${options.questionId === item.id ? "selected" : ""}>${escapeHTML(item.title)}</option>`).join("")}`;
    const projectSources = state.sources.filter((item) => item.owner === "Olivia" || item.visibility === "Project");
    $("#publishSources").innerHTML = projectSources.map((source) => `<label class="source-option"><input type="checkbox" name="sources" value="${source.id}" ${privateItem?.sourceId === source.id ? "checked" : ""} /><span><strong>${escapeHTML(source.title)}</strong><span>${escapeHTML(source.type)} · ${source.visibility === "Private" ? "发布贡献时引用" : "团队可见"}</span></span></label>`).join("");
    form.dataset.privateId = privateItem?.id || "";
    updatePreflight();
    publishDialog.showModal();
    updateIcons(publishDialog);
    setTimeout(() => form.elements.title.focus(), 0);
  }

  function updatePreflight() {
    const form = $("#publishForm");
    const text = `${form.elements.title.value} ${form.elements.summary.value}`.trim();
    const result = $("#preflightResult");
    if (text.length < 12) {
      result.className = "preflight-empty";
      result.textContent = "填写标题和摘要后，系统会检查重复、冲突和新信息。";
      return;
    }
    const lower = text.toLowerCase();
    let title = "新发现";
    let type = "accent";
    let summary = "团队研究中尚未出现高度相似的表述。";
    let compare = "发布后将与当前结论比较，生成 Research Diff。";
    if (/blackrock|机构信任|可审计/.test(lower)) {
      title = "可能重复";
      type = "warning";
      summary = "与 Maya 的已有贡献高度相似。";
      compare = "已有：“机构客户更看重可审计的运营记录”";
    } else if (/直接发行|发行人/.test(lower)) {
      title = "潜在冲突";
      type = "danger";
      summary = "这条表述可能与团队已验证的发行角色判断冲突。";
      compare = "已有：“Corgi 提供基础设施，法定发行人为外部信托主体”";
    }
    result.className = "preflight-result";
    result.innerHTML = `<span class="tag ${type}">${title}</span><h3>${summary}</h3><div class="preflight-compare">${compare}</div>`;
  }

  function addLog(title, summary, related, impact = "Meaningful") {
    state.logs.unshift({ id: uid("log"), date: "刚刚", impact, title, summary, related });
  }

  function publishContribution(form) {
    const formData = new FormData(form);
    const contribution = {
      id: uid("c"),
      title: formData.get("title").trim(),
      type: formData.get("type"),
      summary: formData.get("summary").trim(),
      why: formData.get("why").trim(),
      author: "Olivia",
      date: "刚刚",
      status: "Published",
      confidence: formData.get("confidence"),
      importance: "Normal",
      sourceIds: formData.getAll("sources"),
      questionId: formData.get("question") || "",
      pinned: false,
      verifications: 0
    };
    state.contributions.unshift(contribution);
    const privateId = form.dataset.privateId;
    if (privateId) state.privateItems = state.privateItems.filter((item) => item.id !== privateId);
    const question = state.questions.find((item) => item.id === contribution.questionId);
    if (question) {
      question.contributions += 1;
      question.progress = Math.min(95, question.progress + 12);
      if (question.status === "Open") question.status = "Investigating";
    }
    state.synthesis.suggestion = {
      contributionId: contribution.id,
      previous: state.synthesis.summary,
      proposed: `${state.synthesis.summary} ${contribution.summary}`,
      reason: `新贡献“${contribution.title}”扩展了当前理解，需要人工判断是否纳入正式结论。`
    };
    addLog("一条新贡献扩展了当前理解", `Olivia 发布了“${contribution.title}”。系统已生成 Research Diff 和待审核的结论更新。`, [contribution.title], "Meaningful");
    saveState();
    publishDialog.close();
    currentView = "team-research";
    render();
    showToast("已发布到团队，并生成一条结论更新建议。");
  }

  function openChallenge(id) {
    const form = $("#challengeForm");
    form.reset();
    form.elements.contributionId.value = id;
    challengeDialog.showModal();
    updateIcons(challengeDialog);
    setTimeout(() => form.elements.reason.focus(), 0);
  }

  function openSearch(query = "") {
    if (!searchDialog.open) searchDialog.showModal();
    const input = $("#searchDialogInput");
    input.value = query;
    renderSearchResults(query);
    updateIcons(searchDialog);
    setTimeout(() => input.focus(), 0);
  }

  function renderSearchResults(query) {
    const results = [];
    const normalized = query.trim().toLowerCase();
    const includes = (...values) => !normalized || values.join(" ").toLowerCase().includes(normalized);
    state.contributions.forEach((item) => { if (includes(item.title, item.summary)) results.push({ type: "贡献", icon: "file-check-2", title: item.title, meta: `${item.author} · ${item.status}`, view: "team-research" }); });
    state.questions.forEach((item) => { if (includes(item.title, item.why)) results.push({ type: "问题", icon: "circle-help", title: item.title, meta: item.status, view: "questions" }); });
    state.sources.forEach((item) => { if (includes(item.title, item.origin)) results.push({ type: "来源", icon: formatSourceIcon(item.type), title: item.title, meta: `${item.type} · ${item.visibility}`, view: "sources" }); });
    state.logs.forEach((item) => { if (includes(item.title, item.summary)) results.push({ type: "日志", icon: "history", title: item.title, meta: `${item.date} · ${item.impact}`, view: "research-log" }); });
    $("#searchResults").innerHTML = results.length ? results.slice(0, 14).map((item) => `<button class="search-result" data-search-view="${item.view}"><i data-lucide="${item.icon}"></i><span><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.type)} · ${escapeHTML(item.meta)}</span></span></button>`).join("") : `<div class="empty-state"><i data-lucide="search-x"></i><h3>没有找到相关内容</h3><p>试试搜索人名、资料标题或结论关键词。</p></div>`;
    updateIcons($("#searchResults"));
  }

  document.addEventListener("click", (event) => {
    const viewTarget = event.target.closest("[data-view]");
    if (viewTarget) {
      navigate(viewTarget.dataset.view);
      return;
    }
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === "add-source") openSourceDialog();
    if (action === "new-note") {
      $("#noteForm").reset();
      noteDialog.showModal();
      updateIcons(noteDialog);
      setTimeout(() => $("#noteForm [name='title']").focus(), 0);
    }
    if (action === "publish") openPublishDialog({ privateId: actionTarget.dataset.privateId, questionId: actionTarget.dataset.questionId });
    if (action === "new-question") {
      $("#questionForm").reset();
      questionDialog.showModal();
      updateIcons(questionDialog);
    }
    if (action === "pin") {
      const item = state.contributions.find((entry) => entry.id === actionTarget.dataset.id);
      if (item) {
        item.pinned = !item.pinned;
        addLog(item.pinned ? "一条研究发现被置顶" : "一条研究发现被取消置顶", `${item.title} 由 Olivia ${item.pinned ? "设为团队重点" : "移出团队重点"}。`, [item.title], "Minor");
        saveState(); render(); showToast(item.pinned ? "已置顶到项目概览。" : "已取消置顶。");
      }
    }
    if (action === "verify") {
      const item = state.contributions.find((entry) => entry.id === actionTarget.dataset.id);
      if (item && item.status !== "Verified") {
        item.status = "Verified";
        item.verifications = (item.verifications || 0) + 1;
        addLog("一条研究贡献通过人工验证", `Olivia 验证了“${item.title}”，该内容现在可被优先用于结论更新。`, [item.title]);
        saveState(); render(); showToast("已验证这条贡献。");
      }
    }
    if (action === "challenge") openChallenge(actionTarget.dataset.id);
    if (action === "accept-synthesis") {
      const suggestion = state.synthesis.suggestion;
      if (suggestion) {
        state.synthesis.version += 1;
        state.synthesis.summary = suggestion.proposed;
        state.synthesis.updated = "刚刚";
        state.synthesis.suggestion = null;
        addLog(`当前结论更新为 v${state.synthesis.version}`, "Olivia 审核并接受了 AI 建议的结论变更，新版本保留了相关贡献与来源链路。", ["当前结论"], "Major");
        saveState(); render(); showToast(`已接受并生成结论 v${state.synthesis.version}。`);
      }
    }
    if (action === "reject-synthesis") {
      state.synthesis.suggestion = null;
      saveState(); render(); showToast("已拒绝这次结论更新，当前版本保持不变。");
    }
    if (action === "close-search") searchDialog.close();
    if (action === "new-project") showToast("当前版本聚焦一个研究项目的完整闭环。");
    if (action === "version-history") showToast(`当前为 v${state.synthesis.version}，早期版本会在后端接入后完整保留。`);
    if (action === "private-menu") showToast("私人内容可以继续编辑、转为贡献或删除。");
  });

  content.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-private-filter]");
    if (filter) { privateFilter = filter.dataset.privateFilter; render(); }
  });

  content.addEventListener("input", (event) => {
    if (event.target.id === "teamQuery") {
      teamFilters.query = event.target.value;
      const cursor = event.target.selectionStart;
      render();
      const next = $("#teamQuery");
      next.focus();
      next.setSelectionRange(cursor, cursor);
    }
  });

  content.addEventListener("change", (event) => {
    if (event.target.id === "statusFilter") { teamFilters.status = event.target.value; render(); }
    if (event.target.id === "typeFilter") { teamFilters.type = event.target.value; render(); }
  });

  $("#menuButton").addEventListener("click", () => document.body.classList.add("sidebar-open"));
  $("#sidebarScrim").addEventListener("click", () => document.body.classList.remove("sidebar-open"));

  $("#sourceForm").addEventListener("change", (event) => {
    if (event.target.name === "sourceType") toggleSourceFields(event.target.value);
    if (event.target.name === "file" && event.target.files[0] && !event.currentTarget.elements.title.value) event.currentTarget.elements.title.value = event.target.files[0].name;
  });

  $("#sourceForm").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "default") return;
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const sourceType = data.get("sourceType");
    const file = event.currentTarget.elements.file.files[0];
    const type = sourceType === "File" ? (file?.name.split(".").pop() || "File").toUpperCase() : sourceType;
    const source = { id: uid("src"), title: data.get("title").trim(), type, origin: sourceType === "URL" ? data.get("url") || "Web" : sourceType === "File" ? file?.name || "Uploaded file" : "Pasted text", owner: "Olivia", date: new Date().toISOString().slice(0, 10), visibility: "Private", status: "Ready" };
    state.sources.unshift(source);
    state.privateItems.unshift({ id: uid("private"), kind: "Source", sourceId: source.id, title: source.title, content: sourceType === "Text" ? String(data.get("text")).slice(0, 260) : "资料已保存，等待进一步整理或转为团队贡献。", updated: "刚刚" });
    saveState();
    sourceDialog.close();
    if (currentView === "my-research" || currentView === "sources") render();
    showToast("资料已保存到私人研究。");
  });

  $("#noteForm").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "default") return;
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.privateItems.unshift({ id: uid("private"), kind: "Note", title: data.get("title").trim(), content: data.get("content").trim(), updated: "刚刚" });
    saveState(); noteDialog.close();
    if (currentView === "my-research") render();
    showToast("私人笔记已保存。");
  });

  $("#publishForm").addEventListener("input", updatePreflight);
  $("#publishForm").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "default") return;
    event.preventDefault();
    publishContribution(event.currentTarget);
  });

  $("#challengeForm").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "default") return;
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const item = state.contributions.find((entry) => entry.id === data.get("contributionId"));
    if (item) {
      item.status = "Challenged";
      addLog("一条贡献收到新质疑", `Olivia 对“${item.title}”提出质疑：${data.get("reason").trim()}`, [item.title, data.get("evidence")].filter(Boolean), "Meaningful");
      saveState(); challengeDialog.close(); render(); showToast("质疑已记录，原始贡献内容保持不变。");
    }
  });

  $("#questionForm").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "default") return;
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.questions.push({ id: uid("q"), title: data.get("title").trim(), why: data.get("why").trim(), status: "Open", priority: data.get("priority"), progress: 0, contributions: 0 });
    saveState(); questionDialog.close(); render(); showToast("待解问题已添加。");
  });

  $("#globalSearchInput").addEventListener("focus", (event) => { openSearch(event.target.value); event.target.blur(); });
  $("#globalSearchInput").addEventListener("click", (event) => openSearch(event.target.value));
  $("#searchDialogInput").addEventListener("input", (event) => renderSearchResults(event.target.value));
  $("#searchResults").addEventListener("click", (event) => {
    const result = event.target.closest("[data-search-view]");
    if (result) { searchDialog.close(); navigate(result.dataset.searchView); }
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
    if (event.key === "Escape") document.body.classList.remove("sidebar-open");
  });

  updateCounts();
  render();
  updateIcons();
})();
