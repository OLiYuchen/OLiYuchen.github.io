/* ============================================================
   notes-import.js — Markdown → note HTML, seed notes, and the
   "import markdown" UI.

   The knowledge bank grows by dropping .md files into
   intern/notes/ and listing them in manifest.json. On first run
   (per stable note id, tracked in localStorage) each is converted
   and inserted as a note. Faithful to the source markdown — it
   only renders, it never rewrites numbers or facts.

   Three figures in the seed report are recreated as inline HTML
   (crisp, theme-tolerant, exact to the source) and swapped in
   wherever the markdown references them by filename via DIAGRAMS.
   ============================================================ */

/* ---------- inline diagrams (replace ![..](figname) refs) ---------- */
const DIAGRAMS = {
  // §2 — how the consumer premium (GWP) splits across the 4 roles
  "图_保费分配.png": `
    <div class="diagram diagram-gwp" contenteditable="false">
      <div class="dg-top">消费者支付的保费总额 <span class="dg-sub">行业称 GWP，100%</span></div>
      <div class="dg-arrows"><span></span><span></span><span></span><span></span></div>
      <div class="dg-row">
        <div class="dg-box dg-teal"><b>承保方</b><span class="dg-pct">75–85%</span><span class="dg-note">承担赔付风险</span></div>
        <div class="dg-box dg-pink"><b>联合中介</b><span class="dg-pct">8–13%</span><span class="dg-note">车企合资持有</span></div>
        <div class="dg-box dg-pink"><b>MGA 平台</b><span class="dg-pct">4–8%</span><span class="dg-note">技术与运营</span></div>
        <div class="dg-box dg-pink"><b>经销商</b><span class="dg-pct">3–6%</span><span class="dg-note">卖出保单</span></div>
      </div>
    </div>`,

  // §5 — TAM / SAM funnel
  "图_TAM_SAM漏斗.png": `
    <div class="diagram diagram-funnel" contenteditable="false">
      <div class="df-tier df-blue" style="width:100%">
        <b>TAM 总可服务市场 · 约 €50亿</b>
        <span class="df-note">2030年中国电动车在欧洲对应的全部车险保费</span>
      </div>
      <div class="df-tier df-teal" style="width:78%">
        <b>SAM 战略可获取市场 · €8–22亿</b>
        <span class="df-note">复星四条战略现实能触达的部分</span>
      </div>
      <div class="df-tier df-pink" style="width:52%">
        <b>真正能拿下的份额</b>
        <span class="df-note">取决于执行 · 报告未给数</span>
      </div>
    </div>`,

  // §8 — the "3+1" strategy
  "图_3plus1战略.png": `
    <div class="diagram diagram-strategy" contenteditable="false">
      <div class="ds-group">短中期 · "3"</div>
      <div class="ds-card ds-teal">
        <div class="ds-title">战略1 · 核心市场承保方</div>
        <div class="ds-body">在自己强的地盘直接当保险公司：葡萄牙（现在）、西班牙（潜在）</div>
        <div class="ds-meta">角色：承保方 · 渠道 B2B2C · SAM €1–5亿 · 最容易，立刻能做</div>
      </div>
      <div class="ds-card ds-teal">
        <div class="ds-title">战略2 · 泛欧 MGA</div>
        <div class="ds-body">收购一个MGA平台，服务尚无独家保险伙伴的车企（奇瑞、上汽、广汽等）</div>
        <div class="ds-meta">角色：MGA平台 · 渠道 B2B2C · SAM €4–9亿 · 需并购、是主要商业化引擎</div>
      </div>
      <div class="ds-card ds-teal">
        <div class="ds-title">战略3 · 车队/租赁生意</div>
        <div class="ds-body">和车企、租赁公司三方合作，解决残值痛点，打开B2B渠道</div>
        <div class="ds-meta">角色：承保方 · 渠道 B2B · SAM €4–11亿 · 潜力最大但最依赖能力搭建</div>
      </div>
      <div class="ds-group">长期 · "+1"</div>
      <div class="ds-card ds-pink">
        <div class="ds-title">+1 · 与顶级车企合资（JV / 自保公司）</div>
        <div class="ds-body">前三条建立信任后，再深度绑定一家头部车企，锁定长期规模</div>
        <div class="ds-meta">实施复杂度最高 · 需前期合作先跑通</div>
      </div>
    </div>`,
};

