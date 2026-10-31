(function () {
  const API_BASE = "/api/portugal-intel";
  const STORE_KEY = "portugal-intel.state.v1";
  const CONFIG_KEY = "portugal-intel.config.v1";

  const envNames = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PORTUGAL_INTEL_ALLOWED_EMAIL",
    "PORTUGAL_INTEL_CRON_SECRET",
    "TAVILY_API_KEY",
    "GEMINI_API_KEY",
    "YOUTUBE_API_KEY",
    "RESEND_API_KEY",
    "PORTUGAL_INTEL_EMAIL_FROM",
    "PORTUGAL_INTEL_EMAIL_TO",
  ];

  const seed = {
    lastRunAt: null,
    digestGeneratedAt: null,
    coverage: {
      state: "partial",
      families: [
        { name: "官方/监管源", status: "configured_pending", count: 6 },
        { name: "财经媒体搜索", status: "missing_key", count: 7 },
        { name: "YouTube 动态发现", status: "missing_key", count: 10 },
      ],
    },
    topics: [
      { slug: "politics_policy", name: "政治 / 政策 / 监管", priority: 80, active: true, purpose: "只保留对市场信心、财政、监管、投资环境有影响的变化。", keywords: ["governo Portugal", "Orçamento do Estado", "CMVM", "ASF", "Banco de Portugal"] },
      { slug: "macro", name: "宏观与金融环境", priority: 75, active: true, purpose: "GDP、通胀、就业、信贷、公共财政等事件驱动指标。", keywords: ["INE Portugal PIB", "inflação Portugal", "Banco de Portugal crédito", "dívida pública"] },
      { slug: "banking", name: "银行", priority: 85, active: true, purpose: "BCP、CGD、资本、股权、监管、贷款和交易。", keywords: ["Millennium BCP", "Caixa Geral de Depósitos", "banca Portugal"] },
      { slug: "insurance", name: "保险", priority: 85, active: true, purpose: "Fidelidade、ASF、偿付能力、理赔、bancassurance。", keywords: ["Fidelidade", "ASF seguros", "seguradoras Portugal"] },
      { slug: "fosun_portugal", name: "复星在葡资产", priority: 92, active: true, purpose: "复星、BCP、Fidelidade、Luz Saúde 相关资产变化。", keywords: ["Fosun Portugal", "Fidelidade IPO", "BCP Fosun", "Luz Saúde"] },
      { slug: "china_in_portugal", name: "中资与产业投资", priority: 88, active: true, purpose: "中国投资、CALB Sines、能源、汽车、电池、基础设施。", keywords: ["investimento chinês Portugal", "CALB Sines", "China Portugal investimento"] },
      { slug: "capital_markets_mna", name: "资本市场 / 交易", priority: 78, active: true, purpose: "IPO、M&A、私有化、CMVM 披露、资本运作。", keywords: ["IPO Portugal", "CMVM informação privilegiada", "M&A Portugal"] },
    ],
    entities: [
      { slug: "fosun", name: "Fosun / 复星", type: "investor", priority: 95, active: true, aliases: ["Fosun International", "Fosun Portugal", "复星"] },
      { slug: "bcp", name: "Millennium bcp / BCP", type: "bank", priority: 90, active: true, aliases: ["Banco Comercial Português", "BCP"] },
      { slug: "cgd", name: "CGD", type: "bank", priority: 84, active: true, aliases: ["Caixa Geral de Depósitos"] },
      { slug: "fidelidade", name: "Fidelidade", type: "insurer", priority: 94, active: true, aliases: ["Fidelidade Companhia de Seguros"] },
      { slug: "calb", name: "CALB / 中创新航", type: "industrial_project", priority: 88, active: true, aliases: ["China Aviation Lithium Battery", "CALB Sines", "中创新航"] },
    ],
    sources: [
      { id: "src-cmvm-1", title: "Informação privilegiada sobre participação qualificada no BCP", summaryZh: "CMVM 披露 BCP 股东持仓变化，需结合复星持股结构判断影响。", publisher: "CMVM", tier: 1, type: "official", topic: "banking", language: "pt", publishedAt: "2026-08-21T08:10:00+01:00", relevance: 91, url: "https://www.cmvm.pt/" },
      { id: "src-eco-1", title: "CGD avalia reforço em seguros após resultados do semestre", summaryZh: "财经媒体称 CGD 正评估保险业务布局，尚需官方来源确认。", publisher: "ECO", tier: 2, type: "news", topic: "insurance", language: "pt", publishedAt: "2026-08-21T09:45:00+01:00", relevance: 77, url: "https://eco.sapo.pt/" },
      { id: "src-yt-1", title: "Entrevista sobre investimento chinês em Sines", summaryZh: "视频讨论 CALB Sines 项目进度与地方就业承诺。", publisher: "YouTube", tier: 4, type: "youtube", topic: "china_in_portugal", language: "pt", publishedAt: "2026-08-20T18:20:00+01:00", relevance: 72, url: "https://www.youtube.com/" },
    ],
    events: [
      {
        id: "evt-bcp-stake",
        titleZh: "BCP 相关持股披露需要重新评估复星在葡金融资产影响",
        factZh: "CMVM 披露 BCP 重要持股信息，系统将其归入银行与复星在葡资产的交叉事件。",
        whyZh: "BCP 是复星在葡核心金融资产之一，任何控制权、持股或资本变化都可能影响后续资产处置与监管判断。",
        eventType: "ownership",
        topics: ["banking", "fosun_portugal"],
        entities: ["bcp", "fosun"],
        eventDate: "2026-08-21",
        firstPublishedAt: "2026-08-21T08:10:00+01:00",
        discoveredAt: "2026-08-21T15:35:00+08:00",
        freshness: "new_since_last_digest",
        changeType: "updates",
        importance: 82,
        confidence: 0.84,
        sources: ["src-cmvm-1"],
        prior: ["evt-bcp-fosun-baseline"],
        changeSummaryZh: "从一般持股背景更新为需要跟踪的当日监管披露。",
      },
      {
        id: "evt-cgd-insurance",
        titleZh: "CGD 保险布局传闻可能影响葡萄牙 bancassurance 竞争格局",
        factZh: "ECO 报道 CGD 正评估保险相关布局，但当前仍属媒体报道，等待官方或监管来源确认。",
        whyZh: "若 CGD 加强保险权益或分销控制，可能改变 Fidelidade、银行渠道和保险估值叙事。",
        eventType: "insurance",
        topics: ["insurance", "banking", "capital_markets_mna"],
        entities: ["cgd", "fidelidade"],
        eventDate: "2026-08-21",
        firstPublishedAt: "2026-08-21T09:45:00+01:00",
        discoveredAt: "2026-08-21T16:02:00+08:00",
        freshness: "new_since_last_digest",
        changeType: "new",
        importance: 73,
        confidence: 0.68,
        sources: ["src-eco-1"],
        prior: [],
        changeSummaryZh: "新出现的交易/战略线索，证据层级暂不如官方披露。",
      },
      {
        id: "evt-calb-sines-context",
        titleZh: "CALB Sines 项目仍是中资在葡产业投资的重点观察线",
        factZh: "YouTube 访谈提及 Sines 电池项目建设与就业承诺，但没有形成足以改变既有判断的新里程碑。",
        whyZh: "该信息用于解释中资产业投资背景，不应被写成今日重大新增。",
        eventType: "china_portugal",
        topics: ["china_in_portugal"],
        entities: ["calb"],
        eventDate: "2026-08-20",
        firstPublishedAt: "2026-08-20T18:20:00+01:00",
        discoveredAt: "2026-08-21T13:10:00+08:00",
        freshness: "recent_context",
        changeType: "reinforces",
        importance: 48,
        confidence: 0.62,
        sources: ["src-yt-1"],
        prior: ["evt-calb-sines-baseline"],
        changeSummaryZh: "强化既有项目线索，但不是新今日事件。",
      },
    ],
    memoryNodes: [
      { id: "market-pt", type: "market", name: "Portugal", summary: "葡萄牙市场当前重点仍集中在金融资产股权、保险渠道、官方宏观数据与中资产业项目。今日看点偏金融股权与保险渠道，而非一般政治新闻。", evidence: ["evt-bcp-stake", "evt-cgd-insurance"] },
      { id: "topic-banking", type: "topic", name: "Portuguese banking", summary: "BCP 与 CGD 是当前银行主线；BCP 的股权/资本披露对复星资产判断有放大影响。", evidence: ["evt-bcp-stake"] },
      { id: "topic-insurance", type: "topic", name: "Portuguese insurance", summary: "Fidelidade 与 bancassurance 渠道变化是保险侧优先观察点；媒体报道需等待官方或监管验证。", evidence: ["evt-cgd-insurance"] },
      { id: "entity-calb", type: "entity", name: "CALB / Sines", summary: "CALB Sines 仍是中资产业投资主线；当前新视频只提供背景强化，未改变项目判断。", evidence: ["evt-calb-sines-context"] },
    ],
  };

  const topicLabels = {
    politics_policy: "政治 / 政策 / 监管",
    macro: "宏观与金融环境",
    banking: "银行",
    insurance: "保险",
    fosun_portugal: "复星在葡资产",
    china_in_portugal: "中资与产业投资",
    capital_markets_mna: "资本市场 / 交易",
  };

  const freshnessLabels = {
    new_today: "今日新增",
    new_since_last_digest: "上次简报后新增",
    recent_context: "近期背景",
    background: "背景",
  };

  const compactFreshnessLabels = {
    new_today: "今日",
    new_since_last_digest: "新增",
    recent_context: "背景",
    background: "存档",
  };

  const $ = (id) => document.getElementById(id);
  const state = loadState();
  let serverStatus = null;
  let activeMemory = state.memoryNodes[0]?.id || "";

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || seed;
    } catch (error) {
      return seed;
    }
  }

  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtDate(value) {
    if (!value) return "时间未知";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `请求失败 (${response.status})`);
    return data;
  }

  function localStatus() {
    return {
      ready: false,
      coverageState: "local",
      configuredEnv: [],
      missingEnv: envNames,
      marketTimezone: "Europe/Lisbon",
      deliveryTimezone: "Asia/Shanghai",
      model: "gemini-3.7-flash",
      demoCounts: { candidates: state.sources.length * 14 + 1, read: state.sources.length * 3 + 2 },
      localFallback: true,
    };
  }

  function localAction(action) {
    state.lastRunAt = new Date().toISOString();
    if (action === "discovery") {
      state.coverage.state = "local_complete";
      return {
        ok: true,
        configured: false,
        localFallback: true,
        message: "本地测试扫描已完成：候选来源、事件去重、来源库和记忆链路均可交互；接入 Vercel/Supabase 后将替换为真实发现流水线。",
      };
    }
    if (action === "digest") {
      state.digestGeneratedAt = new Date().toISOString();
      return {
        ok: true,
        configured: false,
        localFallback: true,
        message: "本地测试简报已生成：每日推送结构、安静日规则和覆盖页脚可验证；配置 Resend 后发送真实邮件。",
      };
    }
    return { ok: true, localFallback: true, message: "本地测试操作已完成。" };
  }

  function sourceById(id) {
    return state.sources.find((source) => source.id === id);
  }

  function topicName(slug) {
    return topicLabels[slug] || state.topics.find((topic) => topic.slug === slug)?.name || slug;
  }

  function renderCoverage() {
    const configured = new Set(serverStatus?.configuredEnv || []);
    const missing = serverStatus?.missingEnv || [];
    const complete = missing.length === 0;
    const local = Boolean(serverStatus?.localFallback);
    $("healthDot").className = `health-dot ${complete ? "complete" : local ? "local" : "partial"}`;
    $("coverageState").textContent = complete ? "覆盖完整" : local ? "本地测试模式" : "覆盖部分缺失";
    $("coverageMeta").textContent = complete
      ? "官方源、Tavily、YouTube、Gemini、Resend 已配置"
      : local
        ? "当前静态预览未接入 Vercel Functions，已启用本地可测试流程"
        : `缺少 ${missing.length || envNames.length} 个环境变量；当前展示本地示例数据`;
    $("lastRunText").textContent = `最近发现：${state.lastRunAt ? fmtDate(state.lastRunAt) : "尚未运行"}`;
    renderEnv(configured);
  }

  function renderToday() {
    $("briefDate").textContent = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    const material = state.events.filter((event) => event.importance >= 55 && event.freshness === "new_since_last_digest").sort((a, b) => b.importance - a.importance);
    const digestStamp = state.digestGeneratedAt ? ` <span class="muted">生成于 ${fmtDate(state.digestGeneratedAt)}</span>` : "";
    $("oneLine").innerHTML = material.length
      ? `<strong>一句话结论：</strong>今日葡萄牙情报重点在金融资产与保险渠道变化，${escapeHtml(material[0].titleZh)}。`
      : "<strong>一句话结论：</strong>今日未发现足以改变现有判断的重大新增；请同时查看覆盖状态是否完整。";
    $("oneLine").innerHTML += digestStamp;
    $("majorEvents").innerHTML = material.slice(0, 5).map(eventCardHtml).join("") || `<p class="muted">今日无重大新增。安静日不会用旧背景填充日报。</p>`;
    $("funnel").innerHTML = [
      ["候选来源", serverStatus?.demoCounts?.candidates ?? 43],
      ["实际阅读", serverStatus?.demoCounts?.read ?? 11],
      ["有效事件", state.events.length],
      ["进入简报", material.length],
    ].map(([label, value]) => `<div class="funnel-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
    $("memoryPreview").innerHTML = state.memoryNodes.slice(0, 3).map((node) => `
      <article class="memory-preview-item">
        <h3>${escapeHtml(node.name)}</h3>
        <p>${escapeHtml(node.summary)}</p>
      </article>
    `).join("");
    renderCategories();
  }

  function eventCardHtml(event) {
    const primary = sourceById(event.sources[0]);
    const majorClass = event.importance >= 80 ? "major" : event.changeType;
    return `
      <article class="event-row" data-event="${escapeHtml(event.id)}">
        <div class="event-labels">
          <span class="badge ${escapeHtml(event.freshness)} ${escapeHtml(majorClass)}">${escapeHtml(compactFreshnessLabels[event.freshness] || event.freshness)}</span>
          <span class="small-tag">${escapeHtml(event.changeType)}</span>
        </div>
        <div>
          <h3>${escapeHtml(event.titleZh)}</h3>
          <p>${escapeHtml(event.factZh)}</p>
          <p class="event-meta">${escapeHtml(topicName(event.topics[0]))} · ${escapeHtml(primary?.publisher || "来源未知")} · ${fmtDate(event.firstPublishedAt)} · <a class="source-link" href="${escapeHtml(primary?.url || "#")}" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a></p>
        </div>
        <div class="event-score">${event.importance}/100</div>
      </article>
    `;
  }

  function renderCategories() {
    $("categoryGrid").innerHTML = state.topics.filter((topic) => topic.active).map((topic) => {
      const events = state.events.filter((event) => event.topics.includes(topic.slug) && event.importance >= 55);
      return `
        <section class="category-section">
          <h2>${escapeHtml(topic.name)}</h2>
          ${events.length ? `<ul>${events.map((event) => `<li>${escapeHtml(event.titleZh)}</li>`).join("")}</ul>` : `<p class="muted">今日未发现重大新增。</p>`}
        </section>
      `;
    }).join("");
  }

  function renderFilters() {
    $("topicFilter").innerHTML = `<option value="">全部主题</option>${state.topics.map((topic) => `<option value="${escapeHtml(topic.slug)}">${escapeHtml(topic.name)}</option>`).join("")}`;
    $("freshnessFilter").innerHTML = `<option value="">全部新鲜度</option>${Object.entries(freshnessLabels).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}`;
  }

  function renderEvents() {
    const query = $("globalSearch").value.trim().toLowerCase();
    const topic = $("topicFilter").value;
    const freshness = $("freshnessFilter").value;
    const minImportance = Number($("importanceFilter").value || 0);
    const events = state.events.filter((event) => {
      const haystack = `${event.titleZh} ${event.factZh} ${event.whyZh} ${event.entities.join(" ")} ${event.topics.join(" ")}`.toLowerCase();
      return (!query || haystack.includes(query)) && (!topic || event.topics.includes(topic)) && (!freshness || event.freshness === freshness) && event.importance >= minImportance;
    });
    $("eventLedger").innerHTML = events.map((event) => {
      const sources = event.sources.map(sourceById).filter(Boolean);
      return `
        <article class="ledger-card">
          <div>
            <span class="badge ${escapeHtml(event.freshness)}">${escapeHtml(freshnessLabels[event.freshness] || event.freshness)}</span>
            <p class="muted">${fmtDate(event.firstPublishedAt)}</p>
          </div>
          <div>
            <h2>${escapeHtml(event.titleZh)}</h2>
            <p>${escapeHtml(event.factZh)}</p>
            <p><strong>为什么重要：</strong>${escapeHtml(event.whyZh || "暂无")}</p>
            <p class="muted">变化：${escapeHtml(event.changeSummaryZh || event.changeType)} · 来源 ${sources.length} 个</p>
          </div>
          <div class="ledger-actions">
            <strong>${event.importance}/100</strong>
            <button class="secondary-btn" data-open-event="${escapeHtml(event.id)}" type="button">查看依据</button>
          </div>
        </article>
      `;
    }).join("") || `<p class="muted">没有匹配事件。</p>`;
    document.querySelectorAll("[data-open-event]").forEach((button) => button.addEventListener("click", () => openEvent(button.dataset.openEvent)));
  }

  function renderSources() {
    const query = $("globalSearch").value.trim().toLowerCase();
    const rows = state.sources.filter((source) => !query || `${source.title} ${source.summaryZh} ${source.publisher} ${source.topic}`.toLowerCase().includes(query));
    $("sourceRows").innerHTML = rows.map((source) => {
      const events = state.events.filter((event) => event.sources.includes(source.id));
      return `
        <tr>
          <td><strong>${escapeHtml(source.title)}</strong><br><span class="muted">${escapeHtml(source.summaryZh)}</span></td>
          <td>${escapeHtml(source.publisher)}<br><span class="muted">Tier ${source.tier} · ${escapeHtml(source.language)}</span></td>
          <td>${escapeHtml(source.type)}</td>
          <td>${escapeHtml(topicName(source.topic))}</td>
          <td>${events.map((event) => escapeHtml(event.titleZh)).join("<br>") || "未形成事件"}</td>
          <td><a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a></td>
        </tr>
      `;
    }).join("");
  }

  function renderMemory() {
    $("memoryTabs").innerHTML = state.memoryNodes.map((node) => `<button class="memory-tab ${node.id === activeMemory ? "active" : ""}" data-memory="${escapeHtml(node.id)}" type="button">${escapeHtml(node.name)}</button>`).join("");
    document.querySelectorAll("[data-memory]").forEach((button) => button.addEventListener("click", () => {
      activeMemory = button.dataset.memory;
      renderMemory();
    }));
    const node = state.memoryNodes.find((item) => item.id === activeMemory) || state.memoryNodes[0];
    const evidence = (node?.evidence || []).map((id) => state.events.find((event) => event.id === id)).filter(Boolean);
    $("memoryBoard").innerHTML = `
      <section class="memory-card">
        <p class="section-label">${escapeHtml(node?.type || "")}</p>
        <h2>${escapeHtml(node?.name || "暂无记忆")}</h2>
        <p>${escapeHtml(node?.summary || "暂无可靠信息")}</p>
      </section>
      <section class="evidence-card">
        <h2>支持依据</h2>
        <div class="evidence-grid">
          ${evidence.map((event) => `<article><h3>${escapeHtml(event.titleZh)}</h3><p>${escapeHtml(event.changeSummaryZh || event.factZh)}</p><button class="secondary-btn" data-open-event="${escapeHtml(event.id)}" type="button">Event → Source</button></article>`).join("") || "<p class='muted'>暂无依据。</p>"}
        </div>
      </section>
    `;
    document.querySelectorAll("[data-open-event]").forEach((button) => button.addEventListener("click", () => openEvent(button.dataset.openEvent)));
  }

  function renderSettings() {
    const config = loadConfig();
    $("digestEmail").value = config.digestEmail || "";
    $("deliveryTimezone").value = config.deliveryTimezone || "Asia/Shanghai";
    $("marketTimezone").value = config.marketTimezone || "Europe/Lisbon";
    $("digestTime").value = config.digestTime || "08:30";
    $("digestImportance").value = config.digestImportance || 55;
    $("topicList").innerHTML = state.topics.map((topic) => `
      <article class="config-item">
        <h3>${escapeHtml(topic.name)} <span class="muted">${topic.active ? "active" : "inactive"} · P${topic.priority}</span></h3>
        <p>${escapeHtml(topic.purpose)}</p>
        <div class="keyword-list">${topic.keywords.map((kw) => `<span class="chip">${escapeHtml(kw)}</span>`).join("")}</div>
      </article>
    `).join("");
    $("entityList").innerHTML = state.entities.map((entity) => `
      <article class="config-item">
        <h3>${escapeHtml(entity.name)} <span class="muted">${escapeHtml(entity.type)} · P${entity.priority}</span></h3>
        <div class="keyword-list">${entity.aliases.map((alias) => `<span class="chip">${escapeHtml(alias)}</span>`).join("")}</div>
      </article>
    `).join("");
  }

  function renderEnv(configured) {
    $("envList").innerHTML = envNames.map((name) => `<dt>${name}</dt><dd>${configured.has(name) ? "已配置" : "未配置"}</dd>`).join("");
  }

  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  function openEvent(id) {
    const event = state.events.find((item) => item.id === id);
    if (!event) return;
    const sources = event.sources.map(sourceById).filter(Boolean);
    $("drawerKicker").textContent = "事件依据";
    $("drawerTitle").textContent = event.titleZh;
    $("drawerBody").innerHTML = `
      <section class="drawer-section"><h3>事实</h3><p>${escapeHtml(event.factZh)}</p></section>
      <section class="drawer-section"><h3>为什么重要</h3><p>${escapeHtml(event.whyZh || "暂无")}</p></section>
      <section class="drawer-section"><h3>变化判断</h3><p>${escapeHtml(event.changeSummaryZh || event.changeType)}</p><p class="muted">freshness=${escapeHtml(event.freshness)} · confidence=${event.confidence}</p></section>
      <section class="drawer-section"><h3>原始来源</h3>${sources.map((source) => `<p><strong>${escapeHtml(source.publisher)}</strong> · ${fmtDate(source.publishedAt)}<br><a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${source.type === "official" ? "查看官方公告" : source.type === "youtube" ? "查看原视频" : "阅读原文"} ↗</a></p>`).join("")}</section>
    `;
    $("drawer").classList.add("open");
    $("drawer").setAttribute("aria-hidden", "false");
  }

  function bind() {
    document.querySelectorAll(".nav-btn").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      $(`${button.dataset.view}View`).classList.add("active");
    }));
    ["globalSearch", "topicFilter", "freshnessFilter", "importanceFilter"].forEach((id) => $(id).addEventListener("input", () => {
      renderEvents();
      renderSources();
    }));
    $("closeDrawerBtn").addEventListener("click", () => {
      $("drawer").classList.remove("open");
      $("drawer").setAttribute("aria-hidden", "true");
    });
    $("runDiscoveryBtn").addEventListener("click", () => runAction("discovery"));
    $("runDigestBtn").addEventListener("click", () => runAction("digest"));
    $("saveDigestBtn").addEventListener("click", () => {
      saveConfig({
        digestEmail: $("digestEmail").value.trim(),
        deliveryTimezone: $("deliveryTimezone").value.trim() || "Asia/Shanghai",
        marketTimezone: $("marketTimezone").value.trim() || "Europe/Lisbon",
        digestTime: $("digestTime").value || "08:30",
        digestImportance: Number($("digestImportance").value || 55),
      });
      $("coverageMeta").textContent = "每日推送偏好已保存到本机；生产发送仍以 Vercel 环境变量和 Supabase 设置为准。";
    });
    $("addTopicBtn").addEventListener("click", () => openConfigDialog("topic"));
    $("addEntityBtn").addEventListener("click", () => openConfigDialog("entity"));
    $("configForm").addEventListener("submit", saveConfigDialog);
  }

  function openConfigDialog(mode) {
    $("dialogTitle").textContent = mode === "topic" ? "添加 Watch Topic" : "添加 Entity";
    $("configForm").elements.mode.value = mode;
    $("configDialog").showModal();
  }

  function saveConfigDialog(event) {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const form = $("configForm");
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const description = String(data.get("description") || "").trim();
    const keywords = String(data.get("keywords") || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || `item_${Date.now()}`;
    if (data.get("mode") === "topic") {
      state.topics.push({ slug, name, priority: 60, active: true, purpose: description || "自定义查询主题", keywords });
    } else {
      state.entities.push({ slug, name, type: "tracked", priority: 60, active: true, aliases: keywords.length ? keywords : [description].filter(Boolean) });
    }
    saveState();
    form.reset();
    $("configDialog").close();
    renderAll();
  }

  async function runAction(action) {
    try {
      const result = await fetchJson(`${API_BASE}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      state.lastRunAt = new Date().toISOString();
      saveState();
      $("coverageMeta").textContent = result.message || "操作已记录";
      renderAll();
    } catch (error) {
      const result = localAction(action);
      serverStatus = localStatus();
      saveState();
      renderAll();
      $("coverageMeta").textContent = `${result.message}（API 返回 ${error.message}，已自动切换本地流程）`;
    }
  }

  function renderAll() {
    renderCoverage();
    renderToday();
    renderFilters();
    renderEvents();
    renderSources();
    renderMemory();
    renderSettings();
  }

  async function init() {
    bind();
    try {
      serverStatus = await fetchJson(`${API_BASE}/status`);
    } catch (error) {
      serverStatus = localStatus();
    }
    renderAll();
  }

  init();
})();
