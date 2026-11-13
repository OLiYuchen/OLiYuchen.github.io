/* Home v2: the constellation.

   Placement is a fixed composition, not a formula. Every figure carries a
   normalised position: nx and ny run -1 to 1 across the field's own ellipse,
   so the whole arrangement stretches with the window and keeps its shape.
   The solver turns one dial — figure size — until nothing crowds anything.

   Reading order, outward from the middle:
     ring 0  she is the centre, with her name under her
     ring 1  who she is          small, named
     ring 2  the featured work   large, named
     ring 3  made off the screen small, named only when read
*/

const IMG = '/assets/img/home-v2/';

const ROSE = '#c08ba0';
const VIOLET = '#8b7fd4';

/* Figures of one rank take the same area, so a wide scene and a standing doll
   carry the same visual weight. 1 is the rank's own share. */
const POSE_AREA = {
  'me-portrait': 1.0,
  'me-paira': 1.0,
  'me-ecoscan': 1.0,
  'me-merlin': 1.0,
  'me-game': 1.0,
  'me-cats': 0.9,
};

const NODES = [
  /* ---- the centre ------------------------------------------------------- */
  { id:'me', ring:0, nx:0, ny:0, img:'me-portrait', label:'Olivia Feng', accent:ROSE,
    kicker:'Product designer and manager',
    title:'Hi, I am Olivia.',
    text:'I turn ambiguous questions into flows, stories, prototypes and artifacts people can respond to. Click me to see what the inner ring is about.',
    tags:['0 to 1 product','UX research','Brand and motion'] },

  /* ---- ring 1: who she is ----------------------------------------------- */
  { id:'skills', ring:1, nx:0.00, ny:-0.70, img:'me-skills', label:'Skills', accent:ROSE,
    kicker:'What I bring', title:'Research rigor, visual sensitivity, calm systems.',
    text:'Product strategy and UX research through to interaction design, design systems and AI experience design. Plus the making side: prototyping, design engineering, CAD and physical computing.',
    tags:['Product strategy','UX research','AI experience design','Design engineering'], href:'/about/' },

  { id:'work', ring:1, nx:-0.40, ny:0.13, img:'me-work', label:'Work', accent:ROSE,
    kicker:'Where I have worked', title:'Five places, one habit.',
    text:'Product designer at Paira through its App Store launch. Strategy and PMO intern at Fosun International in Shanghai. Research assistant at UW HCDE. Vice president at WEGET Magazine. UX researcher and designer at the Cornell Lab of Ornithology.',
    tags:['Paira','Fosun','UW HCDE','Cornell Lab','WEGET'], href:'/about/' },

  { id:'school', ring:1, nx:0.42, ny:0.13, img:'me-school', label:'Education', accent:VIOLET,
    kicker:'University of Washington', title:'Design, engineering, and a little neuroscience.',
    text:'B.S. in Human-Centered Design and Engineering with a minor in Neural Computation and Engineering, 2026. Now an M.S. in Technology Innovation at UW GIX with a CS and HCI focus, expected 2028.',
    tags:['UW HCDE','Neural Computation','UW GIX'], href:'/about/' },

  { id:'base', ring:1, nx:0.00, ny:0.99, img:'me-base', label:'Redmond, WA', accent:VIOLET,
    kicker:'Shanghai to Redmond', title:'Born and raised in Shanghai, now in Redmond, WA.',
    text:'A life of ink, movement, friendship and making outside the screen. Usually with two cats nearby.',
    tags:['Redmond, WA','Shanghai','Two cats'], href:'/about/' },

  /* ---- ring 2: the featured work ---------------------------------------- */
  { id:'paira', ring:2, nx:-0.47, ny:-0.37, img:'me-paira', label:'Paira', accent:'#605cff',
    kicker:'0 to 1 product', title:'Paira',
    text:'A request-first help network where AI writes the ask and finds the person.',
    tags:['0 to 1 product','AI flows','Brand and launch'],
    media:'/assets/img/paira/paira-home-overview.webp', href:'/paira/' },

  { id:'ecoscan', ring:2, nx:0.48, ny:-0.36, img:'me-ecoscan', label:'EcoScan', accent:'#70a9a1',
    kicker:'Rapid prototype', title:'EcoScan',
    text:'Scan-based grocery UX translating food labels into personal priorities.',
    tags:['Team leadership','App flow','Rapid prototype'],
    media:'/assets/img/home/ecoscan.webp', href:'/ecoscan/' },

  { id:'game', ring:2, nx:-0.56, ny:0.60, img:'me-game', label:'Common Ground', accent:'#c98a56',
    kicker:'Game design', title:'Common Ground',
    text:'A cooperative card game where teamwork becomes the winning mechanic.',
    tags:['Mechanics','Rule system','Playtesting'],
    media:'/assets/img/home/game-overview.webp', href:'/game/' },

  { id:'merlin', ring:2, nx:0.56, ny:0.60, img:'me-merlin', label:'Merlin Bird ID', accent:'#d98589',
    kicker:'Research-led strategy', title:'Merlin Bird ID',
    text:'Research-led product strategy helping novice birders stay engaged.',
    tags:['UX research','Synthesis','Opportunity framing'],
    media:'/assets/img/home/merlin-bird-id.webp', href:'/merlin/' },

  /* ---- ring 3: made outside the screen ----------------------------------- */
  { id:'cats', ring:3, nx:-0.76, ny:-0.66, img:'me-cats', label:'Two cats', accent:VIOLET,
    kicker:'Companion', title:'Usually made with two cats nearby.',
    text:'They supervise everything on this site.',
    tags:['Two cats'], href:'/about/', media:'/assets/img/about-hobbies-collage.jpg' },

  { id:'calligraphy', ring:3, nx:0.76, ny:-0.66, img:'me-minimal', label:'Calligraphy', accent:VIOLET,
    todo:'Olivia kneeling at a low desk with a brush, a sheet of paper under it.',
    kicker:'10+ years of practice', title:'Two scripts, one long practice.',
    text:'Traditional Chinese calligraphy has stayed with me for more than a decade. Along the way I taught myself English calligraphy in Engrosser’s Script.',
    tags:['Chinese','Engrosser’s Script'], href:'/about/', media:'/assets/img/home/header-calligraphy.webp' },

  { id:'tennis', ring:3, nx:-0.95, ny:-0.06, img:'me-tennis', label:'Tennis', accent:VIOLET,
    kicker:'Curious by default', title:'Tennis and badminton.',
    text:'Two more that are better with people than alone.',
    tags:['Tennis','Badminton'], href:'/about/' },

  { id:'bouldering', ring:3, nx:0.97, ny:-0.02, img:'me-climb', label:'Bouldering', accent:VIOLET,
    kicker:'Curious by default', title:'Better with friends.',
    text:'An ENFJ who keeps picking up social hobbies. Bouldering is the one that stuck.',
    tags:['Bouldering'], href:'/about/' },

  { id:'physical', ring:3, nx:-0.92, ny:0.74, img:'me-commute', label:'Physical computing', accent:VIOLET,
    todo:'Olivia at a bench with a breadboard and a few wires.',
    kicker:'Explorations', title:'Sensor and touch logic.',
    text:'Circuits, sensors and interactions that live off the screen.',
    tags:['Arduino','Sensors'], media:'/assets/img/home/physical-computing.webp', href:'/explorations/#physical-computing' },

  { id:'fabrication', ring:3, nx:0.92, ny:0.75, img:'me-minimal', label:'Fabrication', accent:VIOLET,
    todo:'Olivia holding a flat-pack part, a laser-cut sheet beside her.',
    kicker:'Explorations', title:'Laser-cut structure.',
    text:'Flat-pack builds, soft goods and the drawings behind them.',
    tags:['CAD','Laser cutting','Soft goods'], media:'/assets/img/explorations/assets-assignment-3-process-10-assemble.webp', href:'/explorations/#flat-pack-laptop-stand' },

  { id:'archive', ring:3, nx:-0.45, ny:0.97, img:'me-casual', label:'Skill archive', accent:VIOLET,
    todo:'Olivia holding a small stack of finished objects.',
    kicker:'Explorations', title:'The full skill archive.',
    text:'Side projects that stretch prototyping, fabrication and technical craft.',
    tags:['Archive'], media:'/assets/img/explorations/assets-final-cover-process.webp', href:'/explorations/' },
];

