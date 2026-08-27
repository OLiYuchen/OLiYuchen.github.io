/* Home hero interaction: preserve only Olivia's signature hover treatment. */
(function () {
  "use strict";

  if (window.__heroMotionLoaded) return;
  window.__heroMotionLoaded = true;

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  onReady(function () {
    var line = document.querySelector(".hero-line");
    if (!line || line.querySelector(".hm-sign")) return;

    document.body.classList.add("hm-on");

    var text = line.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;

    line.textContent = "";

    var label = document.createElement("span");
    label.className = "hm-name-text";
    label.textContent = text;
    line.appendChild(label);

    var signature = new Image();
    signature.className = "hm-sign";
    signature.src = "/assets/img/signature.png";
    signature.alt = "";
    signature.setAttribute("aria-hidden", "true");
    line.appendChild(signature);

    line.addEventListener("pointerenter", function () {
      line.classList.add("hm-signing");
    });
    line.addEventListener("pointerleave", function () {
      line.classList.remove("hm-signing");
    });
  });
})();
