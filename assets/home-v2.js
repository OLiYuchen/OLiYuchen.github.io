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
  'me-tennis': 1.25,
  'me-climb': 1.15,
  'me-base': 0.85,
  'me-casual': 0.8,
};

const NODES = [
  /* ---- the centre ------------------------------------------------------- */
  { id:'me', ring:0, nx:0, ny:0, img:'me-portrait', label:'Olivia Feng', accent:ROSE,
    kicker:'Product designer and manager',
    title:'Hi, I am Olivia.',
    text:'I turn ambiguous questions into flows, stories, prototypes and artifacts people can respond to.',
    tags:['0 to 1 product','UX research','Brand and motion'], href:'/about/' },

  /* ---- ring 1: who she is ----------------------------------------------- */
  { id:'skills', ring:1, nx:0.17, ny:-0.82, img:'me-skills', label:'Skills', accent:ROSE,
    kicker:'What I bring', title:'Research rigor, visual sensitivity, calm systems.',
    text:'Product strategy and UX research through to interaction design, design systems and AI experience design. Plus the making side: prototyping, design engineering, CAD and physical computing.',
    tags:['Product strategy','UX research','AI experience design','Design engineering'], href:'/about/#about-skills-title' },

  { id:'work', ring:1, nx:-0.41, ny:0.15, img:'me-work', label:'Work', accent:ROSE,
    kicker:'Where I have worked', title:'Five places, one habit.',
    text:'Product designer at Paira through its App Store launch. Strategy and PMO intern at Fosun International in Shanghai. Research assistant at UW HCDE. Vice president at WEGET Magazine. UX researcher and designer at the Cornell Lab of Ornithology.',
    tags:['Paira','Fosun','UW HCDE','Cornell Lab','WEGET'], href:'/about/#about-experience-title' },

  { id:'school', ring:1, nx:0.43, ny:0.16, img:'me-school', label:'Education', accent:VIOLET,
    kicker:'University of Washington', title:'Design, engineering, and a little neuroscience.',
    text:'B.S. in Human-Centered Design and Engineering with a minor in Neural Computation and Engineering, 2026. Now an M.S. in Technology Innovation at UW GIX with a CS and HCI focus, expected 2028.',
    tags:['UW HCDE','Neural Computation','UW GIX'], href:'/about/#about-education-title' },

  { id:'base', ring:3, nx:0.33, ny:0.98, img:'me-base', label:'Redmond, WA', accent:VIOLET,
    kicker:'Shanghai to Redmond', title:'Born and raised in Shanghai, now in Redmond, WA.',
    text:'A life of ink, movement, friendship and making outside the screen. Usually with two cats nearby.',
    tags:['Redmond, WA','Shanghai','Two cats'] },

  /* ---- ring 2: the featured work ---------------------------------------- */
  { id:'paira', ring:2, nx:-0.44, ny:-0.44, img:'me-paira', label:'Paira', accent:'#605cff',
    kicker:'0 to 1 product', title:'Paira',
    text:'A request-first help network where AI writes the ask and finds the person.',
    tags:['0 to 1 product','AI flows','Brand and launch'],
    media:'/assets/img/paira/paira-home-overview.webp', href:'/paira/' },

  { id:'ecoscan', ring:2, nx:0.53, ny:-0.39, img:'me-ecoscan', label:'EcoScan', accent:'#70a9a1',
    kicker:'Rapid prototype', title:'EcoScan',
    text:'Scan-based grocery UX translating food labels into personal priorities.',
    tags:['Team leadership','App flow','Rapid prototype'],
    media:'/assets/img/home/ecoscan.webp', href:'/ecoscan/' },

  { id:'game', ring:2, nx:-0.57, ny:0.73, img:'me-game', label:'Common Ground', accent:'#c98a56',
    kicker:'Game design', title:'Common Ground',
    text:'A cooperative card game where teamwork becomes the winning mechanic.',
    tags:['Mechanics','Rule system','Playtesting'],
    media:'/assets/img/home/game-overview.webp', href:'/game/' },

  { id:'merlin', ring:2, nx:0.60, ny:0.66, img:'me-merlin', label:'Merlin Bird ID', accent:'#d98589',
    kicker:'Research-led strategy', title:'Merlin Bird ID',
    text:'Research-led product strategy helping novice birders stay engaged.',
    tags:['UX research','Synthesis','Opportunity framing'],
    media:'/assets/img/home/merlin-bird-id.webp', href:'/merlin/' },

  /* ---- ring 3: made outside the screen ----------------------------------- */
  { id:'cats', ring:3, nx:-0.79, ny:-0.72, img:'me-cats', label:'Two cats', accent:VIOLET,
    kicker:'Companion', title:'Usually made with two cats nearby.',
    text:'They supervise everything on this site.',
    tags:['Two cats'], media:'/assets/img/about-hobbies-collage.jpg' },

  { id:'calligraphy', ring:3, nx:0.76, ny:-0.66, img:'me-minimal', label:'Calligraphy', accent:VIOLET,
    todo:'Olivia kneeling at a low desk with a brush, a sheet of paper under it.',
    kicker:'10+ years of practice', title:'Two scripts, one long practice.',
    text:'Traditional Chinese calligraphy has stayed with me for more than a decade. Along the way I taught myself English calligraphy in Engrosser’s Script.',
    tags:['Chinese','Engrosser’s Script'], media:'/assets/img/home/header-calligraphy.webp' },

  { id:'tennis', ring:3, nx:-0.99, ny:-0.10, img:'me-tennis', label:'Tennis', accent:VIOLET,
    kicker:'Curious by default', title:'Tennis and badminton.',
    text:'Two more that are better with people than alone.',
    tags:['Tennis','Badminton'] },

  { id:'bouldering', ring:3, nx:1.05, ny:-0.01, img:'me-climb', label:'Bouldering', accent:VIOLET,
    kicker:'Curious by default', title:'Better with friends.',
    text:'An ENFJ who keeps picking up social hobbies. Bouldering is the one that stuck.',
    tags:['Bouldering'] },

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

  { id:'archive', ring:3, nx:-0.34, ny:0.98, img:'me-casual', label:'Skill archive', accent:VIOLET,
    todo:'Olivia holding a small stack of finished objects.',
    kicker:'Explorations', title:'The full skill archive.',
    text:'Side projects that stretch prototyping, fabrication and technical craft.',
    tags:['Archive'], media:'/assets/img/explorations/assets-final-cover-process.webp', href:'/explorations/' },
];