/* ---------- minimal Markdown → HTML ---------- */
function mdEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Inline formatting on an already-escaped string.
function mdInline(s) {
  return s
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+?)`/g, "<code>$1</code>");
}
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function mdToHtml(md) {
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let para = [];
  let i = 0;
  const flush = () => {
    if (para.length) {
      html += "<p>" + mdInline(mdEscape(para.join(" "))) + "</p>";
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (/^```/.test(line)) {
      flush();
      i++;
      const code = [];
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      i++;
      html += "<pre><code>" + mdEscape(code.join("\n")) + "</code></pre>";
      continue;
    }
    // blank
    if (/^\s*$/.test(line)) { flush(); i++; continue; }
    // horizontal rule
    if (/^---+\s*$/.test(line)) { flush(); html += "<hr>"; i++; continue; }
    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flush(); const lv = h[1].length; html += `<h${lv}>${mdInline(mdEscape(h[2]))}</h${lv}>`; i++; continue; }
    // standalone image (→ inline diagram if known)
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (img) {
      flush();
      const src = img[2];
      html += DIAGRAMS[src] ||
        `<figure class="md-fig"><img src="${mdEscape(src)}" alt="${mdEscape(img[1])}" loading="lazy"><figcaption>${mdEscape(img[1])}</figcaption></figure>`;
      i++;
      continue;
    }
    // blockquote
    if (/^>\s?/.test(line)) {
      flush();
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
      html += "<blockquote>" + mdInline(mdEscape(q.join(" "))) + "</blockquote>";
      continue;
    }
    // table: header row + separator row
    if (line.trim().startsWith("|") && i + 1 < lines.length &&
        lines[i + 1].includes("|") && /-/.test(lines[i + 1])) {
      flush();
      const head = splitRow(line);
      i += 2; // skip header + separator
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { body.push(splitRow(lines[i])); i++; }
      html += "<table><thead><tr>" +
        head.map((c) => `<th>${mdInline(mdEscape(c))}</th>`).join("") +
        "</tr></thead><tbody>" +
        body.map((r) => "<tr>" + r.map((c) => `<td>${mdInline(mdEscape(c))}</td>`).join("") + "</tr>").join("") +
        "</tbody></table>";
      continue;
    }
    // unordered list
    if (/^[-*]\s+/.test(line)) {
      flush();
      html += "<ul>";
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        html += "<li>" + mdInline(mdEscape(lines[i].replace(/^[-*]\s+/, ""))) + "</li>";
        i++;
      }
      html += "</ul>";
      continue;
    }
    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      flush();
      html += "<ol>";
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        html += "<li>" + mdInline(mdEscape(lines[i].replace(/^\d+\.\s+/, ""))) + "</li>";
        i++;
      }
      html += "</ol>";
      continue;
    }
    // paragraph text
    para.push(line);
    i++;
  }
  flush();
  return html;
}

/* ---------- seed notes from manifest ---------- */
const SEED_PREFIX = "intern.seeded.";

async function seedNotes() {
  let manifest;
  try {
    const res = await fetch("/intern/notes/manifest.json", { cache: "no-cache" });
    if (!res.ok) return;
    manifest = await res.json();
  } catch (e) {
    return; // no manifest / offline — nothing to seed, app still works
  }
  for (const entry of manifest.notes || []) {
    const flagKey = SEED_PREFIX + entry.id;
    if (localStorage.getItem(flagKey)) continue;          // already seeded once
    if (await Store.get("notes", entry.id)) {             // already present
      localStorage.setItem(flagKey, "1");
      continue;
    }
    try {
      const md = await (await fetch(`/intern/notes/${entry.file}`, { cache: "no-cache" })).text();
      const now = new Date().toISOString();
      await Store.put("notes", {
        id: entry.id,
        title: entry.title || "",
        body: mdToHtml(md),
        stickies: [],
        seeded: true,
        createdAt: now,
        updatedAt: now,
      });
      localStorage.setItem(flagKey, "1");
    } catch (e) {
      // skip this one; others and the app continue normally
    }
  }
}

/* ---------- import-markdown modal (paste future notes yourself) ---------- */
function openImportModal(onCreated) {
  if (document.getElementById("mdImportOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "mdImportOverlay";
  overlay.className = "md-import-overlay";
  overlay.innerHTML = `
    <div class="md-import-card">
      <div class="md-import-head">
        <span>导入 Markdown 笔记</span>
        <button class="md-import-close" aria-label="关闭">×</button>
      </div>
      <input class="md-import-title" type="text" placeholder="标题（留空则用第一行 # 标题）" />
      <textarea class="md-import-body" placeholder="把 Markdown 粘到这里…支持标题、表格、列表、引用、代码块、图片。"></textarea>
      <div class="md-import-foot">
        <button class="md-import-cancel">取消</button>
        <button class="md-import-do">导入</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector(".md-import-close").addEventListener("click", close);
  overlay.querySelector(".md-import-cancel").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  overlay.querySelector(".md-import-do").addEventListener("click", async () => {
    const md = overlay.querySelector(".md-import-body").value.trim();
    if (!md) { close(); return; }
    let title = overlay.querySelector(".md-import-title").value.trim();
    if (!title) {
      const m = md.match(/^#\s+(.+)$/m);
      title = m ? m[1].trim() : "未命名笔记";
    }
    const now = new Date().toISOString();
    const rec = { id: Store.uid(), title, body: mdToHtml(md), stickies: [], createdAt: now, updatedAt: now };
    await Store.put("notes", rec);
    close();
    if (onCreated) onCreated(rec.id);
  });
}

window.NotesImport = { mdToHtml, seedNotes, openImportModal };
