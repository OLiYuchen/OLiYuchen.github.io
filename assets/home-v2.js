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

/* The arrangement is the reference's own, measured off it and normalised to
   this field's ellipse: the laptop's place, the espresso maker's place, the
   car's, the clogs', the jumper's, the shirt's, the coffee's, the scent's,
   the shoes', the book's, the blender's. The solver evens the gaps from
   there; this is where it starts. */
/* Where the art actually is inside each picture: its middle across, and
   how far down its feet are. Several of the new pieces carry a wide
   transparent margin, and a tag hung off the picture's edge floats away
   from the thing it names. Measured from the alpha channel. */
// x0 and x1 are the same alpha measurement sideways: where the figure really
// starts and stops inside its picture. The hover card sits off those, so it
// keeps one distance from every figure rather than from every picture box.
const ART = {
  'me-calligraphy': { cx: 0.510, foot: 0.984, x0: 0.000, x1: 0.999 },
  'me-climb': { cx: 0.500, foot: 0.992, x0: 0.000, x1: 1.000 },
  'me-ecoscan': { cx: 0.490, foot: 0.985, x0: 0.000, x1: 1.000 },
  'me-popo': { cx: 0.500, foot: 1.000, x0: 0.000, x1: 1.000 },
  'me-explorations': { cx: 0.515, foot: 0.963, x0: 0.000, x1: 0.989 },
  'me-game': { cx: 0.497, foot: 1.000, x0: 0.000, x1: 1.000 },
  'me-merlin-2': { cx: 0.547, foot: 0.963, x0: 0.000, x1: 0.974 },
  'me-paira': { cx: 0.496, foot: 0.986, x0: 0.000, x1: 1.000 },
  'me-portrait': { cx: 0.531, foot: 1.000, x0: 0.000, x1: 1.000 },
  'me-skills-2': { cx: 0.545, foot: 0.910, x0: 0.229, x1: 0.862 },
  'me-tennis': { cx: 0.505, foot: 1.000, x0: 0.000, x1: 1.000 },
  'me-work-2': { cx: 0.500, foot: 1.000, x0: 0.000, x1: 1.000 },
};

