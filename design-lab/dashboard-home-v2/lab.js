function initTheme() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('[data-theme-btn]');
  const stored = localStorage.getItem('mq.lab.theme');
  if (stored === 'dark' || stored === 'light') root.setAttribute('data-theme', stored);
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.themeBtn === root.getAttribute('data-theme'));
    btn.addEventListener('click', () => {
      root.setAttribute('data-theme', btn.dataset.themeBtn);
      localStorage.setItem('mq.lab.theme', btn.dataset.themeBtn);
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });
}

function initSegmented(root) {
  const seg = root.querySelector('.seg');
  if (!seg) return;
  const buttons = seg.querySelectorAll('button');
  const panels = root.querySelectorAll('.seg-panel');
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('is-on'));
      panels.forEach((p) => p.classList.remove('is-on'));
      btn.classList.add('is-on');
      if (panels[i]) panels[i].classList.add('is-on');
    });
  });
}

function initToggle(selector, openClass = 'is-open') {
  document.querySelectorAll(selector).forEach((el) => {
    const head = el.querySelector('[data-toggle]');
    if (!head) return;
    head.addEventListener('click', () => el.classList.toggle(openClass));
  });
}

function initSnap() {
  document.querySelectorAll('.snap').forEach((snap) => {
    const dots = snap.parentElement?.querySelectorAll('.snap__dots i');
    if (!dots?.length) return;
    const sync = () => {
      const page = snap.querySelector('.snap__page');
      const w = page ? page.offsetWidth + 10 : snap.clientWidth;
      const i = Math.min(dots.length - 1, Math.max(0, Math.round(snap.scrollLeft / w)));
      dots.forEach((d, j) => d.classList.toggle('on', j === i));
    };
    snap.addEventListener('scroll', sync, { passive: true });
    sync();
  });
}

function initSheet() {
  document.querySelectorAll('[data-sheet-root]').forEach((phone) => {
    const openBtn = phone.querySelector('[data-sheet-open]');
    const sheet = phone.querySelector('[data-sheet]');
    if (!openBtn || !sheet) return;
    const toggle = () => phone.classList.toggle('is-sheet-open');
    openBtn.addEventListener('click', toggle);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet.querySelector('.sheet__grab')) toggle();
    });
  });
}

initTheme();
document.querySelectorAll('[data-seg-root]').forEach(initSegmented);
initToggle('.acc');
initToggle('.xcard');
initToggle('.cap-row');
initSnap();
initSheet();