/* ---------------------------------------------------------------------- */

const field = document.querySelector('[data-field]');
let orbitSvg = null, orbitEls = [];
const card = document.querySelector('[data-card]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* How much of the field's half-width and half-height nx = 1 and ny = 1 reach.
   A narrow window pulls the edge figures in, because a figure there has the
   same minimum size whatever the screen and would otherwise hang off it. */
function spread(W) {
  if (W < 620) return [0.37, 0.45];
  if (W < 900) return [0.42, 0.45];
  return [0.47, 0.44];
}

/* The two drawn orbits, as a share of that same ellipse. */
const ORBITS = [[0.59, 0.58], [0.99, 0.93]];

/* A rank's weight is the side of a notional square. Area, not height, is what
   makes a wide scene and a standing doll read as the same rank. */
const WEIGHT = { 0: 1.0, 1: 0.42, 2: 0.72, 3: 0.315 };

/* How far each rank drifts under the pointer. The loose figures at the edge
   move most, she moves least, and the field gains depth without anything
   actually moving on the page. */
const DEPTH = { 0: 2, 1: 7, 2: 11, 3: 18 };

const SQUIGGLES = [
  'M3 6.4C14 1.9 26 1.9 37 5.5s23 3.5 38-1.3',
  'M3 5.4c10 3.4 21 3.4 31 .2s23-3.4 40 1.6',
  'M2 6.2c12-4.1 24-4.1 36 0s26 3.1 40-1.7',
];

function svgSquiggle(i) {
  return '<svg class="hv2-squiggle" viewBox="0 0 80 9" preserveAspectRatio="none" aria-hidden="true">' +
         '<path d="' + SQUIGGLES[i % SQUIGGLES.length] + '" /></svg>';
}

function build() {
  const sky = document.createElement('div');
  sky.className = 'hv2-orbits';
  sky.innerHTML =
    '<svg aria-hidden="true">' +
    ORBITS.map((o, i) => '<ellipse class="hv2-orbit hv2-orbit-' + i + '" />').join('') +
    '</svg>';
  field.appendChild(sky);
  orbitSvg = sky.querySelector('svg');
  orbitEls = [...sky.querySelectorAll('ellipse')];

  const halo = document.createElement('div');
  halo.className = 'hv2-halo';
  halo.setAttribute('aria-hidden', 'true');
  field.appendChild(halo);

  NODES.forEach((n, i) => {
    const el = document.createElement(n.href ? 'a' : 'button');
    el.className = 'hv2-node' + (n.ring === 0 ? ' hv2-node-centre' : '');
    if (n.href) { el.href = n.href; } else { el.type = 'button'; }
    el.dataset.id = n.id;
    el.dataset.ring = n.ring;
    if (n.todo) el.dataset.todo = n.todo;
    el.style.setProperty('--accent', n.accent);
    el.style.setProperty('--dur', (5.2 + (i % 7) * 0.95).toFixed(2) + 's');
    el.style.setProperty('--delay', (-(i * 0.83) % 7).toFixed(2) + 's');
    el.style.setProperty('--amp', (5 + (i % 4) * 2.2).toFixed(1) + 'px');
    el.style.setProperty('--rot', ((i % 2 ? 1 : -1) * (0.5 + (i % 3) * 0.28)).toFixed(2) + 'deg');
    el.setAttribute('aria-label', n.label + '. ' + n.title);
    el.innerHTML =
      '<span class="hv2-node-inner">' +
        '<span class="hv2-node-plate" aria-hidden="true"></span>' +
        '<img src="' + IMG + n.img + '.webp" alt="" decoding="async" />' +
        '<span class="hv2-node-label">' +
          '<span class="hv2-node-name">' + n.label + '</span>' + svgSquiggle(i) +
        '</span>' +
      '</span>';
    n.el = el;
    n.img_el = el.querySelector('img');
    n.label_el = el.querySelector('.hv2-node-label');
    field.appendChild(el);
  });
}

/* One pass of the composition at a given figure size. */
function apply(base, W, H) {
  const cx = W / 2, cy = H / 2;
  const sp = spread(W), SX = sp[0], SY = sp[1];
  const ax = W * SX, ay = H * SY;

  if (orbitSvg) {
    orbitSvg.setAttribute('viewBox', '0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0));
    orbitEls.forEach((el, i) => {
      el.setAttribute('cx', cx.toFixed(1));
      el.setAttribute('cy', cy.toFixed(1));
      el.setAttribute('rx', (ORBITS[i][0] * ax).toFixed(1));
      el.setAttribute('ry', (ORBITS[i][1] * ay).toFixed(1));
    });
  }
  const floor = W < 560 ? 20 : 30;

  NODES.forEach(n => {
    const side = Math.max(floor, base * WEIGHT[n.ring]);
    const area = side * side * (POSE_AREA[n.img] || 1);
    const ratio = (n.img_el.naturalWidth && n.img_el.naturalHeight)
      ? n.img_el.naturalWidth / n.img_el.naturalHeight : 0.6;
    n.el.style.setProperty('--figh', Math.sqrt(area / ratio).toFixed(1) + 'px');

    const y = cy + n.ny * ay;
    n.el.style.setProperty('--x', (n.nx * SX * 100).toFixed(2));
    n.el.style.setProperty('--y', (n.ny * SY * 100).toFixed(2));
    n.el.style.zIndex = String(Math.round(300 + (y - cy) / H * 400));
  });
}

/* The rectangle a figure really occupies: the clay plus the name under it. */
function boxOf(n, pad) {
  const a = n.img_el.getBoundingClientRect();
  let left = a.left, right = a.right, top = a.top, bottom = a.bottom;
  if (n.label_el && getComputedStyle(n.label_el).opacity !== '0') {
    const b = n.label_el.getBoundingClientRect();
    if (b.width) {
      left = Math.min(left, b.left); right = Math.max(right, b.right);
      top = Math.min(top, b.top); bottom = Math.max(bottom, b.bottom);
    }
  }
  return { left: left - pad, right: right + pad, top: top - pad, bottom: bottom + pad,
           width: (right - left) + 2 * pad, height: (bottom - top) + 2 * pad };
}

function collides(limit, pad) {
  const boxes = NODES.map(n => boxOf(n, pad || 0));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 0 && oy > 0) {
        const smaller = Math.min(a.width * a.height, b.width * b.height);
        if (smaller > 0 && (ox * oy) / smaller > limit) return true;
      }
    }
  }
  return false;
}