const NODES = [
  /* ---- the centre ------------------------------------------------------- */
  { id:'me', ring:0, cx:0.5000, cy:0.3196, bw:202.8, bh:258.3, mob:{cx:0.500,cy:0.145,bw:116,bh:148}, img:'me-portrait', label:'Olivia Feng', accent:ROSE,
    kicker:'About me',
    title:'Olivia Feng',
    text:'Product designer and manager. 0 to 1 products, research through launch.',
    tags:['0 to 1 product','UX research','Brand and motion'], href:'/about/' },

  /* ---- ring 1: who she is ----------------------------------------------- */
  { id:'skills', ring:1, cx:0.4782, cy:0.7409, bw:190.0, bh:127.0, img:'me-skills-2', label:'Skills', accent:ROSE,
    kicker:'About', title:'Skills',
    text:'Product strategy, UX research, interaction, design systems, AI experience.',
    tags:['Product strategy','UX research','AI experience design','Design engineering'], href:'/about/#about-skills-title' },

  { id:'work', ring:1, cx:0.2966, cy:0.8331, bw:119.0, bh:97.0, img:'me-work-2', label:'Experience', accent:ROSE,
    kicker:'About', title:'Experience',
    text:'Paira, Fosun International, Cornell Lab of Ornithology, UW HCDE, UW GIX.',
    tags:['Paira','Fosun','Cornell Lab','UW HCDE','UW GIX'], href:'/about/#about-experience-title' },

  { id:'popo', ring:1, cx:0.8519, cy:0.5000, bw:122.0, bh:90.0, img:'me-popo', label:'Popo', accent:VIOLET,
    kicker:'Studio supervisor', title:'Popo',
    text:'Sleeps through most of the work, wakes for the parts that matter.',
    tags:['Popo'], media:'/assets/img/about-hobbies-collage.jpg' },

  /* ---- ring 2: the featured work ---------------------------------------- */
  { id:'paira', ring:2, cx:0.3204, cy:0.1399, bw:255.0, bh:168.4, mob:{cx:0.275,cy:0.455,bw:138,bh:91}, img:'me-paira', label:'Paira', accent:'#605cff',
    kicker:'0 to 1 product', title:'Paira',
    text:'Designed a help network where AI writes the ask and finds the person.',
    tags:['0 to 1 product','AI flows','Brand and launch'],
    media:'/assets/img/paira/paira-home-overview.webp', href:'/paira/' },

  { id:'ecoscan', ring:2, cx:0.2911, cy:0.5115, bw:222.2, bh:128.4, mob:{cx:0.275,cy:0.720,bw:136,bh:79}, img:'me-ecoscan', label:'EcoScan', accent:'#70a9a1',
    kicker:'Rapid prototype', title:'EcoScan',
    text:'Designed a scan-first grocery app that reads labels against your priorities.',
    tags:['Team leadership','App flow','Rapid prototype'],
    media:'/assets/img/home/ecoscan.webp', href:'/ecoscan/' },

  { id:'game', ring:2, cx:0.6812, cy:0.5945, bw:188.0, bh:163.3, mob:{cx:0.730,cy:0.700,bw:110,bh:90}, img:'me-game', label:'Common Ground', accent:'#c98a56',
    kicker:'Game design', title:'Common Ground',
    text:'Designed a cooperative card game where teamwork is the winning move.',
    tags:['Mechanics','Rule system','Playtesting'],
    media:'/assets/img/home/game-overview.webp', href:'/game/' },

  { id:'merlin', ring:2, cx:0.6928, cy:0.1705, bw:263.0, bh:148.2, mob:{cx:0.730,cy:0.455,bw:138,bh:78}, img:'me-merlin-2', label:'Merlin Bird ID', accent:'#d98589',
    kicker:'UX research', title:'Merlin Bird ID',
    text:'Ran the research that redefined what a novice birder needs.',
    tags:['UX research','Synthesis','Opportunity framing'],
    media:'/assets/img/home/merlin-bird-id.webp', href:'/merlin/' },

  /* ---- ring 3: made outside the screen ----------------------------------- */
  { id:'calligraphy', ring:3, cx:0.8528, cy:0.8003, bw:159.0, bh:100.0, img:'me-calligraphy', label:'Calligraphy', accent:VIOLET,
    kicker:'Practice', title:'Calligraphy',
    text:'Chinese calligraphy for over ten years, and Engrosser’s Script by hand.',
    tags:['Chinese','Engrosser’s Script'], media:'/assets/img/home/header-calligraphy.webp' },

  { id:'tennis', ring:3, cx:0.1283, cy:0.7081, bw:96.0, bh:120.0, img:'me-tennis', label:'Tennis', accent:VIOLET,
    kicker:'Hobby', title:'Tennis',
    text:'Tennis and badminton, both better with people.',
    tags:['Tennis','Badminton'] },

  { id:'bouldering', ring:3, cx:0.8823, cy:0.2137, bw:86.0, bh:114.0, img:'me-climb', label:'Bouldering', accent:VIOLET,
    kicker:'Hobby', title:'Bouldering',
    text:'The social hobby that stuck.',
    tags:['Bouldering'] },

  { id:'archive', ring:3, cx:0.1138, cy:0.3094, bw:180.0, bh:113.0, img:'me-explorations', label:'Explorations', accent:VIOLET,
    kicker:'Explorations', title:'Explorations',
    text:'Side projects in prototyping, fabrication and technical craft.',
    tags:['Archive'], media:'/assets/img/explorations/assets-final-cover-process.webp', href:'/explorations/' },
];

/* ---------------------------------------------------------------------- */

