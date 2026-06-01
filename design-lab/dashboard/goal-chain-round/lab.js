function initTheme() {
  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-btn');
      document.documentElement.setAttribute('data-theme', theme);
      document.querySelectorAll('[data-theme-btn]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
    });
  });
}

function initAccordions() {
  document.querySelectorAll('[data-goal-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.mqx-goal-dash');
      if (!section) return;
      const open = section.classList.toggle('mqx-goal-dash--expanded');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

initTheme();
initAccordions();
