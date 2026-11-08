/* Home v2: the constellation.
   One array describes every node. Angle is degrees clockwise from the top,
   radius is a share of the field width, scale is the node's width in the
   same unit. Everything else is content. */

const IMG = '/assets/img/home-v2/';

/* Figures of one rank take the same area, so a wide scene and a standing
   doll carry the same visual weight. A pose only needs an entry here to take
   more or less room than its rank, and 1 is the rank's own share. */
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
  { id:'me', ring:0, a:0, rj:1, s:13, img:'me-portrait', label:'Olivia Feng',
    kicker:'Product designer and manager',
    title:'Hi, I am Olivia.',
    text:'I turn ambiguous questions into flows, stories, prototypes and artifacts people can respond to. Click me to see what the inner ring is about.',
    tags:['0 to 1 product','UX research','Brand and motion'] },

  /* ---- ring 1: who she is ----------------------------------------------- */
  { id:'work', ring:1, a:2, rj:1.0, s:6.5, img:'me-work', label:'Work',
    kicker:'Where I have worked', title:'Five places, one habit.',
    text:'Product designer at Paira through its App Store launch. Strategy and PMO intern at Fosun International in Shanghai. Research assistant at UW HCDE. Vice president at WEGET Magazine. UX researcher and designer at the Cornell Lab of Ornithology.',
    tags:['Paira','Fosun','UW HCDE','Cornell Lab','WEGET'], href:'/about/' },

  { id:'skills', ring:1, a:92, rj:1.03, s:6.36, img:'me-skills', label:'Skills',
    kicker:'What I bring', title:'Research rigor, visual sensitivity, calm systems.',
    text:'Product strategy and UX research through to interaction design, design systems and AI experience design. Plus the making side: prototyping, design engineering, CAD and physical computing.',
    tags:['Product strategy','UX research','AI experience design','Design engineering'], href:'/about/' },

  { id:'school', ring:1, a:180, rj:0.98, s:6.46, img:'me-school', label:'School',
    kicker:'University of Washington', title:'Design, engineering, and a little neuroscience.',
    text:'B.S. in Human-Centered Design and Engineering with a minor in Neural Computation and Engineering, 2026. Now an M.S. in Technology Innovation at UW GIX with a CS and HCI focus, expected 2028.',
    tags:['UW HCDE','Neural Computation','UW GIX'], href:'/about/' },

  { id:'base', ring:1, a:270, rj:1.01, s:6.4, img:'me-base', label:'Based in Redmond',
    kicker:'Shanghai to Redmond', title:'Born and raised in Shanghai, now in Redmond, WA.',
    text:'A life of ink, movement, friendship and making outside the screen. Usually with two cats nearby.',
    tags:['Redmond, WA','Shanghai','Two cats'], href:'/about/' },

  /* ---- ring 2: the featured work ---------------------------------------- */
  { id:'paira', ring:2, a:44, rj:1.0, s:11.0, img:'me-paira', label:'Paira',
    kicker:'0 to 1 product', title:'Paira',
    text:'A request-first help network where AI writes the ask and finds the person.',
    tags:['0 to 1 product','AI flows','Brand and launch'],
    media:'/assets/img/paira/paira-home-overview.webp', href:'/paira/' },

  { id:'ecoscan', ring:2, a:317, rj:1.02, s:10.86, img:'me-ecoscan', label:'EcoScan',
    kicker:'Rapid prototype', title:'EcoScan',
    text:'Scan-based grocery UX translating food labels into personal priorities.',
    tags:['Team leadership','App flow','Rapid prototype'],
    media:'/assets/img/home/ecoscan.webp', href:'/ecoscan/' },

  { id:'merlin', ring:2, a:226, rj:0.97, s:11.1, img:'me-merlin', label:'Merlin Bird ID',
    kicker:'Research-led strategy', title:'Merlin Bird ID',
    text:'Research-led product strategy helping novice birders stay engaged.',
    tags:['UX research','Synthesis','Opportunity framing'],
    media:'/assets/img/home/merlin-bird-id.webp', href:'/merlin/' },

  { id:'game', ring:2, a:135, rj:1.01, s:10.95, img:'me-game', label:'Common Ground',
    kicker:'Game design', title:'Common Ground',
    text:'A cooperative card game where teamwork becomes the winning mechanic.',
    tags:['Mechanics','Rule system','Playtesting'],
    media:'/assets/img/home/game-overview.webp', href:'/game/' },

  /* ---- ring 3: made outside the screen ----------------------------------- */
  { id:'calligraphy', ring:3, a:20, rj:1.0, s:4.56, img:'me-minimal', label:'Calligraphy',
    todo:'Olivia kneeling at a low desk with a brush, a sheet of paper under it.',
    kicker:'10+ years of practice', title:'Two scripts, one long practice.',
    text:'Traditional Chinese calligraphy has stayed with me for more than a decade. Along the way I taught myself English calligraphy in Engrosser’s Script.',
    tags:['Chinese','Engrosser’s Script'], href:'/about/', media:'/assets/img/home/header-calligraphy.webp' },

  { id:'physical', ring:3, a:128, rj:0.98, s:4.4, img:'me-commute', label:'Physical computing',
    todo:'Olivia at a bench with a breadboard and a few wires.',
    kicker:'Explorations', title:'Sensor and touch logic.',
    text:'Circuits, sensors and interactions that live off the screen.',
    tags:['Arduino','Sensors'], media:'/assets/img/home/physical-computing.webp', href:'/explorations/#physical-computing' },

  { id:'fabrication', ring:3, a:164, rj:1.02, s:4.52, img:'me-minimal', label:'Fabrication',
    todo:'Olivia holding a flat-pack part, a laser-cut sheet beside her.',
    kicker:'Explorations', title:'Laser-cut structure.',
    text:'Flat-pack builds, soft goods and the drawings behind them.',
    tags:['CAD','Laser cutting','Soft goods'], media:'/assets/img/explorations/assets-assignment-3-process-10-assemble.webp', href:'/explorations/#flat-pack-laptop-stand' },

  { id:'bouldering', ring:3, a:200, rj:0.97, s:4.38, img:'me-climb', label:'Bouldering',
    kicker:'Curious by default', title:'Better with friends.',
    text:'An ENFJ who keeps picking up social hobbies. Bouldering is the one that stuck.',
    tags:['Bouldering'], href:'/about/' },

  { id:'tennis', ring:3, a:236, rj:1.01, s:4.46, img:'me-tennis', label:'Tennis',
    kicker:'Curious by default', title:'Tennis and badminton.',
    text:'Two more that are better with people than alone.',
    tags:['Tennis','Badminton'], href:'/about/' },

  { id:'cats', ring:3, a:308, rj:1.03, s:4.4, img:'me-cats', label:'Two cats',
    kicker:'Companion', title:'Usually made with two cats nearby.',
    text:'They supervise everything on this site.',
    tags:['Two cats'], href:'/about/', media:'/assets/img/about-hobbies-collage.jpg' },

  { id:'archive', ring:3, a:344, rj:0.98, s:4.48, img:'me-casual', label:'Skill archive',
    todo:'Olivia holding a small stack of finished objects.',
    kicker:'Explorations', title:'The full skill archive.',
    text:'Side projects that stretch prototyping, fabrication and technical craft.',
    tags:['Archive'], media:'/assets/img/explorations/assets-final-cover-process.webp', href:'/explorations/' },
];