const field = document.querySelector('[data-field]');
const card = document.querySelector('[data-card]');
// One cue for the whole page, standing where the call to action used to.
const cue = document.querySelector('[data-cue]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        '<span class="hv2-node-label">' + n.label + '</span>' +
      '</span>';
    n.el = el;
    n.img_el = el.querySelector('img');
    n.label_el = el.querySelector('.hv2-node-label');
    // A figure whose image does not arrive renders nothing at all: the height
    // is set and the width follows the picture, so a broken one is zero wide
    // and the figure is simply absent. Ask again once, then lay out again.
    n.img_el.addEventListener('error', () => {
      if (n.retried) return;
      n.retried = true;
      n.img_el.src = IMG + n.img + '.webp?again=' + Date.now();
    });
    n.img_el.addEventListener('load', () => { if (n.retried) layout(); });
    field.appendChild(el);
  });
}

/* ---------------------------------------------------------------------------
   Placing them

   The arrangement is no longer solved. It is hers, made in Figma on a
   1512 x 716 field, and this reproduces it: every figure carries the centre
   of its box as a share of that field, and the box's size in its pixels.

   Two things change with the window. Positions are shares, so the whole
   composition stretches to whatever shape the window is. Sizes take one
   scale, the smaller of the two, so a figure is never stretched with it.

   The only thing left of the old solver is a floor: if a narrow window
   squeezes two figures into each other, everything shrinks a step at a time
   until it stops. On a window shaped anything like the one she drew on, that
   loop does not run at all.
   --------------------------------------------------------------------------- */

const REF_W = 1512, REF_H = 716;

/* The call to action, in her frame: x, y, width, height inside the field. */
const CTA = { x: 612, y: 639, w: 287, h: 59 };

/* A phone is not a small desktop. Her arrangement needs width it does not
   have, and twelve things on a phone is a list, not a picture. So a narrow
   window gets its own frame, its own call to action, and only five figures:
   her, and the four projects. The other seven are not scaled down, they are
   not there. */
const MOB = { w: 390, h: 560, cta: { x: 75, y: 494, w: 240, h: 44 } };
const MOBILE_UNDER = 760;

function frame(W) {
  return W < MOBILE_UNDER
    ? { w: MOB.w, h: MOB.h, cta: MOB.cta, mobile: true }
    : { w: REF_W, h: REF_H, cta: CTA, mobile: false };
}
const cta = document.querySelector('.hv2-cta');

