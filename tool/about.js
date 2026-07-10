(function () {
  const searchInput = document.getElementById("searchInput");
  const searchDropdown = document.getElementById("searchDropdown");
  setupGlobalSearch(searchInput, searchDropdown);

  const FEEDBACK_EMAIL = "fyc2003@uw.edu";

  const form = document.getElementById("feedbackForm");
  const typeEl = document.getElementById("feedbackType");
  const titleEl = document.getElementById("feedbackTitle");
  const contentEl = document.getElementById("feedbackContent");
  const diagnosticsCheckboxEl = document.getElementById("feedbackDiagnostics");
  const statusEl = document.getElementById("feedbackStatus");
  const copyBtn = document.getElementById("copyFeedback");

  function buildFeedbackText() {
    const parts = [contentEl.value.trim()];
    if (diagnosticsCheckboxEl.checked) {
      parts.push("", "---- 诊断信息 ----", collectDiagnosticsText());
    }
    return parts.join("\n");
  }

  function showStatus(message) {
    statusEl.hidden = false;
    statusEl.textContent = message;
  }

  async function syncToNotion(payload) {
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Best-effort only — mailto is the guaranteed delivery path, so a
      // failed sync here must never interrupt the user-facing flow.
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = typeEl.value;
    const title = titleEl.value.trim();
    const bodyText = buildFeedbackText();
    if (!title || !contentEl.value.trim()) return;

    const diagnostics = diagnosticsCheckboxEl.checked ? collectDiagnosticsText() : null;

    // Fire-and-forget: does not block or delay the mailto flow below.
    syncToNotion({ type, title, content: contentEl.value.trim(), diagnostics, pageUrl: location.href });

    const subject = `[投资情报助手反馈][${type}] ${title}`;
    const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailto;

    showStatus("已生成邮件，请在弹出的邮件客户端中点击发送。如果没有自动弹出，请点击「复制反馈内容」手动发送到 " + FEEDBACK_EMAIL + "。");
  });

  copyBtn.addEventListener("click", async () => {
    const type = typeEl.value;
    const title = titleEl.value.trim() || "（未填写标题）";
    const text = `[${type}] ${title}\n\n${buildFeedbackText()}`;
    try {
      await navigator.clipboard.writeText(text);
      showStatus("已复制反馈内容到剪贴板，可粘贴到邮件中发送到 " + FEEDBACK_EMAIL + "。");
    } catch (error) {
      showStatus("复制失败，请手动选中内容复制。");
    }
  });
})();
