/* paira-motion.js — Paira case study motion components (01 ai-request, 02 pivot, 03 device, 04 map, 08 lifecycle).
   Vanilla JS, auto-inits on [data-pm-*] roots. Built by the motion pass; see paira-case.css for styles. */

/* ---- 01-ai-request ---- */
/* 01 · AI Q&A → drafted request (v2, interactive, inside a phone)
   <div class="paira-m-ai-request" data-pm-ai-request><script type="application/json" data-pm-config>{…}</script></div>
   Flow: sentence types into the composer → user bubble → AI intro → Q1 options → (auto-pick or viewer click) →
   Q2 options → wrap-up → Request Review screen slides in (Title / Description / Request Type / Industry / Location,
   AI DRAFT tag) → "Post and see the helpers".
   Autoplay once in view (≈ 9–10 s). Any click inside the phone pauses autoplay and hands control to the viewer.
   Replay/Reset outside the phone; "Restart Conversation" inside does the same. Reduced motion → final review state.
   Placeholders {a1} {a2} … in draft strings are replaced with the chosen answers.
   Events: pm:ai-request:start, pm:ai-request:answer {question, option}, pm:ai-request:complete */
(function () {
  'use strict';
  const NS = (window.PairaMotion = window.PairaMotion || {});
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DEFAULTS = {
    emptyTitle: 'What do you need help with?',
    emptyChips: ['Interview prep', 'Resume review', 'Job application', 'Company insights', 'Get a referral'],
    placeholder: 'Describe your goal, timeline, or the kind of helper you need',
    sentence: 'I want to prep for an interview',
    intro: 'Got it. I\'ll ask a few quick questions so I can turn this into a clear request and find helpers who are a good fit.',
    questions: [
      { prompt: 'What stage are you at?', options: ['New Grad', 'Junior Level Designer (0–2 yoe)', 'Mid-Level Designer (2–4 yoe)'], auto: 0 },
      { prompt: 'How much help do you need?', lead: 'Got it. Since you\'re at the {a1} stage, the type of help you need can make a big difference.', options: ['One time mock interview', 'A few sessions with follow up', 'Not sure'], auto: 0 }
    ],
    orType: 'Or type your own answer below',
    wrap: 'Got it! We have enough to draft your request and match you with the helpers.',
    reviewLead: 'We\'ve generated your request and highlighted a few details you may want to review before posting.',
    draftTag: 'AI draft',
    draft: {
      title: 'Mock PM interview prep · {a1}',
      description: 'I\'m preparing for my first product-manager interviews this fall and would like {a2:lc}. Honest feedback on behavioural and case questions, from someone who has interviewed candidates recently.',
      fields: [ { label: 'Request Type', value: 'Mock Interview' }, { label: 'Industry', value: 'Technology' }, { label: 'Location', value: 'Seattle, WA' } ]
    },
    postLabel: 'Post and see the helpers',
    postedLabel: 'Posted · finding helpers',
    replayLabel: 'Replay',
    statusAuto: 'Autoplay', statusManual: 'Your turn', statusDone: 'Drafted',
    // timing (ms)
    startDelay: 400, wordDelay: 90, wordJitter: 50, sendPause: 320, think: 500, afterOptions: 1100, pickHold: 420, wrapHold: 900, fieldStagger: 140,   // ≈ 9.5 s autoplay
    threshold: 0.5, autoplay: true
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function h(tag, cls, html) { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; }
  function readInlineConfig(root) {
    const s = root.querySelector('script[type="application/json"][data-pm-config]');
    if (!s) return {};
    try { return JSON.parse(s.textContent); } catch (e) { console.warn('[paira-m-ai-request] bad JSON', e); return {}; }
  }
  const SPARK = '<svg class="paira-m-ai-request__spark" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.5 11.8 7l5.7 1.8-5.7 1.8L10 16.2 8.2 10.6 2.5 8.8 8.2 7z"/><path d="M16.5 13.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>';
  const MIC = '<svg class="paira-m-ai-request__mic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="7" y="2.5" width="6" height="10" rx="3"/><path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5"/></svg>';
  const RESTART = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6"/><path d="M3 3v3h3"/></svg>';

  function build(root, cfg) {
    root.innerHTML = '';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Interactive demo: Paira turns a sentence into a request');
    const phone = h('div', 'paira-m-ai-request__phone');
    const screen = h('div', 'paira-m-ai-request__screen');
    const bar = h('div', 'paira-m-ai-request__bar', '<span class="paira-m-ai-request__close" aria-hidden="true">×</span>');
    const restart = h('button', 'paira-m-ai-request__restart', RESTART + 'Restart Conversation'); restart.type = 'button';
    bar.append(restart);
    const thread = h('div', 'paira-m-ai-request__thread');
    thread.setAttribute('aria-live', 'polite');
    const empty = h('div', 'paira-m-ai-request__empty', '<p class="paira-m-ai-request__h4">' + esc(cfg.emptyTitle) + '</p><div class="paira-m-ai-request__empty-chips" aria-hidden="true">' + cfg.emptyChips.map(c => '<span>' + esc(c) + '</span>').join('') + '</div>');
    thread.append(empty);
    const composer = h('div', 'paira-m-ai-request__composer');
    const input = h('div', 'paira-m-ai-request__input is-empty'); input.dataset.placeholder = cfg.placeholder;
    const typed = h('span', 'paira-m-ai-request__typed');
    input.append(typed); input.insertAdjacentHTML('beforeend', MIC);
    composer.append(input);
    const review = h('div', 'paira-m-ai-request__review');
    review.setAttribute('aria-hidden', 'true');
    review.innerHTML = '<div class="paira-m-ai-request__bar"><span class="paira-m-ai-request__close" aria-hidden="true">×</span><button type="button" class="paira-m-ai-request__restart">' + RESTART + 'Restart Conversation</button></div>' +
      '<div class="paira-m-ai-request__review-body"><div class="paira-m-ai-request__review-lead">' + SPARK + '<p>' + esc(cfg.reviewLead) + '</p><span class="paira-m-ai-request__tag">' + esc(cfg.draftTag) + '</span></div><dl class="paira-m-ai-request__fields"></dl></div>' +
      '<button type="button" class="paira-m-ai-request__post">' + esc(cfg.postLabel) + '</button>';
    screen.append(bar, thread, composer, review);
    phone.append(screen);
    const controls = h('div', 'paira-m-ai-request__controls');
    const replay = h('button', 'paira-m-ai-request__replay', RESTART + esc(cfg.replayLabel)); replay.type = 'button';
    const status = h('span', 'paira-m-ai-request__status', '');
    controls.append(replay, status);
    root.append(phone, controls);
    return { phone, screen, thread, empty, input, typed, restart, restart2: review.querySelector('.paira-m-ai-request__restart'), review, fields: review.querySelector('.paira-m-ai-request__fields'), post: review.querySelector('.paira-m-ai-request__post'), replay, status };
  }

  function init(root, overrides) {
    if (!root || root.dataset.pmReady) return null;
    root.dataset.pmReady = '1';
    const cfg = Object.assign({}, DEFAULTS, readInlineConfig(root), overrides || {});
    const ui = build(root, cfg);
    const nQ = cfg.questions.length;
    let timers = [], answers = [], manual = false, playing = false, qIndex = -1;
    const d = ms => (REDUCED ? 0 : ms);
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const fill = s => String(s).replace(/\{a(\d+)(:lc)?\}/g, (_, n, lc) => { const a = answers[n - 1] || ''; return lc ? a.charAt(0).toLowerCase() + a.slice(1) : a; });   // {a1} chosen answer, {a1:lc} lower-cased first letter
    const setStatus = t => { ui.status.textContent = t; };
    function scrollDown() {
      requestAnimationFrame(() => ui.thread.scrollTo({ top: ui.thread.scrollHeight, behavior: REDUCED ? 'auto' : 'smooth' }));
    }
    function addMsg(cls, html) {
      const m = h('div', 'paira-m-ai-request__msg ' + cls, html);
      ui.thread.append(m);
      requestAnimationFrame(() => requestAnimationFrame(() => { m.classList.add('is-in'); scrollDown(); }));
      return m;
    }
    function thinking() {
      const t = addMsg('paira-m-ai-request__msg--ai', '<span class="paira-m-ai-request__thinking"><span class="paira-m-ai-request__dots" aria-hidden="true"><i></i><i></i><i></i></span></span>');
      return t;
    }
    function steps(done) {
      return '<span class="paira-m-ai-request__steps" aria-hidden="true">' + cfg.questions.map((_, i) => '<i class="' + (i < done ? 'is-done' : '') + '"></i>').join('') + '</span>';
    }

    /* --- flow ------------------------------------------------------------- */
    function reset() {
      clear(); answers = []; manual = false; playing = false; qIndex = -1;
      root.classList.remove('is-started', 'is-review');
      ui.thread.querySelectorAll('.paira-m-ai-request__msg').forEach(m => m.remove());
      ui.typed.textContent = ''; ui.input.classList.add('is-empty');
      ui.fields.innerHTML = ''; ui.post.classList.remove('is-in', 'is-sent'); ui.post.textContent = cfg.postLabel;
      ui.review.setAttribute('aria-hidden', 'true');
      ui.thread.scrollTop = 0;
      setStatus('');
      delete root.dataset.played;
    }
    function start() {
      if (playing) return;
      playing = true;
      root.dataset.played = '1';
      root.dispatchEvent(new CustomEvent('pm:ai-request:start', { bubbles: true }));
      if (REDUCED) { finalState(); return; }
      setStatus(cfg.statusAuto);
      const words = cfg.sentence.split(/\s+/).filter(Boolean);
      let t = cfg.startDelay;
      ui.input.classList.remove('is-empty');
      const caret = h('span', 'paira-m-ai-request__caret'); caret.setAttribute('aria-hidden', 'true');
      ui.input.insertBefore(caret, ui.typed.nextSibling);
      words.forEach((w, i) => { later(() => { ui.typed.textContent += (i ? ' ' : '') + w; }, t); t += cfg.wordDelay + Math.random() * cfg.wordJitter; });
      t += cfg.sendPause;
      later(() => {
        caret.remove(); ui.typed.textContent = ''; ui.input.classList.add('is-empty');
        root.classList.add('is-started');
        addMsg('paira-m-ai-request__msg--user', esc(cfg.sentence));
        later(() => askIntro(), 200);
      }, t);
    }
    function askIntro() {
      const th = thinking();
      later(() => {
        th.remove();
        addMsg('paira-m-ai-request__msg--ai', '<div class="paira-m-ai-request__ai-head">' + SPARK + steps(0) + '</div><p>' + esc(cfg.intro) + '</p>');
        later(() => ask(0), 500);
      }, cfg.think);
    }
    function ask(i) {
      qIndex = i;
      const q = cfg.questions[i];
      const lead = q.lead ? '<p>' + esc(fill(q.lead)) + '</p>' : '';
      const m = addMsg('paira-m-ai-request__msg--ai',
        (i === 0 ? '' : '<div class="paira-m-ai-request__ai-head">' + SPARK + steps(i) + '</div>') + lead +
        '<p><b>' + esc(fill(q.prompt)) + '</b></p><ul class="paira-m-ai-request__options" role="group" aria-label="' + esc(q.prompt) + '">' +
        q.options.map((o, k) => '<li><button type="button" class="paira-m-ai-request__option" style="--pm-i:' + k + '" data-q="' + i + '" data-k="' + k + '">' + esc(o) + '</button></li>').join('') +
        '</ul><p class="paira-m-ai-request__or">' + esc(cfg.orType) + '</p>');
      if (!manual) later(() => answer(i, q.auto || 0, false), cfg.afterOptions + q.options.length * 70);
      return m;
    }
    function answer(i, k, byUser) {
      if (i !== qIndex) return;
      clear();
      if (byUser) { manual = true; setStatus(cfg.statusManual); }
      const q = cfg.questions[i];
      const list = ui.thread.querySelectorAll('.paira-m-ai-request__options')[i];
      list.classList.add('is-answered');
      list.querySelectorAll('.paira-m-ai-request__option').forEach(b => b.classList.toggle('is-picked', +b.dataset.k === k));
      answers[i] = q.options[k];
      root.dispatchEvent(new CustomEvent('pm:ai-request:answer', { bubbles: true, detail: { question: i, option: k } }));
      qIndex = -1;
      later(() => {
        addMsg('paira-m-ai-request__msg--user', esc(q.options[k]));
        const th = thinking();
        later(() => {
          th.remove();
          if (i + 1 < nQ) ask(i + 1);
          else wrap();
        }, cfg.think + 250);
      }, byUser ? 250 : cfg.pickHold);
    }
    function wrap() {
      addMsg('paira-m-ai-request__msg--ai', '<div class="paira-m-ai-request__ai-head">' + SPARK + steps(nQ) + '</div><p>' + esc(cfg.wrap) + '</p>');
      later(showReview, cfg.wrapHold);
    }
    function renderFields() {
      const D = cfg.draft;
      const rows = [
        '<div class="paira-m-ai-request__field"><dt>Title</dt><dd>' + esc(fill(D.title)) + '</dd></div>',
        '<div class="paira-m-ai-request__field"><dt>Description</dt><dd>' + esc(fill(D.description)) + '</dd></div>'
      ].concat(D.fields.map(f => '<div class="paira-m-ai-request__field paira-m-ai-request__field--row"><dt>' + esc(f.label) + '</dt><dd>' + esc(fill(f.value)) + '</dd></div>'));
      ui.fields.innerHTML = rows.join('');
      return [...ui.fields.children];
    }
    function showReview() {
      const rows = renderFields();
      root.classList.add('is-review');
      ui.review.setAttribute('aria-hidden', 'false');
      let t = 380;
      rows.forEach(r => { later(() => r.classList.add('is-in'), t); t += cfg.fieldStagger; });
      later(() => { ui.post.classList.add('is-in'); complete(); }, t + 120);
    }
    function complete() {
      playing = false; setStatus(cfg.statusDone);
      root.dispatchEvent(new CustomEvent('pm:ai-request:complete', { bubbles: true }));
    }
    function finalState() {
      clear();
      root.classList.add('is-started', 'is-review');
      answers = cfg.questions.map(q => q.options[q.auto || 0]);
      renderFields().forEach(r => r.classList.add('is-in'));
      ui.post.classList.add('is-in');
      ui.review.setAttribute('aria-hidden', 'false');
      complete();
    }

    /* --- interaction ------------------------------------------------------ */
    ui.thread.addEventListener('click', e => {
      const b = e.target.closest('.paira-m-ai-request__option');
      if (b) answer(+b.dataset.q, +b.dataset.k, true);
    });
    ui.post.addEventListener('click', () => { ui.post.classList.add('is-sent'); ui.post.textContent = cfg.postedLabel; });
    const restartAll = () => { reset(); start(); };
    ui.restart.addEventListener('click', restartAll);
    ui.restart2.addEventListener('click', restartAll);
    ui.replay.addEventListener('click', restartAll);

    if (REDUCED) finalState();
    else if (cfg.autoplay && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting && !root.dataset.played) { io.disconnect(); start(); } });
      }, { threshold: Math.min(cfg.threshold, Math.max(0.1, 0.7 * window.innerHeight / Math.max(1, ui.phone.offsetHeight))) });
      io.observe(ui.phone);
    } else if (cfg.autoplay) start();

    return { start, reset, answer: (i, k) => answer(i, k, true), finalState, root, config: cfg };
  }

  NS.aiRequest = { init, DEFAULTS };
  function auto() { document.querySelectorAll('[data-pm-ai-request]').forEach(el => init(el)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();


/* ---- 02-pivot-slider ---- */
/* 02 · Pivot before/after slider
   Markup contract: a root element with the abstract "before" and "after" compositions is BUILT by JS
   from a config object (so copy lives in config). Alternatively hand-author the layers and call
   PairaMotion.pivot.init(root, { prebuilt: true }) — see README.
   Controls: drag handle (pointer events, touch-action: pan-y), click on frame, ← → Home End on the grip,
   and a segmented Before/After toggle (the main control on touch).
   Events: pm:pivot:change {position} */
(function () {
  'use strict';
  const NS = (window.PairaMotion = window.PairaMotion || {});
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DEFAULTS = {
    position: 50,
    beforeTag: 'Before: browse profiles',
    afterTag: 'After: state a request',
    beforeCaption: 'Browse people first, then invent a reason to connect.',
    afterCaption: 'State the need first, then meet someone relevant.',
    people: [ { cta: 'Connect' }, { cta: 'Connect' }, { cta: 'Connect' } ],
    requestLabel: 'A request',
    requestText: 'I need a mock PM interview before I start applying.',
    responders: [
      { name: 'Chloe A.', match: '88%' },
      { name: 'Marcus L.', match: '81%' },
      { name: 'Priya S.', match: '76%' }
    ],
    toggleBefore: 'Before', toggleAfter: 'After',
    hint: 'Drag',
    ariaLabel: 'Compare the earlier profile-led direction with the shipped request-led direction',
    mode: 'abstract',            // 'abstract' (built shapes) | 'image' (beforeImage / afterImage captures)
    beforeImage: '', afterImage: '', beforeAlt: 'Earlier direction: profile-led discovery', afterAlt: 'Shipped direction: request-led matching',
    prebuilt: false,
    keyboardStep: 5
  };

  function h(tag, cls, html) { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; }
  function readInlineConfig(root) {
    const s = root.querySelector('script[type="application/json"][data-pm-config]');
    if (!s) return {};
    try { return JSON.parse(s.textContent); } catch (e) { console.warn('[paira-m-pivot] bad JSON', e); return {}; }
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function build(root, cfg) {
    root.innerHTML = '';
    const frame = h('div', 'paira-m-pivot__frame');

    const image = cfg.mode === 'image';
    root.classList.toggle('paira-m-pivot--image', image);

    const before = h('div', 'paira-m-pivot__layer paira-m-pivot__layer--before');
    before.append(h('p', 'paira-m-pivot__tag', '<span class="paira-m-pivot__tag-full">' + esc(cfg.beforeTag) + '</span><span class="paira-m-pivot__tag-short">' + esc(cfg.toggleBefore) + '</span>'));
    if (image) {
      before.append(h('p', 'paira-m-pivot__flank', '<span>' + esc(cfg.toggleBefore) + '</span>' + esc(cfg.beforeCaption)),
        h('div', 'paira-m-pivot__shot', '<img src="' + esc(cfg.beforeImage) + '" alt="' + esc(cfg.beforeAlt) + '" decoding="async">'));
    } else {
      const people = h('div', 'paira-m-pivot__people');
      people.setAttribute('aria-hidden', 'true');
      cfg.people.forEach(p => {
        people.append(h('div', 'paira-m-pivot__person',
          '<span class="paira-m-pivot__avatar"></span><i class="paira-m-pivot__bar"></i><i class="paira-m-pivot__bar paira-m-pivot__bar--short"></i><span class="paira-m-pivot__ghost">' + esc(p.cta) + '</span>'));
      });
      before.append(people, h('p', 'paira-m-pivot__caption', esc(cfg.beforeCaption)));
    }

    const after = h('div', 'paira-m-pivot__layer paira-m-pivot__layer--after');
    after.append(h('p', 'paira-m-pivot__tag', '<span class="paira-m-pivot__tag-full">' + esc(cfg.afterTag) + '</span><span class="paira-m-pivot__tag-short">' + esc(cfg.toggleAfter) + '</span>'));
    if (image) {
      after.append(h('div', 'paira-m-pivot__shot', '<img src="' + esc(cfg.afterImage) + '" alt="' + esc(cfg.afterAlt) + '" decoding="async">'),
        h('p', 'paira-m-pivot__flank', '<span>' + esc(cfg.toggleAfter) + '</span>' + esc(cfg.afterCaption)));
    } else {
      const req = h('div', 'paira-m-pivot__request');
      req.setAttribute('aria-hidden', 'true');
      req.append(h('p', 'paira-m-pivot__request-label', esc(cfg.requestLabel)), h('p', 'paira-m-pivot__request-text', esc(cfg.requestText)));
      const resp = h('div', 'paira-m-pivot__responders');
      cfg.responders.forEach(r => resp.append(h('span', 'paira-m-pivot__responder', '<i></i>' + esc(r.name) + ' <b>' + esc(r.match) + '</b>')));
      req.append(resp);
      after.append(req, h('p', 'paira-m-pivot__caption', esc(cfg.afterCaption)));
    }

    const handle = h('div', 'paira-m-pivot__handle');
    const grip = h('button', 'paira-m-pivot__grip',
      '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 5 2.5 10 7 15"/><path d="m13 5 4.5 5-4.5 5"/></svg>');
    grip.type = 'button';
    grip.setAttribute('role', 'slider');
    grip.setAttribute('aria-label', cfg.ariaLabel);
    grip.setAttribute('aria-valuemin', '0'); grip.setAttribute('aria-valuemax', '100');
    grip.setAttribute('aria-orientation', 'horizontal');
    handle.append(grip);
    if (cfg.hint) { const hint = h('span', 'paira-m-pivot__hint', esc(cfg.hint)); hint.setAttribute('aria-hidden', 'true'); handle.append(hint); }

    frame.append(before, after, handle);

    const toggle = h('div', 'paira-m-pivot__toggle');
    toggle.setAttribute('role', 'group'); toggle.setAttribute('aria-label', 'Show before or after');
    const bBefore = h('button', null, esc(cfg.toggleBefore)); bBefore.type = 'button'; bBefore.dataset.pmTo = '0';
    const bAfter = h('button', null, esc(cfg.toggleAfter)); bAfter.type = 'button'; bAfter.dataset.pmTo = '100';
    toggle.append(bBefore, bAfter);

    root.append(frame, toggle);
    if (image) {
      // stacked layout (≤760px) hides the flank captions; repeat them under the toggle there
      root.append(h('div', 'paira-m-pivot__captions',
        '<p><b>' + esc(cfg.toggleBefore) + ':</b> ' + esc(cfg.beforeCaption) + '</p><p><b>' + esc(cfg.toggleAfter) + ':</b> ' + esc(cfg.afterCaption) + '</p>'));
    }
    return { frame, grip, toggle, buttons: [bBefore, bAfter] };
  }

  function init(root, overrides) {
    if (!root || root.dataset.pmReady) return null;
    root.dataset.pmReady = '1';
    const cfg = Object.assign({}, DEFAULTS, readInlineConfig(root), overrides || {});
    const ui = cfg.prebuilt ? {
      frame: root.querySelector('.paira-m-pivot__frame'),
      grip: root.querySelector('.paira-m-pivot__grip'),
      toggle: root.querySelector('.paira-m-pivot__toggle'),
      buttons: [...root.querySelectorAll('.paira-m-pivot__toggle button')]
    } : build(root, cfg);

    let pos = Math.min(100, Math.max(0, cfg.position));
    let width = ui.frame.clientWidth;
    let raf = 0, pendingX = null;

    function render() {
      root.style.setProperty('--pm-pos', pos + '%');
      root.style.setProperty('--pm-x', (pos / 100 * width) + 'px');
      ui.grip.setAttribute('aria-valuenow', Math.round(pos));
      ui.grip.setAttribute('aria-valuetext', pos < 50 ? 'Mostly showing the earlier direction' : 'Mostly showing the shipped direction');
      // 0 = "before" side is the one mostly revealed when the divider sits right of centre; 100 = "after"
      ui.buttons.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.pmTo === 0 ? pos > 50 : pos < 50)));
      root.dispatchEvent(new CustomEvent('pm:pivot:change', { bubbles: true, detail: { position: pos } }));
    }
    function setPos(p, animate) {
      pos = Math.min(100, Math.max(0, p));
      root.classList.toggle('is-animating', !!animate && !REDUCED);
      root.classList.add('has-moved');
      render();
    }
    function fromClientX(x) {
      const r = ui.frame.getBoundingClientRect();
      width = r.width;
      return (x - r.left) / r.width * 100;
    }
    function scheduleDrag(x) {
      pendingX = x;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setPos(fromClientX(pendingX), false); });
    }

    /* pointer drag anywhere on the frame */
    let dragging = false;
    ui.frame.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (e.target.closest('.paira-m-pivot__toggle')) return;
      dragging = true;
      root.classList.add('is-dragging');
      try { ui.frame.setPointerCapture(e.pointerId); } catch (_) {}
      setPos(fromClientX(e.clientX), e.target !== ui.grip && !ui.grip.contains(e.target));
    });
    ui.frame.addEventListener('pointermove', e => { if (dragging) scheduleDrag(e.clientX); });
    const end = e => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      try { ui.frame.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    ui.frame.addEventListener('pointerup', end);
    ui.frame.addEventListener('pointercancel', end);
    ui.frame.addEventListener('lostpointercapture', end);

    /* keyboard on the grip */
    ui.grip.addEventListener('keydown', e => {
      const map = { ArrowLeft: -cfg.keyboardStep, ArrowRight: cfg.keyboardStep, ArrowDown: -cfg.keyboardStep, ArrowUp: cfg.keyboardStep };
      if (e.key in map) { e.preventDefault(); setPos(pos + map[e.key], true); }
      else if (e.key === 'Home') { e.preventDefault(); setPos(0, true); }
      else if (e.key === 'End') { e.preventDefault(); setPos(100, true); }
    });

    /* segmented toggle */
    ui.buttons.forEach(b => b.addEventListener('click', () => setPos(+b.dataset.pmTo, true)));

    /* keep px in sync with % on resize */
    if ('ResizeObserver' in window) {
      new ResizeObserver(entries => { width = entries[0].contentRect.width; root.style.setProperty('--pm-x', (pos / 100 * width) + 'px'); }).observe(ui.frame);
    } else window.addEventListener('resize', () => { width = ui.frame.clientWidth; render(); });

    render();
    root.classList.remove('has-moved');
    return { setPosition: p => setPos(p, true), getPosition: () => pos, root, config: cfg };
  }

  NS.pivot = { init, DEFAULTS };
  function auto() { document.querySelectorAll('[data-pm-pivot]').forEach(el => init(el)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();


/* ---- 03-scroll-device ---- */
/* 03 · Scroll-linked device sequence (v2: guided flow)
   <div class="paira-m-device" data-pm-device><script type="application/json" data-pm-config>{ steps:[…] }</script></div>
   step: { kicker, title, body, screen, alt, caption, annotations:[ { type, x, y, w, h, label, from, to, style } ] }
     type: 'pill' (yellow callout at x,y) · 'box' (highlight region; style:'square' for corners) · 'bracket' (thin left bracket)
           'shimmer' (one sweep across the region) · 'count' (pill whose number counts from→to; label uses {n})
     x y w h are percentages of the screen. Several annotations stagger by 120 ms after the slide.
   Desktop: sticky stage panel; forward = new screen slides in from the right over the old one (420 ms, quint-out),
   backward = the old one slides back out. Current step = nearest step centre to a focal line (45 % vh) with
   hysteresis (12 % vh) and a 500 ms switch throttle; the rail fill is continuous scroll progress.
   ≤ 760: stacked, each step has its own phone with the same annotations (played when the step is in view).
   Reduced motion: no slides/shimmer; screens and annotations still swap with state.
   Events: pm:device:change { index, direction } */
(function () {
  'use strict';
  const NS = (window.PairaMotion = window.PairaMotion || {});
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DEFAULTS = {
    steps: [], slideMs: 420, bezel: null, countMs: 900, stackedBreakpoint: 760,
    focal: 0.45,           // focal line as a fraction of the viewport height
    hysteresis: 0.12,      // a new step must be nearer the focal line by this × vh before we switch
    minSwitchMs: 500,      // the phone never transitions more often than this
    ariaLabel: 'Walkthrough of the request flow with matching app screens'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function h(tag, cls, html) { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; }
  function readInlineConfig(root) {
    const s = root.querySelector('script[type="application/json"][data-pm-config]');
    if (!s) return {};
    try { return JSON.parse(s.textContent); } catch (e) { console.warn('[paira-m-device] bad JSON', e); return {}; }
  }
  function annotHTML(list) {
    return (list || []).map((a, i) => {
      const pos = `--x:${+a.x || 0};--y:${+a.y || 0};--w:${+a.w || 0};--h:${+a.h || 0};--i:${i}`;
      const t = a.type || 'pill';
      if (t === 'pill') return `<div class="paira-m-device__a paira-m-device__a--pill" style="${pos}"><span>${esc(a.label)}</span></div>`;
      if (t === 'count') return `<div class="paira-m-device__a paira-m-device__a--pill" style="${pos}" data-from="${+a.from || 0}" data-to="${+a.to || 0}" data-tpl="${esc(a.label || '{n}')}"><span><b>${esc(String(a.from || 0))}</b></span></div>`;
      if (t === 'box') { const r = a.r != null ? `;--r:${+a.r}` : ''; return `<div class="paira-m-device__a paira-m-device__a--box ${a.style === 'square' ? 'is-square' : ''} ${a.r != null ? 'has-r' : ''}" style="${pos}${r}"></div>`; }
      if (t === 'bracket') return `<div class="paira-m-device__a paira-m-device__a--bracket" style="${pos}"></div>`;
      if (t === 'shimmer') return `<div class="paira-m-device__a paira-m-device__a--shimmer" style="${pos}"></div>`;
      return '';
    }).join('');
  }
  function phone(inner) { const p = h('div', 'paira-m-device__phone'); p.append(h('div', 'paira-m-device__screen', inner)); return p; }

  function build(root, cfg) {
    root.innerHTML = '';
    root.setAttribute('aria-label', cfg.ariaLabel);
    const steps = h('ol', 'paira-m-device__steps');
    steps.append(h('div', 'paira-m-device__rail', '<i></i>'));
    cfg.steps.forEach((s, i) => {
      const li = h('li', 'paira-m-device__step'); li.dataset.index = i;
      const body = h('div', 'paira-m-device__body');
      body.append(
        h('span', 'paira-m-device__marker', String(i + 1)),
        h('p', 'paira-m-device__kicker', esc(s.kicker || '')),
        h('h3', null, esc(s.title)),
        h('p', null, esc(s.body))
      );
      const fig = h('figure', 'paira-m-device__inline');
      fig.append(phone(`<img src="${esc(s.screen)}" alt="${esc(s.alt || s.title)}" loading="lazy" decoding="async"><div class="paira-m-device__annot" aria-hidden="true">${annotHTML(s.annotations)}</div>`));
      body.append(fig);
      li.append(body);
      steps.append(li);
    });
    const stage = h('div', 'paira-m-device__stage');
    stage.setAttribute('aria-hidden', 'true');
    const imgs = cfg.steps.map(s => `<img src="${esc(s.screen)}" alt="" decoding="async">`).join('');
    const annots = cfg.steps.map((s, i) => `<div class="paira-m-device__annot" data-step="${i}">${annotHTML(s.annotations)}</div>`).join('');
    stage.append(phone(imgs + annots));
    const caption = h('p', 'paira-m-device__caption', esc(cfg.steps[0] && cfg.steps[0].caption || ''));
    const dots = h('div', 'paira-m-device__dots', cfg.steps.map(() => '<i></i>').join(''));
    stage.append(caption, dots);
    root.append(steps, stage);
    return {
      steps: [...steps.querySelectorAll('.paira-m-device__step')],
      markers: [...steps.querySelectorAll('.paira-m-device__marker')],
      imgs: [...stage.querySelectorAll('.paira-m-device__screen > img')],
      annots: [...stage.querySelectorAll('.paira-m-device__annot')],
      dots: [...dots.children], caption
    };
  }

  function countUp(container, ms) {
    container.querySelectorAll('[data-to]').forEach(el => {
      const from = +el.dataset.from, to = +el.dataset.to, tpl = el.dataset.tpl;
      const b = el.querySelector('b');
      const render = n => { el.querySelector('span').innerHTML = esc(tpl).replace('{n}', '<b>' + n + '</b>'); };
      if (REDUCED || ms <= 0) { render(to); return; }
      const t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 4);
        render(Math.round(from + (to - from) * e));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function init(root, overrides) {
    if (!root || root.dataset.pmReady) return null;
    root.dataset.pmReady = '1';
    const cfg = Object.assign({}, DEFAULTS, readInlineConfig(root), overrides || {});
    if (!cfg.steps.length) return null;
    if (cfg.bezel != null) root.style.setProperty('--pm-bezel-pad', cfg.bezel + '%');
    root.style.setProperty('--pm-slide', cfg.slideMs + 'ms');
    const ui = build(root, cfg);
    const n = ui.steps.length;
    const mq = window.matchMedia(`(max-width: ${cfg.stackedBreakpoint}px)`);
    let current = -1, cleanup = 0, countTimer = 0;

    function setCurrent(i) {
      if (i === current) return;
      const prev = current, dir = i > prev ? 1 : -1;
      current = i;
      ui.steps.forEach((s, k) => { s.classList.toggle('is-current', k === i); s.classList.toggle('is-passed', k < i); });
      ui.dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
      ui.caption.textContent = cfg.steps[i].caption || '';
      // screen navigation
      clearTimeout(cleanup);
      ui.imgs.forEach((img, k) => { if (k !== i && k !== prev) img.classList.remove('is-active', 'is-under', 'is-out'); });
      const inc = ui.imgs[i], out = ui.imgs[prev];
      if (out) {
        if (dir > 0 && !REDUCED) { out.classList.remove('is-active'); out.classList.add('is-under'); }
        else if (!REDUCED) {
          // backward: reveal the new screen beneath, slide the old one out to the right
          inc.style.transition = 'none'; inc.classList.add('is-active'); void inc.offsetWidth; inc.style.transition = '';
          out.classList.remove('is-active'); out.classList.add('is-out');
        } else { out.classList.remove('is-active'); }
      }
      inc.classList.add('is-active');
      cleanup = setTimeout(() => { if (out) out.classList.remove('is-under', 'is-out'); }, cfg.slideMs + 50);
      // annotations
      ui.annots.forEach((a, k) => a.classList.toggle('is-annot', k === i));
      clearTimeout(countTimer);
      countTimer = setTimeout(() => countUp(ui.annots[i], cfg.countMs), REDUCED ? 0 : cfg.slideMs + 100);
      root.dispatchEvent(new CustomEvent('pm:device:change', { bubbles: true, detail: { index: i, direction: dir } }));
    }

    /* scroll-progress model (rAF-throttled, read-then-write):
       - rail fill is continuous: focal line position between the first and last step centres
       - current step = the step whose centre is nearest the focal line, with hysteresis and a switch throttle */
    let ticking = false, lastSwitch = 0, pendingTimer = 0;
    const bodies = ui.steps.map(s => s.querySelector('.paira-m-device__body'));
    function measure() {
      const vh = window.innerHeight, focal = vh * cfg.focal;
      const centres = bodies.map(b => { const r = b.getBoundingClientRect(); return r.top + r.height / 2; });
      return { vh, focal, centres };
    }
    function update() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const { vh, focal, centres } = measure();
        const first = centres[0], last = centres[n - 1];
        const p = last > first ? (focal - first) / (last - first) : 1;
        root.style.setProperty('--pm-progress', Math.max(0, Math.min(1, p)).toFixed(4));
        let best = 0, bd = Infinity;
        centres.forEach((c, k) => { const d = Math.abs(c - focal); if (d < bd) { bd = d; best = k; } });
        if (current < 0) { setCurrent(best); lastSwitch = performance.now(); return; }
        if (best === current) return;
        const dCur = Math.abs(centres[current] - focal);
        if (dCur - bd < vh * cfg.hysteresis) return;                 // not clearly nearer yet
        const wait = cfg.minSwitchMs - (performance.now() - lastSwitch);
        if (wait > 0) { clearTimeout(pendingTimer); pendingTimer = setTimeout(update, wait); return; }
        lastSwitch = performance.now();
        setCurrent(best);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    /* stacked: play each inline phone's annotations when its step is in view */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting && mq.matches) { const fig = e.target.querySelector('.paira-m-device__inline'); if (fig && !fig.dataset.played) { fig.dataset.played = '1'; countUp(fig, cfg.countMs); } }
      }), { threshold: 0.4 });
      ui.steps.forEach(s => io.observe(s));
    }

    return { setCurrent, update, root, config: cfg };
  }

  NS.device = { init, DEFAULTS };
  function auto() { document.querySelectorAll('[data-pm-device]').forEach(el => init(el)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();


/* ---- 04-decision-map ---- */
/* 04 · Design decision map (v2: vertical rows)
   <div class="paira-m-map" data-pm-map><script type="application/json" data-pm-config>{ nodes:[…] }</script></div>
   node: { question, chose, gaveUp, why }   (max 5 recommended)
   One row per decision. The left line inks downward with scroll (rAF-throttled); a row is "current" when its node
   is the last one above the viewport centre. No horizontal scrolling at any width.
   Reduced motion: fully inked, last row current, no transitions.
   Events: pm:map:progress { progress, current } */
(function () {
  'use strict';
  const NS = (window.PairaMotion = window.PairaMotion || {});
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DEFAULTS = {
    nodes: [],
    labels: { kicker: 'Decision', chose: 'We chose', gaveUp: 'We gave up', why: 'Why' },
    centre: 0.5,          // fraction of the viewport height that counts as the reading line
    ariaLabel: 'Design decision map'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function h(tag, cls, html) { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; }
  function readInlineConfig(root) {
    const s = root.querySelector('script[type="application/json"][data-pm-config]');
    if (!s) return {};
    try { return JSON.parse(s.textContent); } catch (e) { console.warn('[paira-m-map] bad JSON', e); return {}; }
  }

  function build(root, cfg) {
    root.innerHTML = '';
    root.setAttribute('aria-label', cfg.ariaLabel);
    const L = Object.assign({}, DEFAULTS.labels, cfg.labels);
    root.append(h('div', 'paira-m-map__line', '<i></i>'));
    const rows = h('ol', 'paira-m-map__rows');
    cfg.nodes.forEach((n, i) => {
      const li = h('li', 'paira-m-map__row'); li.dataset.index = i;
      li.innerHTML =
        '<span class="paira-m-map__node" aria-hidden="true"></span>' +
        '<div class="paira-m-map__q"><p class="paira-m-map__kicker">' + esc(L.kicker) + ' ' + String(i + 1).padStart(2, '0') + '</p><h3 class="paira-m-map__question">' + esc(n.question) + '</h3></div>' +
        '<div class="paira-m-map__cols">' +
          '<div class="paira-m-map__col paira-m-map__col--chose"><span>' + esc(L.chose) + '</span><p>' + esc(n.chose) + '</p></div>' +
          '<div class="paira-m-map__col paira-m-map__col--gave"><span>' + esc(L.gaveUp) + '</span><p>' + esc(n.gaveUp) + '</p></div>' +
          '<div class="paira-m-map__col paira-m-map__col--why"><span>' + esc(L.why) + '</span><p>' + esc(n.why) + '</p></div>' +
        '</div>';
      rows.append(li);
    });
    root.append(rows);
    return { rows: [...rows.children], nodes: [...rows.querySelectorAll('.paira-m-map__node')] };
  }

  function init(root, overrides) {
    if (!root || root.dataset.pmReady) return null;
    root.dataset.pmReady = '1';
    const cfg = Object.assign({}, DEFAULTS, readInlineConfig(root), overrides || {});
    if (!cfg.nodes.length) return null;
    const ui = build(root, cfg);
    const n = ui.rows.length;
    let progress = -1, current = -2;

    function apply(p, cur) {
      p = Math.max(0, Math.min(1, p));
      if (p === progress && cur === current) return;
      progress = p; current = cur;
      root.style.setProperty('--pm-progress', p.toFixed(4));
      ui.rows.forEach((r, i) => {
        r.classList.toggle('is-current', i === cur);
        r.classList.toggle('is-passed', i < cur);
        r.setAttribute('aria-current', i === cur ? 'step' : 'false');
      });
      root.dispatchEvent(new CustomEvent('pm:map:progress', { bubbles: true, detail: { progress: p, current: cur } }));
    }
    if (REDUCED) { apply(1, n - 1); return { root, config: cfg, update: () => {} }; }

    let ticking = false;
    function update() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const mid = window.innerHeight * cfg.centre;
        const rootTop = root.getBoundingClientRect().top, rootH = root.offsetHeight;
        const p = rootH > 0 ? (mid - rootTop) / rootH : 1;
        let cur = -1;
        ui.nodes.forEach((d, i) => { if (d.getBoundingClientRect().top + d.offsetHeight / 2 <= mid) cur = i; });
        apply(p, cur);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return { root, config: cfg, update };
  }

  NS.map = { init, DEFAULTS };
  function auto() { document.querySelectorAll('[data-pm-map]').forEach(el => init(el)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();


/* ---- 08-lifecycle ---- */
/* 08 · Request lifecycle (v2)
   <ol class="paira-m-life" data-pm-life data-pm-skin="dark"><script type="application/json" data-pm-config>{…}</script></ol>
   Per step (≈ 1.1 s): line segment draws → node lights → caption fades in → the mini request card updates
   (status chip + state row). Plays once on enter, Replay control. Reduced motion → final state.
   step: { label, caption, side: 'seeker'|'helper' (helper → violet node/label), chip: { kind: open|responded|received|progress|chatting|completed, label }, due, boost,
           state: { text, muted, button, avatars:[initials], reply:{ name, text }, bubble:{ meta, text } } }
   Events: pm:life:start, pm:life:step {index}, pm:life:complete */
(function () {
  'use strict';
  const NS = (window.PairaMotion = window.PairaMotion || {});
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DEFAULTS = {
    title: 'Request lifecycle',
    card: { title: 'Prep me for my PM internship interviews', meta: 'Mock Interview · Technology · $30 reward', due: 'Due in 3 days' },
    steps: [
      { label: 'Post', caption: 'One sentence becomes a request.', chip: { kind: 'open', label: 'Open' }, state: { muted: 'No responds yet', button: 'Invite helpers' } },
      { label: 'Browse', caption: 'Helpers see needs, not profiles.', side: 'helper', chip: { kind: 'open', label: 'Open' }, state: { avatars: ['HT', 'CA', 'PS'], text: '3 helpers see it' } },
      { label: 'Respond', caption: 'A reply with a reason.', side: 'helper', chip: { kind: 'responded', label: 'Responded' }, state: { avatars: ['HT'], reply: { name: 'Harry Thompson', text: 'I ran mock loops last spring, happy to help.' } } },
      { label: 'Select', caption: 'One helper chosen, others told.', chip: { kind: 'progress', label: 'In Progress' }, state: { avatars: ['HT'], text: 'Harry chosen', muted: 'others told' } },
      { label: 'Chat', caption: 'The AI writes the introduction.', chip: { kind: 'chatting', label: 'Chatting' }, state: { bubble: { meta: 'AI introduction', text: 'Hi Harry, Olivia is prepping for PM internship interviews and wants one honest mock run.' } } }
    ],
    finalStep: { chip: { kind: 'completed', label: 'Completed' }, state: { avatars: ['HT'], text: 'Harry marked it done', muted: '· 45 min' } },   // optional extra beat; null to skip
    replayLabel: 'Replay',
    stepMs: 1100, startDelay: 300, threshold: 0.5, autoplay: true, ariaLabel: 'Request lifecycle'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function h(tag, cls, html) { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; }
  function readInlineConfig(root) {
    const s = root.querySelector('script[type="application/json"][data-pm-config]');
    if (!s) return {};
    try { return JSON.parse(s.textContent); } catch (e) { console.warn('[paira-m-life] bad JSON', e); return {}; }
  }
  const HOURGLASS = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 2h8M4 14h8M5 2c0 3 3 4 3 6s-3 3-3 6M11 2c0 3-3 4-3 6s3 3 3 6"/></svg>';
  const BOLT = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9 1 3 9h4l-1 6 6-8H8z"/></svg>';
  const chip = (kind, label, icon) => '<span class="paira-m-life__chip paira-m-life__chip--' + esc(kind) + '">' + (icon || '') + esc(label) + '</span>';
  function stateHTML(st) {
    if (!st) return '';
    let s = '';
    if (st.avatars) s += '<span class="paira-m-life__avatars" aria-hidden="true">' + st.avatars.map(a => '<i class="paira-m-life__avatar">' + esc(a) + '</i>').join('') + '</span>';
    if (st.reply) s += '<span class="paira-m-life__reply"><b>' + esc(st.reply.name) + '</b><span>' + esc(st.reply.text) + '</span></span>';
    else if (st.bubble) s += '<span class="paira-m-life__bubble"><span>' + esc(st.bubble.meta) + '</span>' + esc(st.bubble.text) + '</span>';
    else {
      if (st.text) s += '<span>' + esc(st.text) + '</span>';
      if (st.muted) s += '<span class="paira-m-life__muted">' + esc(st.muted) + '</span>';
    }
    if (st.button) s += '<span class="paira-m-life__btn">' + esc(st.button) + '</span>';
    return s;
  }

  function init(root, overrides) {
    if (!root || root.dataset.pmReady) return null;
    root.dataset.pmReady = '1';
    const cfg = Object.assign({}, DEFAULTS, readInlineConfig(root), overrides || {});
    const beats = cfg.steps.map((s, i) => Object.assign({ index: i }, s)).concat(cfg.finalStep ? [Object.assign({ index: cfg.steps.length - 1, extra: true }, cfg.finalStep)] : []);
    const n = cfg.steps.length;
    root.innerHTML = '';
    root.setAttribute('aria-label', cfg.ariaLabel);
    root.style.setProperty('--pm-n', n);
    root.style.setProperty('--pm-step-ms', cfg.stepMs + 'ms');

    const head = h('div', 'paira-m-life__head');
    const replay = h('button', 'paira-m-life__replay', '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6"/><path d="M3 3v3h3"/></svg>' + esc(cfg.replayLabel));
    replay.type = 'button';
    head.append(h('p', 'paira-m-life__title', esc(cfg.title)), replay);
    const track = h('ol', 'paira-m-life__track');
    track.innerHTML = '<svg class="paira-m-life__rail" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true"><line class="paira-m-life__rail-base" x1="0" y1="1" x2="100" y2="1"/><line class="paira-m-life__rail-ink" x1="0" y1="1" x2="100" y2="1" pathLength="1"/></svg>';
    cfg.steps.forEach(s => track.append(h('li', 'paira-m-life__step' + (s.side === 'helper' ? ' paira-m-life__step--helper' : ''), '<span class="paira-m-life__dot" aria-hidden="true"></span><span class="paira-m-life__label">' + esc(s.label) + '</span>' + (s.caption ? '<p class="paira-m-life__caption">' + esc(s.caption) + '</p>' : ''))));
    const card = h('div', 'paira-m-life__card');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = '<div class="paira-m-life__chips"></div><p class="paira-m-life__card-title">' + esc(cfg.card.title) + '</p><p class="paira-m-life__card-meta">' + esc(cfg.card.meta) + '</p><div class="paira-m-life__state"></div>';
    const frame = h('div', 'paira-m-life__frame'); frame.append(card);
    root.append(head, track, frame);
    const steps = [...track.querySelectorAll('.paira-m-life__step')];
    const chips = card.querySelector('.paira-m-life__chips'), state = card.querySelector('.paira-m-life__state');

    /* reserve the height of the tallest state / chip row so nothing below the card moves during playback */
    function reserve() {
      let maxS = 0, maxC = 0;
      beats.forEach(b => {
        const m = h('div', 'paira-m-life__state-inner is-measure', stateHTML(b.state)); state.append(m); maxS = Math.max(maxS, m.offsetHeight); m.remove();
        let html = chip(b.chip.kind, b.chip.label);
        if (b.due || (b.due !== false && cfg.card.due && b.chip.kind !== 'completed')) html += chip('due', b.due || cfg.card.due, HOURGLASS);
        if (b.boost) html += chip('boost', b.boost === true ? 'Boosted' : b.boost, BOLT);
        const c = h('div', 'paira-m-life__chips is-measure', html); card.append(c); maxC = Math.max(maxC, c.offsetHeight); c.remove();
      });
      // Measure the card at its tallest, then let the card itself wrap its content:
      // only the outer frame keeps the reserved height (Olivia: card may wrap, frame stays stable).
      root.style.setProperty('--pm-state-h', (maxS + 12) + 'px');   // + padding-top (.7rem ≈ 11px)
      root.style.setProperty('--pm-chips-h', maxC + 'px');
      const wrap = card.parentElement && card.parentElement.classList.contains('paira-m-life__frame') ? card.parentElement : null;
      if (wrap) {
        const tallest = card.offsetHeight;
        wrap.style.minHeight = tallest + 'px';
        root.style.setProperty('--pm-state-h', '0px');
        root.style.setProperty('--pm-chips-h', '0px');
      }
    }
    reserve();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);   // re-measure once web fonts are in
    if ('ResizeObserver' in window) { let w = root.clientWidth; new ResizeObserver(() => { if (root.clientWidth !== w) { w = root.clientWidth; reserve(); } }).observe(root); }

    let timers = [], playing = false;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const d = ms => (REDUCED ? 0 : ms);

    function setChips(beat) {
      let html = chip(beat.chip.kind, beat.chip.label);
      if (beat.due || (beat.due !== false && cfg.card.due && beat.chip.kind !== 'completed')) html += chip('due', beat.due || cfg.card.due, HOURGLASS);
      if (beat.boost) html += chip('boost', beat.boost === true ? 'Boosted' : beat.boost, BOLT);
      chips.innerHTML = html;
      if (!REDUCED) chips.firstElementChild.classList.add('is-swap');
    }
    function setState(beat) {
      const old = state.querySelector('.paira-m-life__state-inner.is-in');
      if (old) { old.classList.remove('is-in'); old.classList.add('is-out'); setTimeout(() => old.remove(), 320); }
      const inner = h('div', 'paira-m-life__state-inner', stateHTML(beat.state));
      state.append(inner);
      requestAnimationFrame(() => requestAnimationFrame(() => inner.classList.add('is-in')));
    }
    function light(i) {
      steps.forEach((s, k) => { s.classList.toggle('is-lit', k <= i); s.classList.toggle('is-current', k === i); s.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      root.style.setProperty('--pm-progress', n > 1 ? (i / (n - 1)).toFixed(4) : 1);
    }
    function beat(b) {
      // line draws first, node lights mid-draw, caption follows, card updates last
      later(() => light(b.index), d(Math.round(cfg.stepMs * 0.3)));
      later(() => { card.classList.add('is-in'); setChips(b); setState(b); root.dispatchEvent(new CustomEvent('pm:life:step', { bubbles: true, detail: { index: b.index, extra: !!b.extra } })); }, d(Math.round(cfg.stepMs * 0.55)));
    }
    function finalState() {
      clear(); light(n - 1);
      const last = beats[beats.length - 1];
      card.classList.add('is-in'); setChips(last); setState(last);
      playing = false; replay.disabled = false; root.dataset.played = '1';
      root.dispatchEvent(new CustomEvent('pm:life:complete', { bubbles: true }));
    }
    function reset() {
      clear();
      steps.forEach(s => { s.classList.remove('is-lit', 'is-current'); s.setAttribute('aria-current', 'false'); });
      root.style.setProperty('--pm-progress', 0);
      card.classList.remove('is-in'); chips.innerHTML = ''; state.innerHTML = '';
    }
    function play() {
      if (playing) return;
      playing = true; replay.disabled = true;
      root.dispatchEvent(new CustomEvent('pm:life:start', { bubbles: true }));
      if (REDUCED) { finalState(); return; }
      reset();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        let t = cfg.startDelay;
        beats.forEach(b => { later(() => beat(b), t); t += cfg.stepMs; });
        later(() => { playing = false; replay.disabled = false; root.dataset.played = '1'; root.dispatchEvent(new CustomEvent('pm:life:complete', { bubbles: true })); }, t + 200);
      }));
    }
    replay.addEventListener('click', play);
    if (REDUCED) finalState();
    else if (cfg.autoplay && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting && !root.dataset.played) { io.disconnect(); play(); } }), { threshold: cfg.threshold });
      io.observe(root);
    } else if (cfg.autoplay) play();
    return { play, reset, finalState, root, config: cfg };
  }

  NS.life = { init, DEFAULTS };
  function auto() { document.querySelectorAll('[data-pm-life]').forEach(el => init(el)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();