function place(scale, W, H) {
  const F = frame(W);
  // Every tag is the same size. Sizing each off its own figure made twelve
  // slightly different tags, which read as twelve different kinds of label
  // rather than one set; only hers is different, and deliberately.
  field.style.setProperty('--tag', Math.max(10.5, Math.min(13, 12.4 * scale)).toFixed(2) + 'px');
  if (cta) {
    // Over her portrait, on the page's own middle, which is where she stands.
    // Its own width, centred by the stylesheet, so only the height matters.
    const me = NODES.find(n => n.id === 'me');
    const g = me && (F.mobile ? me.mob : me);
    const fs = Math.max(16, Math.min(28, 25 * scale));
    const top = g ? g.cy * H - (g.bh * scale) / 2 : H * 0.2;
    cta.style.setProperty('--cta-fs', fs.toFixed(2) + 'px');
    cta.style.setProperty('--cta-y',
      (top - Math.max(16, 30 * scale) - fs * 1.25).toFixed(1) + 'px');
  }
  NODES.forEach(n => {
    const g = F.mobile ? n.mob : n;
    n.off = !g;
    n.el.hidden = !g;
    if (!g) return;
    const w = g.bw * scale, h = g.bh * scale;
    const art = ART[n.img] || { cx: 0.5, foot: 1 };
    n.el.style.setProperty('--figw', w.toFixed(1) + 'px');
    n.el.style.setProperty('--figh', h.toFixed(1) + 'px');
    // The tag hangs under the art's feet and on the art's own middle, not the
    // picture's edge.
    n.el.style.setProperty('--footpad', ((1 - art.foot) * h).toFixed(1) + 'px');
    n.el.style.setProperty('--artmid', ((art.cx - 0.5) * w).toFixed(1) + 'px');
    const cx = g.cx * W, cy = g.cy * H;
    // The node is anchored where it stands, so --y is the foot of the box.
    n.el.style.setProperty('--x', ((cx - W / 2) / W * 100).toFixed(3));
    n.el.style.setProperty('--y', ((cy + h / 2 - H / 2) / H * 100).toFixed(3));
    n.el.style.zIndex = String(Math.round(300 + (cy - H / 2) / H * 400));
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
  // The cue is not in here. It used to be the call to action, which sat below
  // the figures and had to be kept clear of; a line of type over her portrait
  // would instead push the whole arrangement around, and the arrangement is
  // hers.
  const boxes = NODES.filter(n => !n.off).map(n => boxOf(n, pad || 0));
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
  return NODES.filter(n => !n.off).some(n => {
    const b = boxOf(n, 0);
    return b.top < f.top - pad || b.bottom > f.bottom + pad;
  });
}

/* The smallest gap on the page, and how uneven the gaps are. Reported in the
   draft bar; nothing acts on it any more. */
function spacing() {
  const rects = NODES.filter(n => !n.off).map(n => boxOf(n, 0));
  const gap = (a, b) => Math.hypot(
    Math.max(0, Math.max(a.left - b.right, b.left - a.right)),
    Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom)));
  const nearest = rects.map((r, i) => {
    let best = Infinity;
    rects.forEach((o, j) => { if (i !== j) best = Math.min(best, gap(r, o)); });
    return best;
  });
  const mean = nearest.reduce((x, y) => x + y, 0) / nearest.length;
  const sd = Math.sqrt(nearest.reduce((x, y) => x + (y - mean) * (y - mean), 0) / nearest.length);
  return { min: Math.min(...nearest), mean: mean, cv: mean ? sd / mean : 0 };
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
  field.classList.add('is-measuring');
  NODES.forEach(n => n.el.getAnimations({ subtree: true })
    .forEach(a => { try { a.finish(); } catch (e) {} }));

  const F = frame(W);
  let scale = Math.min(W / F.w, H / F.h);
  place(scale, W, H);
  // Not merely "they do not overlap" but "they are apart": each box is grown
  // by 5px before the test, so two things must leave 10px between them. Her
  // own frame has 43px at its tightest, so on any window near that shape this
  // never runs.
  for (let pass = 0; pass < 20; pass++) {
    if (!collides(0.001, 5) && !overflows(2)) break;
    scale *= 0.97;
    place(scale, W, H);
  }
  field.classList.remove('is-measuring');
}

/* ---------- the card ------------------------------------------------------ */

// What it is and what was done, nothing else. The tags repeated the kicker
// and the sentence, and the three of them together made the card tall.
// The four case studies. Everything else gets the upright card.
// Landscape where the picture is a wide one: the four case studies, the
// explorations, and the two slices of the About page.
const WIDE = new Set(['paira', 'merlin', 'ecoscan', 'game',
                      'archive', 'skills', 'work']);

// The four that carry their own colour. Everything else states its type in
// one neutral, so the colour reads as "this is a case study".
const PROJECTS = new Set(['paira', 'merlin', 'ecoscan', 'game']);