/* ---------------------------------------------------------------------- */

const field = document.querySelector('[data-field]');
const card = document.querySelector('[data-card]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const OUTER = NODES.filter(n => n.ring === 3);
const MAX_S = Math.max(...NODES.filter(n => n.ring === 3).map(n => n.s));

/* The field is a staggered lattice, not a set of orbits: regular spacing that
   covers the whole screen, rank carried by size and by how near the middle a
   figure sits. Rows are offset by about a fifth of a cell, so the grid reads
   as a pattern rather than as a spreadsheet. */

function lattice(W, H, n) {
  const cols = Math.max(3, Math.round(Math.sqrt(n * (W / H))));
  const rows = Math.max(2, Math.ceil(n / cols));
  // a margin, so the tallest figure in the top and bottom rows stays inside
  const mx = W * 0.03, my = H * 0.05;
  const cw = (W - 2 * mx) / cols, ch = (H - 2 * my) / rows;
  const pts = [];
  for (let r = 0; r < rows; r++) {
    const shift = (r % 2) ? 0.22 : -0.22;
    for (let c = 0; c < cols; c++) {
      const x = mx + Math.min((cols - 0.34) * cw, Math.max(cw * 0.34, (c + 0.5 + shift) * cw));
      pts.push({ x: x, y: my + (r + 0.5) * ch });
    }
  }
  return { pts: pts, cw: cw, ch: ch };
}

/* Take k points from the pool, placed around the middle rather than bunched to
   one side. The near ranks take the middle; the outer band takes the far
   points, which fills the edges of the field instead of leaving the spare
   lattice points stranded in the corners. */
function pick(pool, k, cx, cy, far) {
  const ang = p => Math.atan2(p.y - cy, p.x - cx);
  const d = p => Math.hypot(p.x - cx, p.y - cy);
  const near = pool.slice().sort((a, b) => far ? d(b) - d(a) : d(a) - d(b))
    .slice(0, Math.min(pool.length, Math.max(k, k * 3)));
  const taken = [];
  while (taken.length < k && near.length) {
    let best = 0;
    if (taken.length) {
      let bestGap = -1;
      near.forEach((p, i) => {
        let gap = Math.PI;
        taken.forEach(t => {
          const d = Math.abs(((ang(p) - ang(t) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
          if (d < gap) gap = d;
        });
        if (gap > bestGap) { bestGap = gap; best = i; }
      });
    }
    const chosen = near.splice(best, 1)[0];
    taken.push(chosen);
    const j = pool.indexOf(chosen);
    if (j >= 0) pool.splice(j, 1);
  }
  return taken;
}

function build() {
  NODES.forEach((n, i) => {
    const el = document.createElement(n.href ? 'a' : 'button');
    el.className = 'hv2-node' + (n.ring === 0 ? ' hv2-node-centre' : '');
    if (n.href) { el.href = n.href; } else { el.type = 'button'; }
    el.dataset.id = n.id;
    el.dataset.ring = n.ring;
    if (n.todo) el.dataset.todo = n.todo;
    el.style.setProperty('--dur', (7.5 + (i % 5) * 1.4) + 's');
    el.style.setProperty('--delay', (-(i * 0.73) % 6).toFixed(2) + 's');
    el.setAttribute('aria-label', n.label + '. ' + n.title);
    el.innerHTML =
      '<span class="hv2-node-inner">' +
        '<span class="hv2-node-plate" aria-hidden="true"></span>' +
        '<img src="' + IMG + n.img + '.webp" alt="" decoding="async" />' +
        '<span class="hv2-node-label">' + n.label + '</span>' +
      '</span>';
    n.el = el;
    field.appendChild(el);
  });
}

/* One pass of the layout at a given figure scale. */
const RANK_S = { 0: 13, 1: 6.43, 2: 10.98, 3: 4.46 };

function apply(base, W, H) {
  const grid = lattice(W, H, NODES.length);
  const cell = Math.min(grid.cw, grid.ch);
  // Size is a share of the cell, not a free number, so the figures and the
  // spacing stay in proportion whatever the screen does. base is the one dial
  // the solver turns.
  // Even steps, so each rank is unmistakably a rank: about one and a half
  // times the next in size, which is roughly twice the area. The old steps
  // ran 1.10, 1.54, 1.33, and the first was too small to read as a step.
  const RANK = { 0: 1.18, 1: 0.52, 2: 0.80, 3: 0.34 };
  const floor = W < 560 ? 22 : 32;
  const size = n => Math.max(floor, cell * RANK[n.ring] * (base / 1000) * (n.s / RANK_S[n.ring]));

  const pool = grid.pts.slice();
  const cx = W / 2, cy = H / 2;

  // Rank decides the size and how near the middle a figure lands. Inside a
  // rank the points are chosen to sit around the middle rather than beside
  // each other, so the four featured scenes hold the four quarters.
  [0, 1, 2, 3].forEach(r => {
    const group = NODES.filter(n => n.ring === r);
    pick(pool, group.length, cx, cy, r === 3).forEach((pt, i) => { group[i].pt = pt; });
  });

  NODES.forEach((n, i) => {
    const el = n.el;
    // A rank's weight is the side of a notional square; the pose keeps its own
    // proportions and is scaled to fill that much area.
    const side = size(n);
    const area = side * side * (POSE_AREA[n.img] || 1);
    const img = el.querySelector('img');
    const ratio = (img.naturalWidth && img.naturalHeight)
      ? img.naturalWidth / img.naturalHeight : 0.6;
    el.style.setProperty('--figh', Math.sqrt(area / ratio).toFixed(1) + 'px');

    // a hair of jitter, so a regular grid does not read as a spreadsheet
    const jx = (((i * 37) % 11) - 5) / 5 * grid.cw * 0.05;
    const jy = (((i * 23) % 9) - 4) / 4 * grid.ch * 0.05;
    const x = (n.pt ? n.pt.x : cx) + jx;
    const y = (n.pt ? n.pt.y : cy) + jy;
    el.style.setProperty('--x', ((x - cx) / W * 100).toFixed(2));
    el.style.setProperty('--y', ((y - cy) / H * 100).toFixed(2));
    el.style.zIndex = String(Math.round(300 + (y - cy) / H * 400));
  });
}

/* Does any pair of figures sit on top of another by more than a sliver? */
function collides(limit, pad) {
  const p = pad || 0;
  const boxes = NODES.map(n => {
    const r = n.el.querySelector('img').getBoundingClientRect();
    return { left: r.left - p, right: r.right + p, top: r.top - p, bottom: r.bottom + p,
             width: r.width + 2 * p, height: r.height + 2 * p };
  });
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

/* Lay out, check, and step the figures down until nothing crowds. This is why
   the page holds its shape on a screen I have not seen. */
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
  // entrance reads smaller than it will be, which is how the solver came to
  // believe a centre half again too big would fit.
  field.classList.add('is-measuring');
  NODES.forEach(n => n.el.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} }));
  const pad = Math.max(7, Math.min(W, H) * 0.012);
  let base = 1000;
  for (let pass = 0; pass < 20; pass++) {
    apply(base, W, H);
    if (!collides(0.03, pad)) break;
    base *= 0.94;
  }
  for (let pass = 0; pass < 12; pass++) {
    const bigger = base * 1.04;
    apply(bigger, W, H);
    if (collides(0.03, pad)) { apply(base, W, H); break; }
    base = bigger;
  }
  field.classList.remove('is-measuring');
}

/* Say where a click goes, in the card, before it is clicked. */
function openLabel(href) {
  if (href.startsWith('/about')) return 'Open the About page';
  if (href.startsWith('/explorations')) return 'Open the skill archive';
  return 'Open the case study';
}

function fillCard(n) {
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
  field.addEventListener('pointerleave', close);
  window.addEventListener('scroll', () => { if (openId) close(); }, { passive: true });

  const todoBtn = document.querySelector('[data-todo-toggle]');
  todoBtn.addEventListener('click', () => {
    const on = field.classList.toggle('show-todo');
    document.body.classList.toggle('show-todo-notes', on);
    todoBtn.textContent = on ? 'Hide the poses still to make' : 'Show the poses still to make';
  });
}

function entrance() {
  if (reduced) return;
  [...NODES].sort((a, b) => a.ring - b.ring).forEach((n, i) => {
    n.el.animate(
      [{ opacity: 0, scale: .72 }, { opacity: 1, scale: 1 }],
      { duration: 760, delay: 90 + i * 55, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
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
  const c = NODES[0].el.querySelector('img').getBoundingClientRect();
  const boxes = NODES.map(n => n.el.querySelector('img').getBoundingClientRect());
  const l = Math.min(...boxes.map(b => b.left)), r = Math.max(...boxes.map(b => b.right));
  const t = Math.min(...boxes.map(b => b.top)), bo = Math.max(...boxes.map(b => b.bottom));
  bar.dataset.base = bar.dataset.base || bar.textContent;
  bar.textContent = bar.dataset.base +
    '  ·  build ' + v +
    '  ·  window ' + window.innerWidth + 'x' + window.innerHeight +
    ' dpr' + (window.devicePixelRatio || 1) +
    '  ·  rows ' + ['.hv2-draftbar', '.hv2-top', '.hv2-foot']
        .map(sel => Math.round(document.querySelector(sel).getBoundingClientRect().height)).join('/') +
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
   can take. Nothing changes size afterwards, so nothing would have corrected
   it. These three run it again once the page is actually itself. */
Promise.all(
  [...field.querySelectorAll('img')].map(img =>
    img.decode ? img.decode().catch(() => {}) : Promise.resolve())
).then(layout);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
window.addEventListener('load', () => { layout(); stamp(); });
window.setTimeout(() => { layout(); stamp(); }, 2200);
