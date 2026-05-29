(function () {
  const root = document.documentElement;
  const btns = document.querySelectorAll('[data-theme-btn]');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    btns.forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-theme-btn') === theme);
    });
  }

  btns.forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.getAttribute('data-theme-btn')));
  });
})();