/* ---------------------------------------------------------------------- */

const field = document.querySelector('[data-field]');
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

/* A rank's weight is the side of a notional square. Area, not height, is what
   makes a wide scene and a standing doll read as the same rank. */
const WEIGHT = { 0: 1.0, 1: 0.42, 2: 0.72, 3: 0.315 };

function build() {
  NODES.forEach((n, i) => {
    const el = document.createElement(n.href ? 'a' : 'button');
    el.className = 'hv2-node' + (n.ring === 0 ? ' hv2-node-centre' : '');
    if (n.href) { el.href = n.href; } else { el.type = 'button'; }
    el.dataset.id = n.id;
    el.dataset.ring = n.ring;
    if (n.todo) el.dataset.todo = n.todo;
    el.style.setProperty('--accent', n.accent);
    el.setAttribute('aria-label', n.label + '. ' + n.title);
    el.innerHTML =
      '<span class="hv2-node-inner">' +
        '<span class="hv2-node-plate" aria-hidden="true"></span>' +
        '<img src="' + IMG + n.img + '.webp" alt="" decoding="async" />' +
        '<span class="hv2-node-label">' + n.label +
          (n.ring === 0 ? '<span class="hv2-node-badge" aria-hidden="true">+</span>' : '') +
        '</span>' +
      '</span>';
    n.el = el;
    n.img_el = el.querySelector('img');
    n.label_el = el.querySelector('.hv2-node-label');
    field.appendChild(el);
  });
}

/* ---------------------------------------------------------------------------
   Placing them

   The reference's whole trick is that the gaps between objects are even. Hand
   positions never are: tune one figure and the two beside it go wrong. So the
   positions in NODES are a starting arrangement, not the final one. Each pass
   drops the figures there, measures the box each one really occupies, and
   then lets them push each other apart until every gap is about the same.

   Three things hold the arrangement together while that happens: she is
   pinned to the exact middle, every figure is on a weak spring back to where
   it started, and nothing may leave the field. What comes out keeps the shape
   of the composition and loses its unevenness.
   --------------------------------------------------------------------------- */