// What the card shows while you hover. Every path here is a file that is
// already on the site; where a figure has only one, the card simply holds it.
const SHOTS = {
  // Two each: the cover this homepage already shows, and the hero image you
  // land on when you click through.
  paira: ['/assets/img/paira/paira-home-overview.webp',
          '/assets/img/paira/paira-hero.webp'],
  merlin: ['/assets/img/home/merlin-bird-id.webp',
           '/assets/img/merlin-bird-id.png'],
  ecoscan: ['/assets/img/home/ecoscan.webp',
            '/assets/img/ecoscan/overview-full.png'],
  game: ['/assets/img/home/game-overview.webp',
         '/assets/img/game/play-full-table.jpg'],
  archive: ['/assets/img/physical-computing-overview.png',
            '/assets/img/explorations/assets-final-cover-process.webp'],
  // Her photographs.
  me: ['/assets/img/home-v2/photos/olivia-portrait.webp'],
  calligraphy: ['/assets/img/home-v2/photos/calligraphy-2026-calendars.webp',
                '/assets/img/home-v2/photos/calligraphy-eva.webp'],
  popo: ['/assets/img/home-v2/photos/popo-in-the-sun.webp'],
  tennis: ['/assets/img/home-v2/photos/tennis-courts-at-dusk.webp'],
  bouldering: ['/assets/img/home-v2/photos/bouldering-wall.webp'],
};



function fillCard(n) {
  card.style.setProperty('--accent', n.accent);
  // A project shows its project picture. Everything else shows its own clay
  // figure, so every card is the same shape rather than some being shorter.
  // Skills and Experience show the About page's own components, shrunk,
  // rather than a picture of them: they stay live at any size.
  const live = window.HV2_ABOUT && window.HV2_ABOUT[n.id];
  const shots = SHOTS[n.id] || [n.media || (IMG + n.img + '.webp')];
  const art = !live && !n.media && !SHOTS[n.id];
  // The four case studies are landscape, because their pictures are. The rest
  // read better upright, which is also the shape of a photograph of a person.
  card.classList.toggle('is-portrait', !WIDE.has(n.id));
  card.classList.toggle('is-plate', WIDE.has(n.id));
  card.classList.toggle('is-project', PROJECTS.has(n.id));
  card.innerHTML =
    (live
      ? '<div class="hv2-card-stack is-live"><div class="hv2-card-live">'
        + live + '</div></div>'
      : '<div class="hv2-card-stack' + (art ? ' is-art' : '') + '">' +
          shots.map((src, i) =>
            '<img class="hv2-card-shot' + (i ? '' : ' is-on') +
            '" src="' + src + '" alt="" decoding="async" />').join('') +
        '</div>') +
    '<div class="hv2-card-body">' +
      '<div class="hv2-card-copy">' +
        '<p class="hv2-card-kicker">' + n.kicker + '</p>' +
        '<p class="hv2-card-text">' + n.text + '</p>' +
      '</div>' +
      (n.href ? '<span class="hv2-card-go" aria-hidden="true">&#8594;</span>' : '') +
    '</div>';
}

function placeCard(el, n) {
  const box = el.getBoundingClientRect();
  // me-skills-2 carries almost a quarter of its width as empty pixels, so
  // measuring from the box put its card much further out than the rest.
  const a = (n && ART[n.img]) || { x0: 0, x1: 1 };
  const r = {
    left: box.left + box.width * a.x0,
    right: box.left + box.width * a.x1,
    width: box.width * (a.x1 - a.x0),
    top: box.top, height: box.height,
  };
  const w = card.offsetWidth, h = card.offsetHeight, gap = 32;
  let x = r.right + gap;
  if (x + w > window.innerWidth - 12) x = r.left - gap - w;
  if (x < 12) x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
  // The cue keeps its place: a card stops short of it rather than over it.
  const q = cue.getBoundingClientRect();
  const floor = Math.min(window.innerHeight - h - 12, q.top - 14 - h);
  let y = Math.min(Math.max(12, r.top + r.height / 2 - h / 2), floor);
  card.style.left = Math.round(x) + 'px';
  card.style.top = Math.round(y) + 'px';
  // Come from the figure: left of it, right of it, or straight up.
  const dx = Math.round(x) > r.left ? -18 : (Math.round(x) + w < r.right ? 18 : 0);
  card.style.setProperty('--from', dx + 'px 14px');
  card.classList.remove('is-pop');
  void card.offsetWidth;
  card.classList.add('is-pop');
}

