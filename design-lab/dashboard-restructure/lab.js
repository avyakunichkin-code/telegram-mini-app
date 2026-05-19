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

function initLevelCards() {
  document.querySelectorAll('[data-level-toggle]').forEach((btn) => {
    const card = btn.closest('.level-card');
    if (!card) return;
    btn.addEventListener('click', () => {
      const expanded = card.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  });
}

function initPeriodDash() {
  document.querySelectorAll('[data-period-toggle]').forEach((btn) => {
    const dash = btn.closest('.period-dash');
    if (!dash) return;
    btn.addEventListener('click', () => {
      const expanded = dash.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  });
}

function investAmountStep(max) {
  const m = Math.max(0, Math.floor(Number(max) || 0));
  if (m <= 0) return 1;
  if (m <= 10_000) return 100;
  if (m <= 100_000) return 1_000;
  return 10_000;
}

function initAmountSliders(root) {
  const max = Number(root.dataset.amountMax) || 54200;
  const isWithdraw = root.dataset.amountMode === 'withdraw';
  const maxAvail = isWithdraw ? 18000 : max;
  const input = root.querySelector('[data-amount-input]');
  const slider = root.querySelector('[data-amount-slider]');
  const hintMax = root.querySelector('[data-amount-hint-max]');
  if (!input || !slider) return;

  const step = investAmountStep(maxAvail);
  slider.min = '0';
  slider.max = String(maxAvail);
  slider.step = String(step);

  const sync = (val) => {
    const n = Math.min(Math.max(0, Math.floor(Number(val) || 0)), maxAvail);
    slider.value = String(n);
    input.value = n > 0 ? String(n) : '';
    if (hintMax) {
      hintMax.textContent = isWithdraw
        ? `В подушке: ${n.toLocaleString('ru-RU')} / ${maxAvail.toLocaleString('ru-RU')} ₽`
        : `На счёте: ${maxAvail.toLocaleString('ru-RU')} ₽`;
    }
  };

  input.addEventListener('input', () => {
    const raw = input.value.replace(/[^\d]/g, '');
    sync(raw === '' ? 0 : Number(raw));
  });
  slider.addEventListener('input', () => sync(slider.value));

  root.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-preset]').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      const pct = btn.dataset.preset;
      let v = 0;
      if (pct === 'max') v = maxAvail;
      else v = Math.round((maxAvail * Number(pct)) / 100);
      sync(v);
    });
  });

  sync(isWithdraw ? 9000 : 15000);
}

function initModalToggles() {
  document.querySelectorAll('[data-open-modal]').forEach((btn) => {
    const phone = btn.closest('.phone');
    const modal = phone?.querySelector('[data-modal]');
    if (!modal) return;
    btn.addEventListener('click', () => {
      modal.hidden = false;
    });
    modal.querySelectorAll('[data-close-modal]').forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => {
        modal.hidden = true;
      });
    });
  });
}

initTheme();
initLevelCards();
initPeriodDash();
document.querySelectorAll('[data-amount-root]').forEach(initAmountSliders);
initModalToggles();