/* Give every figure its size, and put it where NODES says. */
function place(base, W, H) {
  const sp = spread(W), SX = sp[0], SY = sp[1];
  const floor = W < 560 ? 20 : 30;
  NODES.forEach(n => {
    const side = Math.max(floor, base * WEIGHT[n.ring]);
    const area = side * side * (POSE_AREA[n.img] || 1);
    const ratio = (n.img_el.naturalWidth && n.img_el.naturalHeight)
      ? n.img_el.naturalWidth / n.img_el.naturalHeight : 0.6;
    n.el.style.setProperty('--figh', Math.sqrt(area / ratio).toFixed(1) + 'px');
    n.homeX = W / 2 + n.nx * W * SX;
    n.homeY = H / 2 + n.ny * H * SY;
    n.x = n.homeX; n.y = n.homeY;
    write(n, W, H);
  });
}

function write(n, W, H) {
  n.el.style.setProperty('--x', ((n.x - W / 2) / W * 100).toFixed(3));
  n.el.style.setProperty('--y', ((n.y - H / 2) / H * 100).toFixed(3));
  n.el.style.zIndex = String(Math.round(300 + (n.y - H / 2) / H * 400));
}

/* How far each figure's box reaches from the point it stands on. Measured
   once per size, because it only changes when the figure does. */
function readOffsets() {
  const f = field.getBoundingClientRect();
  NODES.forEach(n => {
    const b = boxOf(n, 0);
    const ax = f.left + n.x, ay = f.top + n.y;
    n.o = { l: b.left - ax, r: b.right - ax, t: b.top - ay, b: b.bottom - ay };
  });
  const cta = document.querySelector('.hv2-cta');
  obstacle = cta ? (() => {
    const r = cta.getBoundingClientRect();
    return { left: r.left - f.left, right: r.right - f.left, top: r.top - f.top, bottom: r.bottom - f.top };
  })() : null;
}

let obstacle = null;

function rectOf(n) {
  return { left: n.x + n.o.l, right: n.x + n.o.r, top: n.y + n.o.t, bottom: n.y + n.o.b };
}

/* Zero when two rectangles touch or overlap, otherwise the shortest distance
   between them. This, not centre to centre, is what the eye reads as a gap. */
function rectGap(a, b) {
  const dx = Math.max(0, Math.max(a.left - b.right, b.left - a.right));
  const dy = Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom));
  return Math.hypot(dx, dy);
}

/* Push everything apart, and pull the stragglers back in, until the gaps even
   out. Repulsion alone only guarantees a floor: it leaves some pairs at the
   target and others twice as far, which is exactly the unevenness that reads
   as hand-placed. So a pair that is among each other's four nearest also gets
   a weak pull when it drifts too far, and the two forces together settle
   every close pair at about the same distance. */
