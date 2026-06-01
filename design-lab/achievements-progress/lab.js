function initTheme() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('[data-theme-btn]');
  const stored = localStorage.getItem('mq.lab.theme');
  if (stored === 'dark' || stored === 'light') {
    root.setAttribute('data-theme', stored);
  }
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.themeBtn === root.getAttribute('data-theme'));
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeBtn;
      root.setAttribute('data-theme', theme);
      localStorage.setItem('mq.lab.theme', theme);
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });
}

function initCollapsibles() {
  document.querySelectorAll('[data-level-toggle]').forEach((btn) => {
    const card = btn.closest('.level-card');
    if (!card) return;
    btn.addEventListener('click', () => {
      const expanded = card.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  });
}

initTheme();
initCollapsibles();
