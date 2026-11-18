/* The footer says where she is, and what the time is there.

   Always her clock, never the reader's: the zone is fixed to the Pacific
   coast, so someone reading this in Shanghai sees her afternoon, not
   their own. */
(function () {
  var el = document.querySelector('[data-clock]');
  if (!el || !window.Intl) return;

  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  });

  var last = '';
  function tick() {
    var now = fmt.format(new Date());
    if (now === last) return;
    last = now;
    // Ordinary spaces collapse to one, so the gap either side of the dot is
    // made of non-breaking ones.
    el.textContent = '\u00a0\u00a0\u00b7\u00a0\u00a0' + now;
  }

  tick();
  setInterval(tick, 10000);
})();
