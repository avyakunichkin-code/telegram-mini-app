/** Mock deltas — prod: PeriodCloseSummary v2 */
const MOCK = {
  periodClosed: 3,
  cashBefore: 42_150,
  cashAfter: 48_500,
  incomeTotal: 52_000,
  expenseTotal: 45_500,
  safetyDelta: 3_000,
  investDelta: 2_500,
  xpEarned: 24,
};

function fmt(n) {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  const abs = Math.abs(Math.round(n));
  return `${sign}${abs.toLocaleString('ru-RU')} ₽`;
}

function metricRow(label, glyphClass, delta, tip) {
  const tone = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
  const valCls = tone ? ` pc-metric__val--${tone}` : '';
  const glyphs = {
    coin: '<svg viewBox="0 0 24 24" fill="none"><ellipse cx="8" cy="7" rx="5" ry="2.2" stroke="currentColor" stroke-width="1.75"/><path d="M3 7v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V7" stroke="currentColor" stroke-width="1.75"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="2.25" stroke-linecap="round" d="M12 19V9"/><path stroke="currentColor" stroke-width="2.25" d="M8 11l4-4 4 4"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="2.25" d="M12 5v10"/><path stroke="currentColor" stroke-width="2.25" d="M8 13l4 4 4-4"/></svg>',
    term: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="7.25" stroke="currentColor" stroke-width="1.75"/><path stroke="currentColor" stroke-width="1.85" d="M12 10v4l2.5 1.5"/></svg>',
  };
  return `
    <div class="pc-metric" title="${tip}">
      <span class="pc-metric__glyph pc-metric__glyph--${glyphClass}" aria-hidden="true">${glyphs[glyphClass === 'up' || glyphClass === 'down' ? glyphClass : 'coin'] || glyphs.coin}</span>
      <span class="pc-metric__body">
        <span class="pc-metric__label">${label}</span>
        <span class="pc-metric__val${valCls}">${typeof delta === 'string' ? delta : fmt(delta)}</span>
      </span>
    </div>`;
}

function metricsHtml() {
  const cashDelta = MOCK.cashAfter - MOCK.cashBefore;
  return `
    <div class="pc-metrics">
      ${metricRow('Баланс', cashDelta >= 0 ? 'up' : 'down', cashDelta, 'Изменение cash за период')}
      ${metricRow('Доходы', 'up', MOCK.incomeTotal, 'Поступления за период')}
      ${metricRow('Расходы', 'down', -MOCK.expenseTotal, 'Списания за период')}
      ${metricRow('Подушка', 'up', MOCK.safetyDelta, 'Δ подушки безопасности')}
      ${metricRow('Инвестиции', 'up', MOCK.investDelta, 'Δ депозиты и облигации')}
    </div>`;
}

function metricsGridHtml() {
  const cashDelta = MOCK.cashAfter - MOCK.cashBefore;
  return `
    <div class="pc-metrics pc-metrics--grid">
      ${metricRow('Баланс', cashDelta >= 0 ? 'up' : 'down', cashDelta, '')}
      ${metricRow('Доходы', 'up', MOCK.incomeTotal, '')}
      ${metricRow('Расходы', 'down', -MOCK.expenseTotal, '')}
      ${metricRow('Подушка', 'up', MOCK.safetyDelta, '')}
    </div>
    <div class="pc-metrics" style="margin-top:8px">
      ${metricRow('Инвестиции', 'up', MOCK.investDelta, '')}
    </div>`;
}

function panelInner(variant) {
  const grid = variant === 'c';
  return `
    <p class="pc-panel__kicker">Период ${MOCK.periodClosed} закрыт</p>
    <h3 class="pc-panel__title">Итог месяца</h3>
    <p class="pc-panel__xp">+${MOCK.xpEarned} XP</p>
    ${grid ? metricsGridHtml() : metricsHtml()}
    <div class="pc-panel__actions">
      <button type="button" class="pc-panel__btn" data-close>Понятно</button>
    </div>`;
}

function bindPhone(phone) {
  const scrims = phone.querySelectorAll('.lab-scrim');
  const strip = phone.querySelector('.lab-strip-b');
  const tail = phone.querySelector('.lab-tail');
  const openBtns = phone.querySelectorAll('[data-open]');
  const closeBtns = phone.querySelectorAll('[data-close]');

  const open = () => {
    scrims.forEach((s) => s.classList.add('is-open'));
    if (strip) strip.classList.add('is-open');
  };
  const close = () => {
    scrims.forEach((s) => s.classList.remove('is-open'));
    if (strip) strip.classList.remove('is-open');
  };

  openBtns.forEach((b) => b.addEventListener('click', open));
  closeBtns.forEach((b) => b.addEventListener('click', close));
  scrims.forEach((s) => {
    s.addEventListener('click', (e) => {
      if (e.target === s) close();
    });
  });
  if (tail) tail.addEventListener('click', open);
}

function updateMechanics(closedPeriod) {
  const auto = closedPeriod <= 3;
  MOCK.periodClosed = closedPeriod;
  document.querySelectorAll('[data-period-label]').forEach((el) => {
    el.textContent = String(closedPeriod);
  });
  document.querySelectorAll('[data-tail-label]').forEach((el) => {
    el.textContent = `Период ${closedPeriod} · итоги`;
  });

  const hint = document.getElementById('mode-hint');
  if (hint) {
    hint.textContent = auto
      ? 'Режим: авто-всплытие (периоды 1–3)'
      : 'Режим: только хвостик (период ≥ 4)';
    hint.className = `lab-mode-hint ${auto ? 'lab-mode-hint--auto' : 'lab-mode-hint--tail'}`;
  }

  document.querySelectorAll('.lab-phone').forEach((phone) => {
    const scrims = phone.querySelectorAll('.lab-scrim');
    const strip = phone.querySelector('.lab-strip-b');
    const tail = phone.querySelector('.lab-tail');
    const autoOpen = phone.dataset.autoOpen === 'true';

    scrims.forEach((s) => s.classList.remove('is-open'));
    if (strip) strip.classList.remove('is-open');

    if (tail) {
      tail.classList.toggle('is-visible', !auto);
    }

    if (auto && autoOpen) {
      scrims.forEach((s) => s.classList.add('is-open'));
      if (strip) strip.classList.add('is-open');
    }
  });

  document.querySelectorAll('.pc-panel__kicker').forEach((el) => {
    el.textContent = `Период ${closedPeriod} закрыт`;
  });
}

document.querySelectorAll('.lab-phone').forEach(bindPhone);

const range = document.getElementById('period-range');
const out = document.getElementById('period-out');
if (range && out) {
  const sync = () => {
    const v = Number(range.value);
    out.textContent = String(v);
    updateMechanics(v);
  };
  range.addEventListener('input', sync);
  sync();
}

document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', btn.getAttribute('data-theme-btn'));
    document.querySelectorAll('[data-theme-btn]').forEach((b) => b.classList.toggle('is-active', b === btn));
  });
});

/** Inject metrics into panels */
document.querySelectorAll('[data-panel-body]').forEach((el) => {
  const kind = el.getAttribute('data-panel-body');
  if (kind === 'metrics') {
    el.innerHTML = `${metricsHtml()}<p class="pc-panel__xp">+${MOCK.xpEarned} XP</p>`;
  } else {
    el.innerHTML = panelInner(kind);
  }
});

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const phone = btn.closest('.lab-phone');
    if (!phone) return;
    phone.querySelectorAll('.lab-scrim').forEach((s) => s.classList.remove('is-open'));
    const strip = phone.querySelector('.lab-strip-b');
    if (strip) strip.classList.remove('is-open');
  });
});
