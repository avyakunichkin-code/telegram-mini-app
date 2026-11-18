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

function parseBalance(text) {
  const n = Number(String(text).replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatBalance(n) {
  return `${n.toLocaleString('ru-RU')} ₽`;
}

function playGain(demo) {
  const chip = demo.querySelector('[data-salary-chip]');
  const flyout = demo.querySelector('[data-flyout]');
  const toast = demo.querySelector('[data-toast]');
  const resource = demo.querySelector('[data-resource="balance"]');
  const balanceEl = demo.querySelector('[data-balance]');
  if (!chip || !flyout || !toast || !balanceEl) return;

  chip.disabled = true;
  chip.classList.add('is-celebrate');
  flyout.classList.remove('is-active');
  void flyout.offsetWidth;
  flyout.classList.add('is-active');
  toast.classList.add('is-visible');

  if (resource) {
    resource.classList.add('is-juiced', 'is-juiced--gain');
  }

  const start = parseBalance(balanceEl.textContent);
  const end = start + 12400;
  balanceEl.classList.add('juice-resource__value--pos');
  balanceEl.textContent = formatBalance(end);

  window.setTimeout(() => {
    chip.classList.remove('is-celebrate');
    chip.disabled = false;
    if (resource) {
      resource.classList.remove('is-juiced', 'is-juiced--gain');
    }
  }, 900);
}

function resetGain(demo) {
  const chip = demo.querySelector('[data-salary-chip]');
  const flyout = demo.querySelector('[data-flyout]');
  const toast = demo.querySelector('[data-toast]');
  const balanceEl = demo.querySelector('[data-balance]');
  const resource = demo.querySelector('[data-resource="balance"]');
  if (chip) {
    chip.disabled = false;
    chip.classList.remove('is-celebrate');
  }
  if (flyout) flyout.classList.remove('is-active');
  if (toast) toast.classList.remove('is-visible');
  if (resource) resource.classList.remove('is-juiced', 'is-juiced--gain');
  if (balanceEl) {
    balanceEl.textContent = '42 150 ₽';
    balanceEl.classList.remove('juice-resource__value--pos');
  }
}

function playRisk(demo) {
  const row = demo.querySelector('[data-risk-row]');
  const hint = demo.querySelector('[data-monetka-hint]');
  if (row) {
    row.classList.remove('is-shake');
    void row.offsetWidth;
    row.classList.add('is-shake');
  }
  if (hint) hint.classList.add('is-visible');
}

function resetRisk(demo) {
  const row = demo.querySelector('[data-risk-row]');
  const hint = demo.querySelector('[data-monetka-hint]');
  if (row) row.classList.remove('is-shake');
  if (hint) hint.classList.remove('is-visible');
}

function playRitual(demo) {
  const ritual = demo.querySelector('[data-ritual]');
  if (!ritual) return;
  ritual.classList.remove('is-active');
  ritual.setAttribute('aria-hidden', 'true');
  void ritual.offsetWidth;
  ritual.classList.add('is-active');
  ritual.setAttribute('aria-hidden', 'false');
}

function resetRitual(demo) {
  const ritual = demo.querySelector('[data-ritual]');
  if (ritual) {
    ritual.classList.remove('is-active');
    ritual.setAttribute('aria-hidden', 'true');
  }
}

function playWarning(demo) {
  const scrim = demo.querySelector('[data-modal-scrim]');
  const modal = demo.querySelector('[data-modal]');
  if (scrim) scrim.classList.add('is-visible');
  if (modal) modal.classList.add('is-visible');
}

function resetWarning(demo) {
  const scrim = demo.querySelector('[data-modal-scrim]');
  const modal = demo.querySelector('[data-modal]');
  if (scrim) scrim.classList.remove('is-visible');
  if (modal) modal.classList.remove('is-visible');
}

const PLAYERS = {
  gain: playGain,
  risk: playRisk,
  ritual: playRitual,
  warning: playWarning,
};

const RESETTERS = {
  gain: resetGain,
  risk: resetRisk,
  ritual: resetRitual,
  warning: resetWarning,
};

function initDemos() {
  document.querySelectorAll('[data-play]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-play');
      const demo = document.querySelector(`[data-demo="${key}"]`);
      const play = PLAYERS[key];
      if (demo && play) play(demo);
    });
  });

  document.querySelectorAll('[data-reset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-reset');
      const demo = document.querySelector(`[data-demo="${key}"]`);
      const reset = RESETTERS[key];
      if (demo && reset) reset(demo);
    });
  });

  document.querySelectorAll('[data-ritual-dismiss]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const demo = btn.closest('[data-demo="ritual"]');
      if (demo) resetRitual(demo);
    });
  });
}

initTheme();
initDemos();
