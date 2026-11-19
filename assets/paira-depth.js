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

/* ---- What we built: keep the lit line in step with the film ---------------
   Each line knows when its part of the film is on screen; clicking a line
   plays the film from there. With reduced motion the film does not play and
   every line simply reads. */
(function () {
  var video = document.querySelector('[data-paira-intro]');
  if (!video) return;
  var block = video.closest('.paira-intro');
  var beats = [].slice.call(block.querySelectorAll('.paira-intro-beats li'));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
    block.classList.add('is-still');
    return;
  }

  function mark() {
    var t = video.currentTime;
    beats.forEach(function (li) {
      li.classList.toggle('is-now',
        t >= parseFloat(li.dataset.from) && t < parseFloat(li.dataset.to));
    });
  }
  video.addEventListener('timeupdate', mark);
  video.addEventListener('seeked', mark);

  beats.forEach(function (li) {
    li.querySelector('button').addEventListener('click', function () {
      video.currentTime = parseFloat(li.dataset.from) + 0.05;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      mark();
    });
  });

  // If autoplay is refused, the lines are not waiting on a film that never
  // starts.
  var p = video.play();
  if (p && p.catch) p.catch(function () { block.classList.add('is-still'); });
})();