function relax(W, H, target) {
  const M = Math.max(8, Math.min(W, H) * 0.012);   // the margin of the table
  const N = NODES.length;
  const NEAR = 4;

  for (let pass = 0; pass < 320; pass++) {
    const rects = NODES.map(rectOf);
    const push = NODES.map(() => ({ x: 0, y: 0 }));
    const gaps = [];
    for (let i = 0; i < N; i++) gaps.push(new Array(N).fill(Infinity));

    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++)
        gaps[i][j] = gaps[j][i] = rectGap(rects[i], rects[j]);

    // who each figure is actually standing next to
    const near = [];
    for (let i = 0; i < N; i++) {
      const order = [];
      for (let j = 0; j < N; j++) if (j !== i) order.push([gaps[i][j], j]);
      order.sort((a, b) => a[0] - b[0]);
      near.push(new Set(order.slice(0, NEAR).map(o => o[1])));
    }

    const nudge = (i, j, f, rects) => {
      const acx = (rects[i].left + rects[i].right) / 2, acy = (rects[i].top + rects[i].bottom) / 2;
      const bcx = (rects[j].left + rects[j].right) / 2, bcy = (rects[j].top + rects[j].bottom) / 2;
      let vx = acx - bcx, vy = acy - bcy;
      const len = Math.hypot(vx, vy) || 1;
      vx /= len; vy /= len;
      push[i].x += vx * f; push[i].y += vy * f;
      push[j].x -= vx * f; push[j].y -= vy * f;
    };

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const gap = gaps[i][j];
        if (gap < target) {
          nudge(i, j, (target - gap) * 0.22, rects);
        } else if (gap < target * 3 && (near[i].has(j) || near[j].has(i))) {
          nudge(i, j, -(gap - target) * 0.045, rects);   // a pull, not a push
        }
      }
      if (obstacle) {
        const gap = rectGap(rects[i], obstacle);
        if (gap < target) {
          const acx = (rects[i].left + rects[i].right) / 2, acy = (rects[i].top + rects[i].bottom) / 2;
          const ocx = (obstacle.left + obstacle.right) / 2, ocy = (obstacle.top + obstacle.bottom) / 2;
          let vx = acx - ocx, vy = acy - ocy;
          const len = Math.hypot(vx, vy) || 1;
          const f = (target - gap) * 0.3;
          push[i].x += vx / len * f; push[i].y += vy / len * f;
        }
      }
    }

    NODES.forEach((n, i) => {
      if (n.ring === 0) return;                       // she does not move
      n.x += push[i].x + (n.homeX - n.x) * 0.018;     // a weak spring home
      n.y += push[i].y + (n.homeY - n.y) * 0.018;
      // Stay on the table. A figure whose home is hard against the side may
      // keep a third of itself off the edge, which is what the reference does
      // with the shirt and the jumper.
      const bleed = Math.abs(n.nx) > 0.9 ? (n.o.r - n.o.l) * 0.34 : 0;
      n.x = Math.min(Math.max(n.x, M - n.o.l - bleed), W - M - n.o.r + bleed);
      n.y = Math.min(Math.max(n.y, M - n.o.t), H - M - n.o.b);
    });
  }

  NODES.forEach(n => { if (n.ring !== 0) write(n, W, H); });
}

/* The smallest gap on the page, and how uneven the gaps are. */
function spacing() {
  const rects = NODES.map(rectOf);
  let min = Infinity;
  const nearest = rects.map((r, i) => {
    let best = Infinity;
    rects.forEach((o, j) => { if (i !== j) best = Math.min(best, rectGap(r, o)); });
    min = Math.min(min, best);
    return best;
  });
  const mean = nearest.reduce((a, b) => a + b, 0) / nearest.length;
  const sd = Math.sqrt(nearest.reduce((a, b) => a + (b - mean) * (b - mean), 0) / nearest.length);
  return { min: min, mean: mean, cv: mean ? sd / mean : 0 };
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
  const used = ['.hv2-draftbar', '.site-header', '.hv2-foot'].reduce((sum, sel) => {
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
  // Hold everything still while solving, so the entrance fade cannot be
  // measured halfway through.
  field.classList.add('is-measuring');
  NODES.forEach(n => n.el.getAnimations({ subtree: true })
    .forEach(a => { try { a.finish(); } catch (e) {} }));

  // One try at a given size: drop them, measure, even the gaps out, and say
  // whether the result is clean.
  const want = b => Math.max(10, b * 0.26);
  const tryBase = (b) => {
    place(b, W, H);
    readOffsets();
    relax(W, H, want(b));
    const s = spacing();
    return s.min >= want(b) * 0.62 && !overflows(2);
  };

  let base = H * 0.26;
  for (let pass = 0; pass < 26; pass++) {
    if (tryBase(base)) break;
    base *= 0.95;
  }
  for (let pass = 0; pass < 10; pass++) {
    const bigger = base * 1.035;
    if (!tryBase(bigger)) { tryBase(base); break; }
    base = bigger;
  }
  field.classList.remove('is-measuring');
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
        : '') +
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

/* The page fades in once, from the middle outward, and then holds still. */
function entrance() {
  if (reduced) return;
  [...NODES].sort((a, b) => a.ring - b.ring).forEach((n, i) => {
    n.el.animate([{ opacity: 0 }, { opacity: 1 }],
      { duration: 620, delay: 90 + i * 38, easing: 'ease-out', fill: 'backwards' });
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
  const sp = spacing();
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
    '  ·  fills ' + Math.round(100 * (r - l) / f.width) + '%x' + Math.round(100 * (bo - t) / f.height) + '%' +
    '  ·  gaps min ' + Math.round(sp.min) + ' mean ' + Math.round(sp.mean) +
    ' cv ' + sp.cv.toFixed(2);
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
