/* The two things the growth act does.

   This used to live inline in paira/depth.html, which was fine while the act
   was only on the draft page. Merged into the live case study the act came
   without it, and the board's Before / With-the-status-system toggle did
   nothing. One file, loaded by both pages. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal once, on the way past. */
  function once(selector, cls) {
    var nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add(cls); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(cls);
        io.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  once('[data-pd-anatomy]', 'is-shown');

  /* The design file, before and after the status system. */
  document.querySelectorAll('[data-pd-board]').forEach(function (board) {
    var before = board.querySelector('[data-pd-before]');
    var after = board.querySelector('[data-pd-after]');
    if (!before || !after) return;

    function show(isBefore) {
      board.classList.toggle('is-before', isBefore);
      before.classList.toggle('is-on', isBefore);
      after.classList.toggle('is-on', !isBefore);
      before.setAttribute('aria-pressed', isBefore ? 'true' : 'false');
      after.setAttribute('aria-pressed', isBefore ? 'false' : 'true');
    }

    before.addEventListener('click', function () { show(true); });
    after.addEventListener('click', function () { show(false); });
    show(board.classList.contains('is-before'));
  });
})();