let openId = null;
let slides = null;
let openHref = null;
// Moving the cursor off the figure and onto the card crosses a gap. Hold the
// card open across it, and let the card itself cancel the close.
let closing = null;

// The photographs change while you hover, rather than one picture sitting
// still. Each shot holds for just under two seconds.
function runSlides() {
  clearInterval(slides);
  const shots = card.querySelectorAll('.hv2-card-shot');
  if (shots.length < 2) return;
  let i = 0;
  slides = setInterval(() => {
    shots[i].classList.remove('is-on');
    i = (i + 1) % shots.length;
    shots[i].classList.add('is-on');
  }, 1900);
}

function open(el) {
  const n = NODES.find(x => x.id === el.dataset.id);
  if (!n || openId === n.id) return;
  openId = n.id;
  fillCard(n);
  clearTimeout(closing);
  openHref = n.href || null;
  card.classList.add('is-open');
  card.classList.toggle('has-link', !!n.href);
  cue.classList.toggle('is-on', !!n.href);
  runSlides();
  requestAnimationFrame(() => placeCard(el, n));
  field.classList.add('is-reading');
  NODES.forEach(x => x.el.classList.toggle('is-active', x.el === el));
}

function close() {
  clearTimeout(closing);
  openId = null;
  openHref = null;
  clearInterval(slides);
  cue.classList.remove('is-on');
  card.classList.remove('is-open', 'is-pop');
  field.classList.remove('is-reading');
  NODES.forEach(x => x.el.classList.remove('is-active'));
}

function wire() {
  NODES.forEach(n => {
    const el = n.el;
    el.addEventListener('pointerenter', () => open(el));
    el.addEventListener('focus', () => open(el));
    el.addEventListener('pointerleave', () => {
      closing = setTimeout(close, 180);
    });
    el.addEventListener('blur', close);
  });

  // The card is part of the thing you are hovering, and it goes where the
  // figure goes when you click it.
  card.addEventListener('pointerenter', () => clearTimeout(closing));
  card.addEventListener('pointerleave', close);
  card.addEventListener('click', () => { if (openHref) window.location.href = openHref; });

  field.addEventListener('pointerleave', () => { closing = setTimeout(close, 180); });
  window.addEventListener('scroll', () => { if (openId) close(); }, { passive: true });


  // Four grounds, to be looked at rather than argued about.
  const PAPERS = ['paper', 'light', 'cream', 'white'];
  // Not [data-paper]: the body carries that attribute once a paper is set,
  // and the body comes first in document order.
  const paperBtn = document.querySelector('[data-paper-toggle]');
  if (paperBtn) {
    const setPaper = (name) => {
      document.body.dataset.paper = name;
      paperBtn.textContent = 'Paper: ' + name;
      try { localStorage.setItem('hv2-paper-2', name); } catch (e) {}
    };
    let saved = null;
    // A new key, so a ground picked while we were looking at it does not come back.
    try { saved = localStorage.getItem('hv2-paper-2'); } catch (e) {}
    setPaper(PAPERS.indexOf(saved) >= 0 ? saved : 'paper');
    paperBtn.addEventListener('click', () => {
      const i = PAPERS.indexOf(document.body.dataset.paper);
      setPaper(PAPERS[(i + 1) % PAPERS.length]);
    });
  }

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
  const boxes = NODES.filter(n => !n.off).map(n => boxOf(n, 0));
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

/* Coming back to this page with the back button restores it from the cache
   with the entrance animations frozen before their delay, which holds those
   figures at nothing. Finish them, then lay out again. */
window.addEventListener('pageshow', () => {
  NODES.forEach(n => n.el.getAnimations({ subtree: true })
    .forEach(a => { try { a.finish(); } catch (e) {} }));
  layout();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  NODES.forEach(n => n.el.getAnimations({ subtree: true })
    .forEach(a => { try { a.finish(); } catch (e) {} }));
});
window.setTimeout(() => { layout(); stamp(); }, 2200);
