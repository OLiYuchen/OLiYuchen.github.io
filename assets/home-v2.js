/* Home v2: the constellation.
   One array describes every node. Angle is degrees clockwise from the top,
   radius is a share of the field width, scale is the node's width in the
   same unit. Everything else is content. */

const IMG = '/assets/img/home-v2/';

/* Orbit geometry. rx is a share of the field's width, ry of its height, so the
   orbits are ellipses that reach the edges of a wide screen instead of a circle
   parked in the middle. Size tiers are deliberate: the featured work is the
   largest thing after her, the inner ring sits well below it, the outer ring
   is small enough to read as texture. */
const RINGS = {
  1: { rx: 17,   ry: 26 },
  2: { rx: 31.5, ry: 38 },
  3: { rx: 45,   ry: 43 },
};

const NODES = [
  /* ---- the centre ------------------------------------------------------- */
  { id:'me', ring:0, a:0, rj:1, s:13, img:'me-hi', label:'Olivia Feng',
    kicker:'Product designer and manager',
    title:'Hi, I am Olivia.',
    text:'I turn ambiguous questions into flows, stories, prototypes and artifacts people can respond to. Click me to see what the inner ring is about.',
    tags:['0 to 1 product','UX research','Brand and motion'] },

  /* ---- ring 1: who she is ----------------------------------------------- */
  { id:'work', ring:1, a:2, rj:1.0, s:6.7, img:'me-work', label:'Work',
    kicker:'Where I have worked', title:'Five places, one habit.',
    text:'Product designer at Paira through its App Store launch. Strategy and PMO intern at Fosun International in Shanghai. Research assistant at UW HCDE. Vice president at WEGET Magazine. UX researcher and designer at the Cornell Lab of Ornithology.',
    tags:['Paira','Fosun','UW HCDE','Cornell Lab','WEGET'], href:'/about/' },

  { id:'skills', ring:1, a:92, rj:1.03, s:6.2, img:'me-skills', label:'Skills',
    kicker:'What I bring', title:'Research rigor, visual sensitivity, calm systems.',
    text:'Product strategy and UX research through to interaction design, design systems and AI experience design. Plus the making side: prototyping, design engineering, CAD and physical computing.',
    tags:['Product strategy','UX research','AI experience design','Design engineering'], href:'/about/' },

  { id:'school', ring:1, a:180, rj:0.98, s:6.5, img:'me-school', label:'School',
    kicker:'University of Washington', title:'Design, engineering, and a little neuroscience.',
    text:'B.S. in Human-Centered Design and Engineering with a minor in Neural Computation and Engineering, 2026. Now an M.S. in Technology Innovation at UW GIX with a CS and HCI focus, expected 2028.',
    tags:['UW HCDE','Neural Computation','UW GIX'], href:'/about/' },

  { id:'base', ring:1, a:270, rj:1.01, s:6.4, img:'me-base', label:'Based in Redmond',
    kicker:'Shanghai to Redmond', title:'Born and raised in Shanghai, now in Redmond, WA.',
    text:'A life of ink, movement, friendship and making outside the screen. Usually with two cats nearby.',
    tags:['Redmond, WA','Shanghai','Two cats'], href:'/about/' },

  /* ---- ring 2: the featured work ---------------------------------------- */
  { id:'paira', ring:2, a:44, rj:1.0, s:11.2, img:'me-commute', label:'Paira',
    todo:'Olivia holding a phone, two small figures meeting on the screen.',
    kicker:'0 to 1 product', title:'Paira',
    text:'A request-first help network where AI writes the ask and finds the person.',
    tags:['0 to 1 product','AI flows','Brand and launch'],
    media:'/assets/img/paira/paira-home-overview.webp', href:'/paira/' },

  { id:'ecoscan', ring:2, a:317, rj:1.02, s:10.6, img:'me-minimal', label:'EcoScan',
    todo:'Olivia holding a phone up to a grocery item, a scan line on the screen.',
    kicker:'Rapid prototype', title:'EcoScan',
    text:'Scan-based grocery UX translating food labels into personal priorities.',
    tags:['Team leadership','App flow','Rapid prototype'],
    media:'/assets/img/home/ecoscan.webp', href:'/ecoscan/' },

  { id:'merlin', ring:2, a:226, rj:0.97, s:11.5, img:'me-casual', label:'Merlin Bird ID',
    todo:'Olivia with binoculars raised, a small bird on her shoulder.',
    kicker:'Research-led strategy', title:'Merlin Bird ID',
    text:'Research-led product strategy helping novice birders stay engaged.',
    tags:['UX research','Synthesis','Opportunity framing'],
    media:'/assets/img/home/merlin-bird-id.webp', href:'/merlin/' },

  { id:'game', ring:2, a:135, rj:1.01, s:10.9, img:'me-event', label:'Common Ground',
    todo:'Olivia holding a fan of cards, a few cards laid out in front of her.',
    kicker:'Game design', title:'Common Ground',
    text:'A cooperative card game where teamwork becomes the winning mechanic.',
    tags:['Mechanics','Rule system','Playtesting'],
    media:'/assets/img/home/game-overview.webp', href:'/game/' },

  /* ---- ring 3: made outside the screen ----------------------------------- */
  { id:'calligraphy', ring:3, a:20, rj:1.0, s:4.8, img:'me-minimal', label:'Calligraphy',
    todo:'Olivia kneeling at a low desk with a brush, a sheet of paper under it.',
    kicker:'10+ years of practice', title:'Two scripts, one long practice.',
    text:'Traditional Chinese calligraphy has stayed with me for more than a decade. Along the way I taught myself English calligraphy in Engrosser’s Script.',
    tags:['Chinese','Engrosser’s Script'], media:'/assets/img/home/header-calligraphy.webp' },

  { id:'market', ring:3, a:56, rj:0.96, s:4.0, img:'me-event', label:'Markets',
    todo:'Olivia behind a small market table with pieces laid out on it.',
    kicker:'Making becomes gathering', title:'Art is how I share culture.',
    text:'I make and sell small pieces at markets and share the traditions behind them. With friends I co-founded Ikigai to work with cafes and run hands-on craft events.',
    tags:['Ikigai','Craft events'] },

  { id:'magazine', ring:3, a:92, rj:1.03, s:4.5, img:'me-casual', label:'Magazine',
    todo:'Olivia holding an open magazine, posters stacked beside her.',
    kicker:'WEGET Magazine', title:'Vice president, design.',
    text:'Leading design coordination, weekly reviews and creative production across posters, editorial assets and event merchandise.',
    tags:['Editorial','Posters','Merch'] },

  { id:'physical', ring:3, a:128, rj:0.98, s:4.2, img:'me-commute', label:'Physical computing',
    todo:'Olivia at a bench with a breadboard and a few wires.',
    kicker:'Explorations', title:'Sensor and touch logic.',
    text:'Circuits, sensors and interactions that live off the screen.',
    tags:['Arduino','Sensors'], media:'/assets/img/home/physical-computing.webp', href:'/explorations/#physical-computing' },

  { id:'fabrication', ring:3, a:164, rj:1.02, s:4.7, img:'me-minimal', label:'Fabrication',
    todo:'Olivia holding a flat-pack part, a laser-cut sheet beside her.',
    kicker:'Explorations', title:'Laser-cut structure.',
    text:'Flat-pack builds, soft goods and the drawings behind them.',
    tags:['CAD','Laser cutting','Soft goods'], media:'/assets/img/explorations/assets-assignment-3-process-10-assemble.webp', href:'/explorations/#flat-pack-laptop-stand' },

  { id:'bouldering', ring:3, a:200, rj:0.97, s:4.1, img:'me-casual', label:'Bouldering',
    todo:'Olivia reaching up for a climbing hold, chalk bag at her waist.',
    kicker:'Curious by default', title:'Better with friends.',
    text:'An ENFJ who keeps picking up social hobbies. Bouldering is the one that stuck.',
    tags:['Bouldering'] },

  { id:'tennis', ring:3, a:236, rj:1.01, s:4.4, img:'me-commute', label:'Tennis',
    todo:'Olivia mid-swing with a racket.',
    kicker:'Curious by default', title:'Tennis and badminton.',
    text:'Two more that are better with people than alone.',
    tags:['Tennis','Badminton'] },

  { id:'boardgames', ring:3, a:272, rj:0.99, s:4.6, img:'me-event', label:'Board games',
    todo:'Olivia at a table with a board and pieces, two friends across from her.',
    kicker:'Curious by default', title:'Board game nights.',
    text:'The hobby that turned into a capstone. Common Ground started here.',
    tags:['Board games'] },

  { id:'cats', ring:3, a:308, rj:1.03, s:4.2, img:'cat', label:'Two cats',
    kicker:'Companion', title:'Usually made with two cats nearby.',
    text:'They supervise everything on this site.',
    tags:['Two cats'], media:'/assets/img/about-hobbies-collage.jpg' },

  { id:'archive', ring:3, a:344, rj:0.98, s:4.5, img:'me-casual', label:'Skill archive',
    todo:'Olivia holding a small stack of finished objects.',
    kicker:'Explorations', title:'The full skill archive.',
    text:'Side projects that stretch prototyping, fabrication and technical craft.',
    tags:['Archive'], media:'/assets/img/explorations/assets-final-cover-process.webp', href:'/explorations/' },
];

