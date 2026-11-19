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

/* ---- What we built: the film plays once, when it is seen ------------------
   It starts when most of it is on screen, plays to the end and holds there on
   the logo, and offers to play again. It does not loop: a film that keeps
   going under the reader's eye while they read the next section is noise.
   With reduced motion it does not play by itself; it shows the frame with
   both sides of the app and gives the reader the controls. */
(function () {
  var video = document.querySelector('[data-paira-film]');
  if (!video) return;
  var replay = document.querySelector('[data-paira-replay]');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (video.dataset.still) video.poster = video.dataset.still;
    video.controls = true;
    return;
  }

  var played = false;
  function play() {
    var p = video.play();
    if (p && p.catch) p.catch(function () { video.controls = true; });
  }

  video.addEventListener('ended', function () {
    if (replay) replay.hidden = false;
  });
  if (replay) replay.addEventListener('click', function () {
    replay.hidden = true;
    video.currentTime = 0;
    play();
  });

  if (!('IntersectionObserver' in window)) { play(); return; }
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !played) { played = true; play(); }
      // scrolled away mid-film: pause, and pick up where it was when it returns
      else if (!e.isIntersecting && played && !video.ended) video.pause();
      else if (e.isIntersecting && played && video.paused && !video.ended && video.currentTime > 0) play();
    });
  }, { threshold: 0.55 }).observe(video);
})();
