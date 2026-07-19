/* ============================================================================
   hero-motion.js  ·  Olivia Feng portfolio home hero
   Small, tasteful cursor-reactive micro-interactions. Conflict-free:
   - Injects its own <style>; never edits style.css.
   - Wraps targets in runtime-only nodes so it NEVER overrides an element's
     existing transform (e.g. the portrait's base translate/rotate).
   - Fully gated behind prefers-reduced-motion.
   Remove by deleting this file and its single <script> tag.
   ========================================================================== */
(function () {
  "use strict";

  if (window.__heroMotionLoaded) return;
  window.__heroMotionLoaded = true;

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  onReady(function () {
    var hero = document.querySelector(".home-hero");
    if (!hero || reduce) return;

    injectStyles();
    document.body.classList.add("hm-on");

    setupSignature();
    var portrait = setupPortrait();
    setupBubbles();
    setupParallax(hero, portrait);
  });

  /* ---------------------------------------------------------------- styles */
  function injectStyles() {
    if (document.getElementById("hero-motion-styles")) return;
    var css = [
      /* Preserve the typeset footprint while Olivia's signature replaces it. */
      ".hm-on .hero-line{position:relative;display:inline-block;}",
      ".hm-name-text{display:inline-block;transition:opacity .3s ease;}",
      ".hm-sign{position:absolute;top:50%;left:0;width:auto;height:1em;max-width:none;" +
        "opacity:0;transform-origin:left center;transform:translateY(-50%) scale(.96);" +
        "transition:opacity .38s ease,transform .55s cubic-bezier(.19,1,.22,1);pointer-events:none;}",
      ".hero-line.hm-signing .hm-name-text{opacity:.04;}",
      ".hero-line.hm-signing .hm-sign{opacity:1;transform:translateY(-50%) scale(1);}",

      /* wrappers own their own transform; base element transforms stay intact */
      ".hm-parallax{will-change:transform;transition:transform .6s cubic-bezier(.19,1,.22,1);}",
      ".hm-stage{transform-style:preserve-3d;will-change:transform;transition:transform .5s cubic-bezier(.19,1,.22,1);}",

      /* soft light that glances across the photo, following the cursor */
      ".hm-glare{position:absolute;inset:.6rem;border-radius:1.4rem;pointer-events:none;z-index:2;opacity:0;" +
        "background:radial-gradient(38% 46% at var(--gx,50%) var(--gy,30%),rgba(255,255,255,.65),rgba(255,255,255,0) 70%);" +
        "mix-blend-mode:soft-light;transition:opacity .45s ease;}",

      /* note bubbles: quiet idle drift, plus a small lift on hover */
      ".hm-on .hero-note{will-change:transform;transition:transform .4s cubic-bezier(.19,1,.22,1),box-shadow .4s ease;}",
      ".hm-on .hero-note:nth-child(1){animation:hmDriftA 9s ease-in-out infinite;}",
      ".hm-on .hero-note:nth-child(2){animation:hmDriftB 11s ease-in-out infinite;}",
      ".hm-on .hero-note:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(52,39,27,.14);}",

      "@keyframes hmDriftA{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}",
      "@keyframes hmDriftB{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}",
    ].join("\n");

    var tag = document.createElement("style");
    tag.id = "hero-motion-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  /* The name changes into Olivia's signature without changing cursor size. */
  function setupSignature() {
    var line = document.querySelector(".hero-line");
    if (!line || line.querySelector(".hm-sign")) return;

    var text = line.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;

    line.textContent = "";
    var span = document.createElement("span");
    span.className = "hm-name-text";
    span.textContent = text;
    line.appendChild(span);

    var img = new Image();
    img.className = "hm-sign";
    img.src = "/assets/img/signature.png";
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    line.appendChild(img);

    line.addEventListener("pointerenter", function () {
      line.classList.add("hm-signing");
    });
    line.addEventListener("pointerleave", function () {
      line.classList.remove("hm-signing");
    });
  }

  /* ----------------------------------- portrait: whole-card tilt + glare
     DOM after wrapping:  .hm-parallax > .hm-stage > .hero-portrait(base tf)
     Tilt lives on .hm-stage, parallax on .hm-parallax, so the portrait's own
     translateY/rotate is never touched and the photo stays centred in its
     frame (frame + photo rotate together). */
  function setupPortrait() {
    var portrait = document.querySelector(".hero-portrait");
    if (!portrait || !portrait.parentNode) return null;

    var parallax = document.createElement("div");
    parallax.className = "hm-parallax";
    var stage = document.createElement("div");
    stage.className = "hm-stage";

    portrait.parentNode.insertBefore(parallax, portrait);
    parallax.appendChild(stage);
    stage.appendChild(portrait);

    // glare sits over the photo, inside the white frame
    var glare = document.createElement("span");
    glare.className = "hm-glare";
    portrait.appendChild(glare);

    var MAX = 7; // deg — small, a hint rather than a flip
    var raf = null,
      tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;

    function render() {
      cx = lerp(cx, tx, 0.18);
      cy = lerp(cy, ty, 0.18);
      stage.style.transform =
        "perspective(1000px) rotateX(" +
        cy.toFixed(2) +
        "deg) rotateY(" +
        cx.toFixed(2) +
        "deg)";
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
        raf = window.requestAnimationFrame(render);
      } else {
        raf = null;
      }
    }

    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width; // 0..1
      var py = (e.clientY - r.top) / r.height;
      tx = (px - 0.5) * 2 * MAX; // rotateY
      ty = (0.5 - py) * 2 * MAX; // rotateX
      stage.style.transition = "transform .12s linear";
      glare.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
      glare.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      glare.style.opacity = "1";
      if (!raf) raf = window.requestAnimationFrame(render);
    });

    stage.addEventListener("pointerleave", function () {
      tx = 0;
      ty = 0;
      stage.style.transition = "transform .5s cubic-bezier(.19,1,.22,1)";
      glare.style.opacity = "0";
      if (!raf) raf = window.requestAnimationFrame(render);
    });

    return parallax; // the element parallax should translate
  }

  /* ----------------------------------------------------------- note bubbles */
  function setupBubbles() {
    // idle drift + hover lift are pure CSS (injected above); nothing to wire.
  }

  /* --------------------------------------------------- pointer parallax depth
     Gentle. Applied to wrapper elements only, so it composes with, never
     overrides, each target's own transform. */
  function setupParallax(hero, portraitWrap) {
    var banner = document.querySelector(".hero-banner img");
    var notes = document.querySelector(".hero-notes");
    var layers = [];
    if (banner) layers.push({ el: banner, depth: 6 });
    if (portraitWrap) layers.push({ el: portraitWrap, depth: 12 });
    if (notes) layers.push({ el: notes, depth: 16 });
    if (!layers.length) return;

    var tX = 0,
      tY = 0,
      cX = 0,
      cY = 0,
      raf = null;

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tX = (e.clientX - r.left) / r.width - 0.5;
      tY = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = window.requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", function () {
      tX = 0;
      tY = 0;
      if (!raf) raf = window.requestAnimationFrame(tick);
    });

    function tick() {
      cX = lerp(cX, tX, 0.07);
      cY = lerp(cY, tY, 0.07);
      layers.forEach(function (l) {
        l.el.style.transform =
          "translate3d(" +
          (cX * l.depth).toFixed(2) +
          "px," +
          (cY * l.depth).toFixed(2) +
          "px,0)";
      });
      if (Math.abs(tX - cX) > 0.001 || Math.abs(tY - cY) > 0.001) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }
  }
})();
