(() => {
  const dialog = document.querySelector('.fh-lightbox');
  const links = [...document.querySelectorAll('[data-gallery]')];
  const photo = dialog.querySelector('.fh-viewer-image img');
  const caption = dialog.querySelector('.fh-viewer-caption');
  const count = dialog.querySelector('.fh-viewer-count');
  const previous = dialog.querySelector('.fh-prev');
  const next = dialog.querySelector('.fh-next');
  let group = [], index = 0, opener, oldOverflow;
  function render() {
    const item = group[index];
    photo.src = item.href;
    photo.alt = item.dataset.caption;
    caption.textContent = item.dataset.caption;
    count.textContent = `${index + 1} / ${group.length}`;
    previous.disabled = index === 0;
    next.disabled = index === group.length - 1;
  }
  links.forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    group = links.filter(item => item.dataset.gallery === link.dataset.gallery);
    index = group.indexOf(link);
    render();
    oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('.fh-close').focus();
  }));
  previous.addEventListener('click', () => { if (index > 0) { index--; render(); } });
  next.addEventListener('click', () => { if (index < group.length - 1) { index++; render(); } });
  dialog.querySelector('.fh-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous.click(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); }
  });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = oldOverflow;
    opener?.focus({ preventScroll: true });
  });
  const navLinks = [...document.querySelectorAll('.fh-nav a')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
  let scheduled = false;
  function updateNavigation() {
    let active = -1;
    sections.forEach((section, i) => { if (section.getBoundingClientRect().top <= 180) active = i; });
    navLinks.forEach((link, i) => {
      if (i === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  updateNavigation();
})();
