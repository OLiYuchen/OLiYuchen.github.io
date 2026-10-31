(function () {
  "use strict";

  var gallery = document.querySelector(".technique-scroll-gallery");
  var controls = document.querySelector(".technique-mobile-controls");
  if (!gallery || !controls) return;

  var cards = Array.prototype.slice.call(
    gallery.querySelectorAll(".technique-scroll-card")
  );
  var previous = controls.querySelector(".technique-gallery-prev");
  var next = controls.querySelector(".technique-gallery-next");
  var current = controls.querySelector(".technique-gallery-current");
  var total = controls.querySelector(".technique-gallery-total");
  var activeIndex = 0;
  var frame = null;

  if (!cards.length) return;
  total.textContent = String(cards.length);

  function nearestCardIndex() {
    var galleryRect = gallery.getBoundingClientRect();
    var center = galleryRect.left + galleryRect.width / 2;
    var nearest = 0;
    var distance = Infinity;

    cards.forEach(function (card, index) {
      var rect = card.getBoundingClientRect();
      var nextDistance = Math.abs(rect.left + rect.width / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });

    return nearest;
  }

  function render(index) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach(function (card, cardIndex) {
      card.classList.toggle("is-active", cardIndex === activeIndex);
      card.setAttribute("aria-current", cardIndex === activeIndex ? "true" : "false");
    });
    current.textContent = String(activeIndex + 1);
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === cards.length - 1;
  }

  function goTo(index) {
    var target = Math.max(0, Math.min(cards.length - 1, index));
    cards[target].scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "center",
    });
    render(target);
  }

  gallery.addEventListener(
    "scroll",
    function () {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(function () {
        render(nearestCardIndex());
      });
    },
    { passive: true }
  );

  previous.addEventListener("click", function () {
    goTo(activeIndex - 1);
  });
  next.addEventListener("click", function () {
    goTo(activeIndex + 1);
  });

  render(0);
})();
