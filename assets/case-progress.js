(() => {
  const main = document.querySelector('.merlin-report');
  const hero = main?.querySelector('.merlin-report-hero');
  const reportSections = [...(main?.querySelectorAll('.merlin-report-section') || [])];

  if (!main || !hero || !reportSections.length) return;

  const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const entries = [
    { section: hero, label: 'Project Intro', id: hero.id || 'case-intro' },
    ...reportSections.map((section, index) => {
      const label = section.querySelector('.section-label')?.textContent.trim() || `Section ${index + 1}`;
      return {
        section,
        label,
        id: section.id || `case-${slugify(label) || index + 1}`
      };
    })
  ];

  entries.forEach(({ section, id }) => {
    section.id = id;
  });

  const tools = document.createElement('div');
  tools.className = 'case-reader-tools';

  const backLink = document.createElement('a');
  backLink.className = 'case-reader-back';
  backLink.href = '/#selected-work';
  backLink.setAttribute('aria-label', 'Back to projects');
  backLink.innerHTML = '<span class="case-reader-back-icon" aria-hidden="true">\u2190</span><span class="case-reader-back-label">Back to projects</span>';

  const nav = document.createElement('nav');
  nav.className = 'case-reader-nav';
  nav.tabIndex = 0;
  nav.setAttribute('aria-label', 'Case study sections');

  const meter = document.createElement('span');
  meter.className = 'case-reader-meter';
  meter.setAttribute('aria-hidden', 'true');
  meter.innerHTML = '<span></span>';

  const list = document.createElement('ol');
  list.className = 'case-reader-list';

  const links = entries.map(({ label, id }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'case-reader-link';
    link.href = `#${id}`;
    link.innerHTML = `<span class="case-reader-dot" aria-hidden="true"></span><span>${label}</span>`;
    item.append(link);
    list.append(item);
    return link;
  });

  nav.append(list, meter);
  tools.append(backLink, nav);
  document.body.append(tools);
  document.body.classList.add('case-progress-enabled');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = -1;
  let frame = 0;

  const centerActiveLink = (link) => {
    if (window.innerWidth > 1024) return;
    const target = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
    const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    list.scrollTo({
      left: Math.min(maxScroll, Math.max(0, target)),
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
    });
  };

  const update = () => {
    frame = 0;
    const marker = window.scrollY + Math.min(window.innerHeight * 0.34, 320);
    let nextIndex = 0;

    entries.forEach(({ section }, index) => {
      if (section.offsetTop <= marker) nextIndex = index;
    });

    if (nextIndex !== currentIndex) {
      currentIndex = nextIndex;
      links.forEach((link, index) => {
        const isCurrent = index === currentIndex;
        const isNeighbor = Math.abs(index - currentIndex) === 1;
        link.classList.toggle('is-current', isCurrent);
        link.classList.toggle('is-neighbor', isNeighbor);
        if (isCurrent) {
          link.setAttribute('aria-current', 'location');
          centerActiveLink(link);
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    const start = hero.offsetTop;
    const end = Math.max(start + 1, main.offsetTop + main.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
    tools.style.setProperty('--case-read-progress', `${progress * 100}%`);
    document.body.classList.toggle('case-reader-scrolled', window.scrollY > 72);
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  links.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = entries[index].section;
      target.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
      window.history.replaceState(null, '', `#${entries[index].id}`);
    });
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', requestUpdate, { once: true });
  update();

  const initialId = decodeURIComponent(window.location.hash.slice(1));
  const initialTarget = initialId && document.getElementById(initialId);
  if (initialTarget) {
    const alignInitialTarget = () => {
      const scrollMargin = Number.parseFloat(window.getComputedStyle(initialTarget).scrollMarginTop) || 0;
      window.scrollTo({
        top: Math.max(0, initialTarget.offsetTop - scrollMargin),
        behavior: 'instant'
      });
      requestUpdate();
    };
    window.requestAnimationFrame(alignInitialTarget);
    window.addEventListener('load', alignInitialTarget, { once: true });
  }
})();