/* ---------------------------------------------------------------------- */


/* Angles that divide an ellipse into equal lengths of edge, so a wide orbit
   does not crowd at the sides and thin out across the top. */
function evenAngles(rx, ry, count, startDeg) {
  const steps = 2000, acc = [0];
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const pt = [Math.sin(th) * rx, -Math.cos(th) * ry];
    if (prev) acc.push(acc[acc.length - 1] + Math.hypot(pt[0] - prev[0], pt[1] - prev[1]));
    prev = pt;
  }
  const total = acc[acc.length - 1];
  const out = [];
  for (let k = 0; k < count; k++) {
    const want = (k / count) * total;
    let i = acc.findIndex(v => v >= want);
    if (i < 0) i = acc.length - 1;
    out.push((i / steps) * 360 + startDeg);
  }
  return out;
}

const OUTER = NODES.filter(n => n.ring === 3);
evenAngles(RINGS[3].rx, RINGS[3].ry, OUTER.length, 16)
  .forEach((deg, i) => { OUTER[i].a = deg; });

const field = document.querySelector('[data-field]');
const card = document.querySelector('[data-card]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function build() {
  NODES.forEach((n, i) => {
    const el = document.createElement(n.href ? 'a' : 'button');
    el.className = 'hv2-node' + (n.ring === 0 ? ' hv2-node-centre' : '');
    if (n.href) { el.href = n.href; } else { el.type = 'button'; }
    el.dataset.id = n.id;
    el.dataset.ring = n.ring;
    if (n.todo) el.dataset.todo = n.todo;
    const R = RINGS[n.ring];
    if (R) {
      const t = n.a * Math.PI / 180;
      el.style.setProperty('--x', (Math.sin(t) * R.rx * n.rj).toFixed(2));
      el.style.setProperty('--y', (-Math.cos(t) * R.ry * n.rj).toFixed(2));
    } else {
      el.style.setProperty('--x', 0);
      el.style.setProperty('--y', 0);
    }
    el.style.setProperty('--s', n.s);
    el.style.setProperty('--dur', (7.5 + (i % 5) * 1.4) + 's');
    el.style.setProperty('--delay', (-(i * 0.73) % 6).toFixed(2) + 's');
    el.setAttribute('aria-label', n.label + '. ' + n.title);
    el.innerHTML =
      '<span class="hv2-node-inner">' +
        '<img src="' + IMG + n.img + '.webp" alt="" loading="lazy" decoding="async" />' +
        '<span class="hv2-node-label">' + n.label + '</span>' +
      '</span>';
    field.appendChild(el);
  });
}

