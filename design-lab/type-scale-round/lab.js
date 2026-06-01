(function () {
  const root = document.documentElement;

  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-btn');
      root.setAttribute('data-theme', theme);
      document.querySelectorAll('[data-theme-btn]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
    });
  });

  document.querySelectorAll('[data-pick-display]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pick = btn.getAttribute('data-pick-display');
      document.querySelectorAll('[data-pick-display]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
      document.querySelectorAll('[data-hero-display]').forEach((el) => {
        el.setAttribute('data-display', pick);
      });
      const note = document.querySelector('[data-display-note]');
      if (note) {
        note.textContent =
          pick === 'a'
            ? 'Сейчас: display 26px (--mq-fs-display-a)'
            : 'Сейчас: display 28px (--mq-fs-display-b)';
      }
    });
  });
})();
