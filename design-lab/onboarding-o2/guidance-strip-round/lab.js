document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme-btn');
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-btn]').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
    });
  });
});
