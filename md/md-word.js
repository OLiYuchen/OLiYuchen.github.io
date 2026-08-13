(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const PRESETS = {
    research: {
      label: "研究报告",
      fonts: { ascii: "Aptos", eastAsia: "Microsoft YaHei" },
      colors: { ink: "17201D", body: "35413D", gray: "68736F", accent: "246455", line: "CCD6D2", bg: "EDF4F1" },
      sizes: { title: 44, eyebrow: 18, subtitle: 24, meta: 18, h1: 28, h2: 23, h3: 20, body: 20, callout: 19, table: 18, caption: 17, header: 16, page: 16 },
      spacing: { line: 290, heading: 270, table: 270, paraAfter: 130, h1Before: 280, h1After: 120, h2Before: 210, h2After: 85, h3Before: 150, h3After: 65 }
    },
    memo: {
      label: "简洁备忘录",
      fonts: { ascii: "Aptos", eastAsia: "Microsoft YaHei" },
      colors: { ink: "1D2329", body: "3F4850", gray: "717B84", accent: "4C6574", line: "D6DDE1", bg: "F3F6F7" },
      sizes: { title: 40, eyebrow: 17, subtitle: 22, meta: 17, h1: 26, h2: 22, h3: 20, body: 20, callout: 19, table: 18, caption: 17, header: 15, page: 16 },
      spacing: { line: 278, heading: 264, table: 260, paraAfter: 110, h1Before: 230, h1After: 100, h2Before: 170, h2After: 75, h3Before: 130, h3After: 60 }
    },
    formal: {
      label: "正式交付件",
      fonts: { ascii: "Arial", eastAsia: "Microsoft YaHei" },
      colors: { ink: "152A3A", body: "334652", gray: "6B7881", accent: "245277", line: "C9D3DA", bg: "EEF3F6" },
      sizes: { title: 46, eyebrow: 18, subtitle: 24, meta: 18, h1: 28, h2: 23, h3: 20, body: 20, callout: 19, table: 18, caption: 17, header: 16, page: 16 },
      spacing: { line: 294, heading: 275, table: 272, paraAfter: 135, h1Before: 290, h1After: 125, h2Before: 215, h2After: 90, h3Before: 155, h3After: 65 }
    }
  };

  const PAGE = {
    width: 11906,
    height: 16838,
    margin: { top: 1220, bottom: 1120, left: 1120, right: 1120, header: 650, footer: 620 },
    contentWidth: 9666
  };

  let wordBlob = null;
  let wordName = "";
  let currentMarkdown = null;
  let currentAssets = [];
  let previewUrls = [];
  let generationId = 0;
  let rebuildTimer = null;

  function parseFrontMatter(source) {
    const meta = {};
    let body = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const match = body.match(/^---\n([\s\S]*?)\n---\n?/);
    if (match) {
      match[1].split("\n").forEach((line) => {
        const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (pair) meta[pair[1]] = pair[2].trim().replace(/^(["'])(.*)\1$/, "$2");
      });
      body = body.slice(match[0].length);
    }
    return { meta, body };
  }

  function splitTableRow(line) {
    const cells = [];
    let current = "";
    let escaped = false;
    const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    for (const char of value) {
      if (escaped) {
        current += char;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
        current += char;
      } else if (char === "|") {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  function parseMarkdown(source) {
    const { meta, body } = parseFrontMatter(source);
    const lines = body.split("\n");
    const blocks = [];
    let index = 0;
    let tableOptions = null;
    const isTable = (line = "") => /^\s*\|.*\|\s*$/.test(line);
    const beginsBlock = (line = "") => /^(#{1,3}\s|>\s?|!\[|\s*\||[-*]\s+|\d+[.)]\s+|\\pagebreak\s*$|\{.*\}\s*$)/.test(line);

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) { index += 1; continue; }
      let match;

      if (/^\{.*\}$/.test(line.trim()) && isTable(lines[index + 1])) {
        tableOptions = line.trim(); index += 1; continue;
      }
      if (line.trim() === "\\pagebreak") {
        blocks.push({ type: "pagebreak" }); index += 1; continue;
      }
      if ((match = line.match(/^(#{1,3})\s+(.*)$/))) {
        blocks.push({ type: "heading", level: match[1].length, text: match[2].replace(/\*\*/g, "").trim() }); index += 1; continue;
      }
      if ((match = line.match(/^!\[(.*?)\]\((.*?)\)(?:\{(.*?)\})?\s*$/))) {
        const options = {};
        (match[3] || "").split(/\s+/).forEach((item) => {
          const [key, value] = item.split("=");
          if (key && value) options[key] = value;
        });
        blocks.push({ type: "image", caption: match[1], src: match[2], width: Math.min(620, Math.max(180, Number(options.width) || 520)) });
        index += 1; continue;
      }
      if (/^>\s?/.test(line)) {
        const value = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          value.push(lines[index].replace(/^>\s?/, "")); index += 1;
        }
        blocks.push({ type: "callout", text: value.join(" ").trim() }); continue;
      }
      if (isTable(line)) {
        const raw = [];
        while (index < lines.length && isTable(lines[index])) { raw.push(lines[index]); index += 1; }
        const rows = raw.map(splitTableRow);
        const separator = rows.findIndex((row) => row.every((cell) => /^:?-{2,}:?$/.test(cell)));
        let header = null;
        let data = rows;
        if (separator > 0) { header = rows[separator - 1]; data = rows.slice(separator + 1); }
        const options = {};
        (tableOptions || "").replace(/[{}]/g, "").split(/\s+/).forEach((item) => {
          const [key, value] = item.split("=");
          if (key) options[key] = value === undefined ? true : value;
        });
        if (options.noheader || (header && header.every((cell) => !cell))) header = null;
        blocks.push({ type: "table", header, rows: data, columns: options.cols ? String(options.cols).split(",").map(Number) : null });
        tableOptions = null; continue;
      }
      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^[-*]\s+/, "")); index += 1;
        }
        blocks.push({ type: "unordered", items }); continue;
      }
      if (/^\d+[.)]\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^\d+[.)]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^\d+[.)]\s+/, "")); index += 1;
        }
        blocks.push({ type: "ordered", items }); continue;
      }

      const paragraph = [];
      while (index < lines.length && lines[index].trim() && !beginsBlock(lines[index])) {
        paragraph.push(lines[index].trim()); index += 1;
      }
      if (!paragraph.length) {
        paragraph.push(line.trim()); index += 1;
      }
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    }
    return { meta, blocks };
  }

  function basename(path) {
    return decodeURIComponent(String(path).split(/[?#]/)[0]).replace(/\\/g, "/").split("/").pop();
  }

  function imageDimensions(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes[0] === 0x89 && String.fromCharCode(...bytes.slice(1, 4)) === "PNG") {
      return [view.getUint32(16), view.getUint32(20)];
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) { offset += 1; continue; }
        const marker = bytes[offset + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return [view.getUint16(offset + 7), view.getUint16(offset + 5)];
        }
        const length = view.getUint16(offset + 2);
        if (!length) break;
        offset += 2 + length;
      }
    }
    throw new Error("无法读取图片尺寸");
  }

  function fontConfig(style) {
    return { ascii: style.fonts.ascii, hAnsi: style.fonts.ascii, eastAsia: style.fonts.eastAsia, cs: style.fonts.ascii };
  }

  async function buildDocx(markdownFile, assetFiles, options) {
    if (!window.docx) throw new Error("Word 生成组件加载失败，请检查网络后刷新。");
    const {
      AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat,
      PageBreak, PageNumber, Packer, Paragraph, ShadingType, Table, TableCell, TableOfContents,
      TableRow, TextRun, WidthType
    } = window.docx;

    const style = PRESETS[options.style] || PRESETS.research;
    const F = fontConfig(style);
    const C = style.colors;
    const Z = style.sizes;
    const SP = style.spacing;
    const source = await markdownFile.text();
    const parsed = parseMarkdown(source);
    const assets = new Map();
    for (const file of assetFiles) assets.set(file.name, file);
    const children = [];
    const warningList = [];

    const textRun = (text, settings = {}) => new TextRun({
      text,
      font: F,
      size: settings.size || Z.body,
      bold: settings.bold,
      italics: settings.italics,
      color: settings.color || C.body,
      break: settings.break
    });

    const inline = (text, settings = {}) => {
      const parts = String(text).split(/(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
      return parts.map((part) => {
        if (part.startsWith("**")) return textRun(part.slice(2, -2), { ...settings, bold: true, color: C.ink });
        if (part.startsWith("*") && part.endsWith("*")) return textRun(part.slice(1, -1), { ...settings, italics: true });
        if (part.startsWith("`") && part.endsWith("`")) return textRun(part.slice(1, -1), { ...settings, color: C.accent });
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) return textRun(`${link[1]} (${link[2]})`, { ...settings, color: C.accent });
        return textRun(part, settings);
      });
    };

    const paragraph = (runs, settings = {}) => new Paragraph({
      children: runs,
      alignment: settings.alignment,
      keepNext: settings.keepNext,
      pageBreakBefore: settings.pageBreakBefore,
      spacing: {
        before: settings.before ?? 0,
        after: settings.after ?? SP.paraAfter,
        line: settings.line || SP.line,
        lineRule: "auto"
      },
      indent: settings.indent,
      shading: settings.shading,
      border: settings.border,
      numbering: settings.numbering
    });

    const titleMeta = parsed.meta;
    const fallbackTitle = markdownFile.name.replace(/\.md$/i, "");
    const documentTitle = titleMeta.title || fallbackTitle;
    if (titleMeta.eyebrow) children.push(paragraph([textRun(titleMeta.eyebrow, { size: Z.eyebrow, bold: true, color: C.accent })], { after: 45 }));
    children.push(paragraph([textRun(documentTitle, { size: Z.title, bold: true, color: C.ink })], { after: 45, line: SP.heading }));
    if (titleMeta.subtitle) children.push(paragraph([textRun(titleMeta.subtitle, { size: Z.subtitle, color: C.gray })], { after: 140, line: SP.heading }));
    children.push(new Paragraph({
      children: [textRun("", { size: 2 })],
      spacing: { before: 10, after: 170 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.ink, space: 4 } }
    }));
    if (titleMeta.meta) children.push(paragraph([textRun(titleMeta.meta, { size: Z.meta, color: C.gray })], { after: 100 }));

    const headings = parsed.blocks.filter((block) => block.type === "heading");
    if (options.toc && headings.length >= 2) {
      children.push(paragraph([textRun("目录", { size: Z.h2, bold: true, color: C.ink })], { before: 160, after: 80, keepNext: true }));
      children.push(new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }));
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    const appendixWords = ["附录", "Anhang", "Appendix", "Annex"];
    const numberPattern = new RegExp(`^((?:${appendixWords.join("|")})\\s+[A-Za-z0-9.]+|[0-9]+(?:\\.[0-9]+)*)[.、]?\\s+(.*)$`);
    let headingIndex = 0;
    const renderHeading = (block) => {
      const match = block.text.match(numberPattern);
      const size = block.level === 1 ? Z.h1 : block.level === 2 ? Z.h2 : Z.h3;
      const runs = match
        ? [textRun(`${match[1]}  `, { size, bold: true, color: C.accent }), textRun(match[2], { size, bold: true, color: C.ink })]
        : [textRun(block.text, { size, bold: true, color: C.ink })];
      const heading = block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      const before = block.level === 1 ? SP.h1Before : block.level === 2 ? SP.h2Before : SP.h3Before;
      const after = block.level === 1 ? SP.h1After : block.level === 2 ? SP.h2After : SP.h3After;
      const pageBreakBefore = options.pageBreak && block.level === 1 && headingIndex > 0;
      headingIndex += 1;
      return new Paragraph({
        children: runs,
        heading,
        keepNext: true,
        pageBreakBefore,
        spacing: { before, after, line: SP.heading, lineRule: "auto" },
        border: block.level === 1 ? { bottom: { style: BorderStyle.SINGLE, size: 3, color: C.line, space: 6 } } : undefined
      });
    };

    const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const hairline = { style: BorderStyle.SINGLE, size: 2, color: C.line };
    const renderTable = (block) => {
      const columnCount = Math.max(1, ...(block.header ? [block.header.length] : []), ...block.rows.map((row) => row.length));
      const weights = block.columns && block.columns.length === columnCount ? block.columns : new Array(columnCount).fill(1);
      const total = weights.reduce((sum, value) => sum + value, 0);
      const widths = weights.map((value) => Math.floor(value / total * PAGE.contentWidth));
      widths[widths.length - 1] += PAGE.contentWidth - widths.reduce((sum, value) => sum + value, 0);
      const cell = (value, column, settings = {}) => new TableCell({
        width: { size: widths[column], type: WidthType.DXA },
        shading: settings.header ? { type: ShadingType.CLEAR, fill: C.bg } : undefined,
        margins: { top: 76, bottom: 76, left: 115, right: 115 },
        borders: { top: hairline, bottom: hairline, left: noBorder, right: noBorder },
        children: String(value || "").split("<br>").map((line) => new Paragraph({
          children: inline(line, { size: Z.table, bold: settings.header || settings.first, color: settings.header || settings.first ? C.ink : C.body }),
          spacing: { before: 0, after: 0, line: SP.table, lineRule: "auto" }
        }))
      });
      const rows = [];
      if (block.header) rows.push(new TableRow({ tableHeader: true, children: block.header.map((value, column) => cell(value, column, { header: true })) }));
      block.rows.forEach((row) => rows.push(new TableRow({ children: new Array(columnCount).fill(0).map((_, column) => cell(row[column], column, { first: !block.header && column === 0 })) })));
      return new Table({ columnWidths: widths, width: { size: PAGE.contentWidth, type: WidthType.DXA }, rows });
    };

    for (const block of parsed.blocks) {
      if (block.type === "heading") children.push(renderHeading(block));
      if (block.type === "paragraph") children.push(paragraph(inline(block.text)));
      if (block.type === "callout") children.push(new Paragraph({
        children: inline(block.text, { size: Z.callout }),
        spacing: { before: 120, after: 160, line: SP.line, lineRule: "auto" },
        indent: { left: 220, right: 170 },
        shading: { type: ShadingType.CLEAR, fill: C.bg },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.accent, space: 8 } }
      }));
      if (block.type === "table") {
        children.push(renderTable(block));
        children.push(paragraph([textRun("", { size: 2 })], { after: 120 }));
      }
      if (block.type === "unordered") block.items.forEach((item) => children.push(paragraph(inline(item), { before: 20, after: 30, numbering: { reference: "bullets", level: 0 } })));
      if (block.type === "ordered") block.items.forEach((item, itemIndex) => children.push(paragraph([
        textRun(`${String(itemIndex + 1).padStart(block.items.length >= 10 ? 2 : 1, "0")}  `, { bold: true, color: C.accent }),
        ...inline(item)
      ], { before: 20, after: 30, indent: { left: 160 } })));
      if (block.type === "pagebreak") children.push(new Paragraph({ children: [new PageBreak()] }));
      if (block.type === "image") {
        const file = assets.get(block.src) || assets.get(basename(block.src));
        if (!file) {
          warningList.push(`缺少插图：${block.src}`);
          children.push(paragraph([textRun(`[缺少插图：${block.src}]`, { color: C.gray, italics: true })], { alignment: AlignmentType.CENTER }));
          continue;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const [sourceWidth, sourceHeight] = imageDimensions(bytes);
        const width = block.width;
        const height = Math.round(width * sourceHeight / sourceWidth);
        const extension = file.name.split(".").pop().toLowerCase();
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 130, after: 45 },
          children: [new ImageRun({ type: extension === "jpg" ? "jpeg" : extension, data: bytes, transformation: { width, height } })]
        }));
        if (block.caption) children.push(paragraph([textRun(block.caption, { size: Z.caption, color: C.gray })], { alignment: AlignmentType.CENTER, after: 150 }));
      }
    }

    const headerText = parsed.meta.header || documentTitle;
    const document = new Document({
      creator: "olifeng.com/md",
      title: documentTitle,
      description: `Generated from Markdown using the ${style.label} preset`,
      styles: {
        default: { document: { run: { font: F, size: Z.body, color: C.body }, paragraph: { spacing: { line: SP.line } } } }
      },
      numbering: {
        config: [{
          reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 210 } } } }]
        }]
      },
      sections: [{
        properties: { page: { size: { width: PAGE.width, height: PAGE.height }, margin: PAGE.margin } },
        headers: { default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0 },
          children: [textRun(headerText, { size: Z.header, color: C.gray })]
        })] }) },
        footers: { default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: Z.page, color: C.gray })]
        })] }) },
        children
      }]
    });

    const blob = await Packer.toBlob(document);
    return { blob, warnings: warningList, blocks: parsed.blocks.length, title: documentTitle, parsed };
  }

  function clearPreviewUrls() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
  }

  function appendInline(parent, value) {
    const parts = String(value).split(/(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
    parts.forEach((part) => {
      let element = null;
      let text = part;
      if (part.startsWith("**")) {
        element = document.createElement("strong");
        text = part.slice(2, -2);
      } else if (part.startsWith("*") && part.endsWith("*")) {
        element = document.createElement("em");
        text = part.slice(1, -1);
      } else if (part.startsWith("`") && part.endsWith("`")) {
        element = document.createElement("code");
        text = part.slice(1, -1);
      } else {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link && /^(https?:|mailto:)/i.test(link[2])) {
          element = document.createElement("a");
          element.href = link[2];
          element.target = "_blank";
          element.rel = "noopener noreferrer";
          text = link[1];
        }
      }
      if (!element) parent.appendChild(document.createTextNode(text));
      else {
        element.textContent = text;
        parent.appendChild(element);
      }
    });
  }

  function renderMarkdownPreview(parsed, markdownFile, assetFiles) {
    const target = $("#markdownPreview");
    target.replaceChildren();
    clearPreviewUrls();
    const assets = new Map();
    assetFiles.forEach((file) => {
      assets.set(file.name, file);
      assets.set(basename(file.name), file);
    });

    const title = parsed.meta.title || markdownFile.name.replace(/\.md$/i, "");
    if (parsed.meta.eyebrow) {
      const eyebrow = document.createElement("p");
      eyebrow.className = "reader-eyebrow";
      eyebrow.textContent = parsed.meta.eyebrow;
      target.appendChild(eyebrow);
    }
    const titleElement = document.createElement("h1");
    titleElement.className = "reader-title";
    titleElement.textContent = title;
    target.appendChild(titleElement);
    if (parsed.meta.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.className = "reader-subtitle";
      subtitle.textContent = parsed.meta.subtitle;
      target.appendChild(subtitle);
    }
    if (parsed.meta.meta) {
      const meta = document.createElement("p");
      meta.className = "reader-meta";
      meta.textContent = parsed.meta.meta;
      target.appendChild(meta);
    }
    const rule = document.createElement("hr");
    rule.className = "reader-rule";
    target.appendChild(rule);

    parsed.blocks.forEach((block) => {
      if (block.type === "heading") {
        const heading = document.createElement(`h${block.level}`);
        heading.textContent = block.text;
        target.appendChild(heading);
      }
      if (block.type === "paragraph") {
        const paragraph = document.createElement("p");
        appendInline(paragraph, block.text);
        target.appendChild(paragraph);
      }
      if (block.type === "callout") {
        const quote = document.createElement("blockquote");
        const paragraph = document.createElement("p");
        appendInline(paragraph, block.text);
        quote.appendChild(paragraph);
        target.appendChild(quote);
      }
      if (block.type === "unordered" || block.type === "ordered") {
        const list = document.createElement(block.type === "unordered" ? "ul" : "ol");
        block.items.forEach((item) => {
          const listItem = document.createElement("li");
          appendInline(listItem, item);
          list.appendChild(listItem);
        });
        target.appendChild(list);
      }
      if (block.type === "table") {
        const wrapper = document.createElement("div");
        wrapper.className = "reader-table-wrap";
        const table = document.createElement("table");
        if (block.header) {
          const head = document.createElement("thead");
          const row = document.createElement("tr");
          block.header.forEach((value) => {
            const cell = document.createElement("th");
            appendInline(cell, value);
            row.appendChild(cell);
          });
          head.appendChild(row);
          table.appendChild(head);
        }
        const body = document.createElement("tbody");
        block.rows.forEach((values) => {
          const row = document.createElement("tr");
          values.forEach((value) => {
            const cell = document.createElement("td");
            appendInline(cell, value.replace(/<br\s*\/?\s*>/gi, " / "));
            row.appendChild(cell);
          });
          body.appendChild(row);
        });
        table.appendChild(body);
        wrapper.appendChild(table);
        target.appendChild(wrapper);
      }
      if (block.type === "image") {
        const file = assets.get(block.src) || assets.get(basename(block.src));
        if (file) {
          const image = document.createElement("img");
          const url = URL.createObjectURL(file);
          previewUrls.push(url);
          image.src = url;
          image.alt = block.caption || "";
          image.style.width = `${block.width}px`;
          target.appendChild(image);
        } else {
          const missing = document.createElement("p");
          missing.className = "reader-missing";
          missing.textContent = `缺少插图：${block.src}`;
          target.appendChild(missing);
        }
        if (block.caption) {
          const caption = document.createElement("p");
          caption.className = "reader-caption";
          caption.textContent = block.caption;
          target.appendChild(caption);
        }
      }
      if (block.type === "pagebreak") {
        const pagebreak = document.createElement("hr");
        pagebreak.className = "reader-pagebreak";
        target.appendChild(pagebreak);
      }
    });
  }

  async function renderWordPreview(blob) {
    const target = $("#wordPreview");
    if (!window.docxPreview?.renderAsync) throw new Error("Word 预览组件加载失败，请刷新页面重试。");
    target.replaceChildren();
    const loading = document.createElement("p");
    loading.className = "word-preview-loading";
    loading.textContent = "正在生成 Word 预览……";
    target.appendChild(loading);
    await window.docxPreview.renderAsync(blob, target, $("#wordPreviewStyles"), {
      className: "docx",
      inWrapper: true,
      ignoreWidth: true,
      ignoreHeight: true,
      breakPages: true,
      useBase64URL: true
    });
  }

  function switchMode(mode) {
    const wordMode = mode === "word";
    $("#toMdTab").classList.toggle("active", !wordMode);
    $("#toWordTab").classList.toggle("active", wordMode);
    $("#toMdTab").setAttribute("aria-selected", String(!wordMode));
    $("#toWordTab").setAttribute("aria-selected", String(wordMode));
    $("#toMdPanel").hidden = wordMode;
    $("#toWordPanel").hidden = !wordMode;
    $("#mdFooter").hidden = wordMode;
    $("#wordFooter").hidden = !wordMode;
    document.body.classList.toggle("word-preview-active", wordMode && $("#wordCompare").classList.contains("on"));
    $("#pageTitle").textContent = wordMode ? "Markdown 转 Word" : "文档转 Markdown";
    $("#pageLede").innerHTML = wordMode
      ? "丢进 <b>.md</b>，拿到排版完成、可直接交付的 <b>.docx</b>。"
      : "丢进 PDF、PPTX、DOCX、CSV，拿到一份纯文字的 <b>.md</b>。";
    document.title = wordMode ? "Markdown 转 Word" : "文档转 Markdown";
  }

  function setStatus(message, error = false) {
    const status = $("#wordStatus");
    status.textContent = message;
    status.classList.toggle("on", Boolean(message));
    status.classList.toggle("error", error);
  }

  async function generateWord(markdown, assets, quiet = false) {
    const requestId = ++generationId;
    if (!quiet) setStatus("正在解析 Markdown 并排版 Word……");
    else setStatus("正在更新 Word 预览……");
    try {
      const result = await buildDocx(markdown, assets, {
        style: $("#wordStyle").value,
        toc: $("#wordToc").checked,
        pageBreak: $("#wordPageBreak").checked
      });
      if (requestId !== generationId) return;
      wordBlob = result.blob;
      wordName = markdown.name.replace(/\.md$/i, "") + ".docx";
      $("#wordResultName").textContent = wordName;
      const parts = [`${result.blocks} 个内容区块`, `${(wordBlob.size / 1024).toFixed(0)} KB`, PRESETS[$("#wordStyle").value].label];
      if (result.warnings.length) parts.push(`${result.warnings.length} 张图片未找到`);
      $("#wordResultMeta").textContent = parts.join(" · ");
      $("#wordResult").classList.add("on");
      renderMarkdownPreview(result.parsed, markdown, assets);
      await renderWordPreview(wordBlob);
      if (requestId !== generationId) return;
      $("#wordCompare").classList.add("on");
      document.body.classList.add("word-preview-active");
      setStatus(result.warnings.length ? `Word 已生成。${result.warnings.join("；")}` : "Word 已生成，可在下方对照预览。");
    } catch (error) {
      if (requestId !== generationId) return;
      console.error(error);
      wordBlob = null;
      setStatus(error.message || String(error), true);
    }
  }

  async function handleWordFiles(files) {
    const markdownFiles = files.filter((file) => /\.md$/i.test(file.name));
    const assets = files.filter((file) => /\.(png|jpe?g)$/i.test(file.name));
    if (markdownFiles.length !== 1) {
      setStatus(markdownFiles.length ? "每次请只选择一个 Markdown 文件。" : "请选择一个 .md 文件。", true);
      return;
    }
    const markdown = markdownFiles[0];
    currentMarkdown = markdown;
    currentAssets = assets;
    $("#wordResult").classList.remove("on");
    $("#wordCompare").classList.remove("on");
    document.body.classList.remove("word-preview-active");
    await generateWord(markdown, assets);
  }

  function scheduleRebuild() {
    if (!currentMarkdown) return;
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => generateWord(currentMarkdown, currentAssets, true), 180);
  }

  function switchPreview(view) {
    const markdownView = view === "markdown";
    $("#compareGrid").classList.toggle("show-markdown", markdownView);
    $("#compareGrid").classList.toggle("show-word", !markdownView);
    $("#markdownPreviewTab").classList.toggle("active", markdownView);
    $("#wordPreviewTab").classList.toggle("active", !markdownView);
    $("#markdownPreviewTab").setAttribute("aria-selected", String(markdownView));
    $("#wordPreviewTab").setAttribute("aria-selected", String(!markdownView));
  }

  function downloadWord() {
    if (!wordBlob) return;
    const url = URL.createObjectURL(wordBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = wordName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  window.addEventListener("DOMContentLoaded", () => {
    const wordDrop = $("#wordDrop");
    const wordPicker = $("#wordPicker");
    $("#toMdTab").addEventListener("click", () => switchMode("md"));
    $("#toWordTab").addEventListener("click", () => switchMode("word"));
    wordDrop.addEventListener("click", () => wordPicker.click());
    wordDrop.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); wordPicker.click(); }
    });
    wordPicker.addEventListener("change", (event) => {
      handleWordFiles([...event.target.files]);
      wordPicker.value = "";
    });
    ["dragenter", "dragover"].forEach((type) => wordDrop.addEventListener(type, (event) => {
      event.preventDefault(); wordDrop.classList.add("hot");
    }));
    ["dragleave", "drop"].forEach((type) => wordDrop.addEventListener(type, (event) => {
      event.preventDefault(); wordDrop.classList.remove("hot");
    }));
    wordDrop.addEventListener("drop", (event) => handleWordFiles([...event.dataTransfer.files]));
    $("#wordStyle").addEventListener("change", scheduleRebuild);
    $("#wordToc").addEventListener("change", scheduleRebuild);
    $("#wordPageBreak").addEventListener("change", scheduleRebuild);
    $("#markdownPreviewTab").addEventListener("click", () => switchPreview("markdown"));
    $("#wordPreviewTab").addEventListener("click", () => switchPreview("word"));
    $("#wordDownload").addEventListener("click", downloadWord);
    $("#wordClear").addEventListener("click", () => {
      generationId += 1;
      clearTimeout(rebuildTimer);
      clearPreviewUrls();
      wordBlob = null;
      wordName = "";
      currentMarkdown = null;
      currentAssets = [];
      $("#wordResult").classList.remove("on");
      $("#wordCompare").classList.remove("on");
      $("#markdownPreview").replaceChildren();
      $("#wordPreview").replaceChildren();
      document.body.classList.remove("word-preview-active");
      setStatus("");
    });
  });

  window.mdWordTest = { parseMarkdown, buildDocx, PRESETS };
})();
