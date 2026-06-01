document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme-btn');
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-btn]').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
    });
  });
});

document.querySelectorAll('[data-auth-tabs]').forEach((root) => {
  const tabs = root.querySelectorAll('[data-auth-tab]');
  const panels = root.querySelectorAll('[data-auth-panel]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.getAttribute('data-auth-tab');
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach((p) => {
        p.hidden = p.getAttribute('data-auth-panel') !== id;
      });
    });
  });
});