function sizeOrbits() {
  [1, 2, 3].forEach(k => {
    const el = field.querySelector('.hv2-ring-' + k);
    el.style.width = (RINGS[k].rx * 2) + '%';
    el.style.height = (RINGS[k].ry * 2) + '%';
  });
  const disc = field.querySelector('.hv2-disc');
  disc.style.width = (RINGS[1].rx * 2 + 13) + '%';
  disc.style.height = (RINGS[1].ry * 2 + 16) + '%';
}

function fillCard(n) {
  card.innerHTML =
    (n.media ? '<img class="hv2-card-media" src="' + n.media + '" alt="" />' : '') +
    '<div class="hv2-card-body">' +
      '<p class="hv2-card-kicker">' + n.kicker + '</p>' +
      '<h2 class="hv2-card-title">' + n.title + '</h2>' +
      '<p class="hv2-card-text">' + n.text + '</p>' +
      '<div class="hv2-card-tags">' + n.tags.map(t => '<span>' + t + '</span>').join('') + '</div>' +
      (n.todo && document.body.classList.contains('show-todo-notes')
        ? '<p class="hv2-card-todo">Clay pose still to make: ' + n.todo + '</p>' : '') +
    '</div>';
}

function placeCard(el) {
  const r = el.getBoundingClientRect();
  const w = card.offsetWidth, h = card.offsetHeight;
  const gap = 16;
  let x = r.right + gap;
  if (x + w > window.innerWidth - 12) x = r.left - gap - w;
  if (x < 12) x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
  let y = r.top + r.height / 2 - h / 2;
  y = Math.min(Math.max(12, y), window.innerHeight - h - 12);
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
  field.classList.remove('lit-1', 'lit-2', 'lit-3');
  if (n.ring) field.classList.add('lit-' + n.ring);
  field.querySelectorAll('.hv2-node').forEach(x => x.classList.toggle('is-active', x === el));
}

function close() {
  openId = null;
  card.classList.remove('is-open');
  field.classList.remove('is-reading', 'lit-1', 'lit-2', 'lit-3');
  field.querySelectorAll('.hv2-node').forEach(x => x.classList.remove('is-active'));
}

function wire() {
  field.querySelectorAll('.hv2-node').forEach(el => {
    el.addEventListener('pointerenter', () => open(el));
    el.addEventListener('focus', () => open(el));
    el.addEventListener('pointerleave', close);
    el.addEventListener('blur', close);
    if (el.classList.contains('hv2-node-centre')) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        field.classList.toggle('is-about');
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
  const order = [...field.querySelectorAll('.hv2-node')]
    .sort((a, b) => Number(a.dataset.ring) - Number(b.dataset.ring));
  order.forEach((el, i) => {
    el.animate(
      [{ opacity: 0, scale: .72 }, { opacity: 1, scale: 1 }],
      { duration: 760, delay: 90 + i * 55, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
    );
  });
}

build();
sizeOrbits();
wire();
entrance();
