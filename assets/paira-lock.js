/* ============================================================================
   paira-lock.js  ·  Olivia Feng portfolio home
   Soft-locks the Paira project card on the homepage:
   - Hover shows a translucent black veil with "Coming soon".
   - A single click does NOT open the project (normal visitors are blocked).
   - A double click opens the full case study at /paira/.
   Self-contained: injects its own <style>, edits no other file, and touches
   only the Paira card. Remove by deleting this file + its one <script> tag.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__pairaLockLoaded) return;
  window.__pairaLockLoaded = true;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    var card =
      document.querySelector('a.project-card[href="/paira/"]') ||
      document.querySelector('a.project-card[href^="/paira"]');
    if (!card || card.dataset.pairaLocked) return;
    card.dataset.pairaLocked = "1";

    var href = card.getAttribute("href") || "/paira/";

    if (!document.getElementById("paira-lock-styles")) {
      var css = [
        ".paira-locked{position:relative;}",
        ".paira-veil{position:absolute;inset:0;z-index:5;display:grid;place-items:center;",
        "background:rgba(18,14,10,.62);border-radius:var(--radius-card,1.5rem);",
        "opacity:0;transition:opacity .32s ease;pointer-events:none;}",
        ".paira-locked:hover .paira-veil,.paira-locked:focus-visible .paira-veil{opacity:1;}",
        ".paira-veil-label{color:#c9c4bb;text-align:center;transform:translateY(6px);",
        "transition:transform .32s cubic-bezier(.19,1,.22,1);}",
        ".paira-locked:hover .paira-veil-label{transform:translateY(0);}",
        '.paira-veil-label strong{display:block;font-family:"Cormorant Garamond",Georgia,serif;',
        "font-weight:600;font-size:clamp(1.5rem,2.6vw,2.1rem);letter-spacing:.01em;}",
        // hidden from sighted normal reading; only there for assistive tech
        ".paira-veil-note{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}",
      ].join("");
      var s = document.createElement("style");
      s.id = "paira-lock-styles";
      s.textContent = css;
      document.head.appendChild(s);
    }

    card.classList.add("paira-locked");

    var veil = document.createElement("span");
    veil.className = "paira-veil";
    veil.setAttribute("aria-hidden", "true");
    veil.innerHTML =
      '<span class="paira-veil-label"><strong>Coming soon</strong></span>';
    card.appendChild(veil);

    // block single-click navigation; open only on double-click
    card.addEventListener("click", function (e) {
      e.preventDefault();
    });
    card.addEventListener("dblclick", function (e) {
      e.preventDefault();
      window.location.href = href;
    });
    // keep keyboard activation from opening it too (matches "single = blocked")
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") e.preventDefault();
    });
  });
})();