/* Nothing may hang off the top or the bottom of the field either. */
function overflows(pad) {
  const f = field.getBoundingClientRect();
  return NODES.some(n => {
    const b = boxOf(n, 0);
    return b.top < f.top - pad || b.bottom > f.bottom + pad;
  });
}

/* Give the field exactly the height the window has left over, measured rather
   than inherited. Leaving it to the grid's free space worked here and
   collapsed on her machine, where the row fell to nothing and the field was
   held up only by its minimum. Measuring cannot drift that way. */
function fitField() {
  const used = ['.hv2-draftbar', '.hv2-top', '.hv2-foot'].reduce((sum, sel) => {
    const el = document.querySelector(sel);
    return sum + (el ? el.getBoundingClientRect().height : 0);
  }, 0);
  const h = Math.max(300, Math.round(window.innerHeight - used));
  field.style.height = h + 'px';
  return h;
}

function layout() {
  fitField();
  const box = field.getBoundingClientRect();
  const W = box.width, H = box.height;
  if (!W || !H) return;
  // Hold everything still while solving. A drifting figure means every pass
  // reads a different instant, and a figure still growing in from the
  // entrance reads smaller than it will be.
  field.classList.add('is-measuring');
  NODES.forEach(n => n.el.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} }));
  const pad = Math.max(5, Math.min(W, H) * 0.009);
  let base = H * 0.215;
  for (let pass = 0; pass < 26; pass++) {
    apply(base, W, H);
    if (!collides(0.03, pad) && !overflows(2)) break;
    base *= 0.95;
  }
  for (let pass = 0; pass < 12; pass++) {
    const bigger = base * 1.035;
    apply(bigger, W, H);
    if (collides(0.03, pad) || overflows(2)) { apply(base, W, H); break; }
    base = bigger;
  }
  field.classList.remove('is-measuring');
}

