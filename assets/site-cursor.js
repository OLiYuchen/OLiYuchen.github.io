(function () {
  "use strict";

  if (window.__siteCursorController) {
    window.__siteCursorController.restore();
    return;
  }

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!finePointer.matches) return;

  var cursor = document.createElement("span");
  var x = -40;
  var y = -40;
  var frame = 0;

  function restoreCursor() {
    if (!document.body) return;
    if (!cursor.isConnected) document.body.appendChild(cursor);
    document.documentElement.classList.add("site-cursor-enabled");
    cursor.classList.remove("is-pressed");
  }

  function render() {
    frame = 0;
    cursor.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%,-50%)";
  }

  function requestRender() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  function mountCursor() {
    cursor.className = "site-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<img class="site-cursor-glyph" src="/assets/img/site-cursor.svg?v=1" alt="" draggable="false">';
    restoreCursor();

    document.addEventListener("pointermove", function (event) {
      restoreCursor();
      x = event.clientX;
      y = event.clientY;
      cursor.classList.add("is-visible");
      requestRender();
    }, { passive: true });

    document.addEventListener("pointerover", function (event) {
      cursor.classList.toggle(
        "is-interactive",
        Boolean(event.target.closest("a, button, summary, input, textarea, select, [role='button']"))
      );
    }, { passive: true });

    document.addEventListener("pointerdown", function () {
      cursor.classList.add("is-pressed");
    }, { passive: true });

    document.addEventListener("pointerup", function () {
      cursor.classList.remove("is-pressed");
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", function () {
      cursor.classList.remove("is-visible");
    });

    document.documentElement.addEventListener("pointerenter", restoreCursor);
    window.addEventListener("pageshow", restoreCursor);
    window.addEventListener("load", restoreCursor);
    window.addEventListener("focus", restoreCursor);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) restoreCursor();
    });
  }

  window.__siteCursorController = { restore: restoreCursor };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountCursor, { once: true });
  } else {
    mountCursor();
  }
})();
