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

  document.querySelectorAll('[data-toggle-salary]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.lab-variant-card');
      if (!card) return;
      const chip = card.querySelector('[data-salary-chip]');
      if (!chip) return;
      const next = !chip.disabled;
      chip.disabled = next;
      chip.classList.toggle('is-disabled', next);
      btn.classList.toggle('is-active', next);
      btn.textContent = next ? 'Зарплата: получена' : 'Зарплата: доступна';
    });
  });

  document.querySelectorAll('[data-toggle-hint]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const hint = document.querySelector('[data-period-hint]');
      if (!hint) return;
      const hidden = hint.hasAttribute('hidden');
      if (hidden) {
        hint.removeAttribute('hidden');
        btn.textContent = 'Скрыть подсказку';
        btn.classList.remove('is-active');
      } else {
        hint.setAttribute('hidden', '');
        btn.textContent = 'Показать подсказку';
        btn.classList.add('is-active');
      }
    });
  });

  document.querySelectorAll('[data-toggle-cushion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.lab-variant-card');
      if (!card) return;
      const sheet = card.querySelector('[data-cushion-sheet]');
      const hub = card.querySelector('[data-cushion-hub]');
      if (!sheet || !hub) return;
      const open = sheet.hidden;
      sheet.hidden = !open;
      hub.classList.toggle('is-open', open);
      btn.classList.toggle('is-active', open);
    });
  });
})();