/* ---------- the pointer parallax ------------------------------------------ */

let aimX = 0, aimY = 0, curX = 0, curY = 0, drifting = false;

function drift() {
  curX += (aimX - curX) * 0.07;
  curY += (aimY - curY) * 0.07;
  NODES.forEach(n => {
    const d = DEPTH[n.ring];
    n.el.style.setProperty('--ox', (curX * d).toFixed(2) + 'px');
    n.el.style.setProperty('--oy', (curY * d * 0.6).toFixed(2) + 'px');
  });
  field.style.setProperty('--drift-x', (curX * 10).toFixed(2) + 'px');
  field.style.setProperty('--drift-y', (curY * 6).toFixed(2) + 'px');
  if (Math.abs(aimX - curX) > 0.001 || Math.abs(aimY - curY) > 0.001) {
    requestAnimationFrame(drift);
  } else { drifting = false; }
}

function nudge(x, y) {
  aimX = x; aimY = y;
  if (!drifting) { drifting = true; requestAnimationFrame(drift); }
}

/* ---------- the card ------------------------------------------------------ */

function openLabel(href) {
  if (href.startsWith('/about')) return 'Open the About page';
  if (href.startsWith('/explorations')) return 'Open the skill archive';
  return 'Open the case study';
}

function fillCard(n) {
  card.style.setProperty('--accent', n.accent);
  card.innerHTML =
    (n.media ? '<img class="hv2-card-media" src="' + n.media + '" alt="" />' : '') +
    '<div class="hv2-card-body">' +
      '<p class="hv2-card-kicker">' + n.kicker + '</p>' +
      '<h2 class="hv2-card-title">' + n.title + '</h2>' +
      '<p class="hv2-card-text">' + n.text + '</p>' +
      '<div class="hv2-card-tags">' + n.tags.map(t => '<span>' + t + '</span>').join('') + '</div>' +
      (n.href
        ? '<p class="hv2-card-open">' + openLabel(n.href) + ' <span aria-hidden="true">&#8594;</span></p>'
        : '<p class="hv2-card-hint">Click to light the inner ring</p>') +
      (n.todo && document.body.classList.contains('show-todo-notes')
        ? '<p class="hv2-card-todo">Clay pose still to make: ' + n.todo + '</p>' : '') +
    '</div>';
}

