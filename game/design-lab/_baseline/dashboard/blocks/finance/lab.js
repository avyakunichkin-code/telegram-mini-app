function tierFromPct(pct) {
  if (pct >= 75) return 'high';
  if (pct >= 50) return 'mid-high';
  if (pct >= 25) return 'mid-low';
  return 'low';
}

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

function initSliders() {
  const slider = document.getElementById('lab-pct-slider');
  const label = document.getElementById('lab-pct-label');
  const live = document.getElementById('lab-live-cushion');
  if (!slider || !live) return;

  const bar = live.querySelector('.mqx-cushion-fill__bar');
  const hint = live.querySelector('.mqx-cushion-fill__hint');
  const bgBar = document.querySelector('#lab-f2-cushion .mqx-cushion-fill__bar');

  const update = () => {
    const pct = Number(slider.value);
    const tier = tierFromPct(pct);
    if (bar) {
      bar.style.width = `${pct}%`;
      bar.dataset.tier = tier;
    }
    if (bgBar) {
      bgBar.style.setProperty('--cushion-pct', `${pct}%`);
      bgBar.dataset.tier = tier;
    }
    if (hint) {
      hint.textContent = `${pct}% · цель 54 000 ₽ (×3)`;
    }
    if (label) label.textContent = `${pct}%`;
  };

  slider.addEventListener('input', update);
  update();
}

initTheme();
initSliders();