function placeCard(el) {
  const r = el.getBoundingClientRect();
  const w = card.offsetWidth, h = card.offsetHeight, gap = 16;
  let x = r.right + gap;
  if (x + w > window.innerWidth - 12) x = r.left - gap - w;
  if (x < 12) x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
  let y = Math.min(Math.max(12, r.top + r.height / 2 - h / 2), window.innerHeight - h - 12);
  card.style.left = Math.round(x) + 'px';
  card.style.top = Math.round(y) + 'px';
}

let openId = null;

function open(el) {
  const n = NODES.find(x => x.id === el.dataset.id);
  if (!n || openId === n.id) return;
  openId = n.id;
  fillCard(n);
  card.classList.add('is-open');
  requestAnimationFrame(() => placeCard(el));
  field.classList.add('is-reading');
  NODES.forEach(x => {
    x.el.classList.toggle('is-active', x.el === el);
    x.el.classList.toggle('is-kin', x !== n && x.ring === n.ring);
  });
}

function close() {
  openId = null;
  card.classList.remove('is-open');
  field.classList.remove('is-reading');
  NODES.forEach(x => x.el.classList.remove('is-active', 'is-kin'));
}

function wire() {
  NODES.forEach(n => {
    const el = n.el;
    el.addEventListener('pointerenter', () => open(el));
    el.addEventListener('focus', () => open(el));
    el.addEventListener('pointerleave', close);
    el.addEventListener('blur', close);
    if (n.ring === 0) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const on = field.classList.toggle('is-about');
        NODES.forEach(x => x.el.classList.toggle('is-kin', on && x.ring === 1));
      });
    }
  });
  field.addEventListener('pointerleave', () => { close(); nudge(0, 0); });
  window.addEventListener('scroll', () => { if (openId) close(); }, { passive: true });

  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    field.addEventListener('pointermove', (e) => {
      const r = field.getBoundingClientRect();
      nudge((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
    }, { passive: true });
  }

  const todoBtn = document.querySelector('[data-todo-toggle]');
  todoBtn.addEventListener('click', () => {
    const on = field.classList.toggle('show-todo');
    document.body.classList.toggle('show-todo-notes', on);
    todoBtn.textContent = on ? 'Hide the poses still to make' : 'Show the poses still to make';
  });
}

/* The figures arrive from the middle outward, so the eye lands on her first. */
function entrance() {
  if (reduced) return;
  [...NODES].sort((a, b) => a.ring - b.ring).forEach((n, i) => {
    n.el.animate(
      [{ opacity: 0, scale: .74 }, { opacity: 1, scale: 1 }],
      { duration: 820, delay: 110 + i * 52, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
    );
  });
}

/* Print which build this is, so a stale copy is obvious instead of being
   mistaken for a layout that went wrong. */
function stamp() {
  const me = document.querySelector('script[src*="home-v2.js"]');
  const v = me && new URL(me.src, location.href).searchParams.get('v');
  const bar = document.querySelector('.hv2-draftbar span');
  if (!bar) return;
  const f = field.getBoundingClientRect();
  const c = NODES[0].img_el.getBoundingClientRect();
  const boxes = NODES.map(n => boxOf(n, 0));
  const l = Math.min(...boxes.map(b => b.left)), r = Math.max(...boxes.map(b => b.right));
  const t = Math.min(...boxes.map(b => b.top)), bo = Math.max(...boxes.map(b => b.bottom));
  bar.dataset.base = bar.dataset.base || bar.textContent;
  bar.textContent = bar.dataset.base +
    '  ·  build ' + v +
    '  ·  window ' + window.innerWidth + 'x' + window.innerHeight +
    ' dpr' + (window.devicePixelRatio || 1) +
    '  ·  field ' + Math.round(f.width) + 'x' + Math.round(f.height) +
    '  ·  me ' + Math.round(c.height) +
    '  ·  fills ' + Math.round(100 * (r - l) / f.width) + '%x' + Math.round(100 * (bo - t) / f.height) + '%';
}

build();
layout();
stamp();
wire();
entrance();

let resizeTimer;
const relayout = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(layout, 110); };
window.addEventListener('resize', relayout);
window.addEventListener('orientationchange', relayout);
if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(document.body);

/* The first pass runs before the figures have arrived, so it measures boxes
   that are not their real shape and settles on a smaller scale than the field
   can take. These three run it again once the page is actually itself. */
Promise.all(
  [...field.querySelectorAll('img')].map(img =>
    img.decode ? img.decode().catch(() => {}) : Promise.resolve())
).then(layout);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
window.addEventListener('load', () => { layout(); stamp(); });
window.setTimeout(() => { layout(); stamp(); }, 2200);
