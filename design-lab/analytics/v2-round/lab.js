(function () {
  const root = document.documentElement;

  /** Тест-ряд: 6 закрытых ходов + текущий снимок (как timeseries в prod). */
  const HISTORY_INCOME = [115000, 118000, 119000, 120000, 121000, 120000, 120000];
  const HISTORY_EXPENSE = [86000, 88000, 90000, 91000, 93000, 92000, 94000];
  const HISTORY_LIQUIDITY = [98000, 102000, 108000, 115000, 128000, 138000, 146000];
  const MONTHLY_DELTA = 26000;
  const LIQUIDITY_NOW = HISTORY_LIQUIDITY[HISTORY_LIQUIDITY.length - 1];

  const fmt = (n) => n.toLocaleString('ru-RU') + ' ₽';

  function seriesToPoints(values, width, height, pad, x0, x1) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    return values
      .map((v, i) => {
        const x = x0 + (i / Math.max(values.length - 1, 1)) * (x1 - x0);
        const y = pad + (1 - (v - min) / span) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function drawIncomeExpense(svg) {
    const w = 320;
    const h = 56;
    const pad = 6;
    const incomePts = seriesToPoints(HISTORY_INCOME, w, h, pad, 8, w - 8);
    const expensePts = seriesToPoints(HISTORY_EXPENSE, w, h, pad, 8, w - 8);
    svg.innerHTML = `
      <line x1="8" y1="${h - pad}" x2="${w - 8}" y2="${h - pad}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <polyline fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${incomePts}"/>
      <polyline fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${expensePts}"/>
    `;
  }

  /** Как CashForecastSpark в prod: хвост истории + projected от текущего значения — одна polyline. */
  function drawLiquiditySplit(svg, forecastMonths) {
    const w = 320;
    const h = 72;
    const pad = 8;
    const splitX = Math.round(w * 0.58);
    const xLeft = 12;
    const xRight = w - 12;

    const tail = HISTORY_LIQUIDITY.slice(-Math.min(10, HISTORY_LIQUIDITY.length));
    const projected = Array.from({ length: forecastMonths + 1 }, (_, i) => LIQUIDITY_NOW + i * MONTHLY_DELTA);
    const series = [...tail.slice(0, -1), ...projected];
    const nowIndex = tail.length - 1;

    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = Math.max(max - min, 1);
    const valToY = (v) => pad + (1 - (v - min) / span) * (h - pad * 2);

    const points = series
      .map((v, i) => {
        let x;
        if (i <= nowIndex) {
          x = nowIndex === 0 ? splitX : xLeft + (i / nowIndex) * (splitX - xLeft);
        } else {
          const fLen = series.length - 1 - nowIndex;
          x = splitX + ((i - nowIndex) / fLen) * (xRight - splitX);
        }
        return `${x.toFixed(1)},${valToY(v).toFixed(1)}`;
      })
      .join(' ');

    const nowY = valToY(series[nowIndex]).toFixed(1);

    svg.innerHTML = `
      <rect x="${splitX - 1}" y="${pad}" width="2" height="${h - pad * 2}" fill="rgba(255,255,255,0.12)" rx="1"/>
      <text class="an-chart-split__divider-label" x="${splitX}" y="${pad + 2}" text-anchor="middle">сейчас</text>
      <text class="an-chart-zone-label" x="14" y="${h - 2}">история</text>
      <text class="an-chart-zone-label" x="${w - 14}" y="${h - 2}" text-anchor="end">прогноз</text>
      <polyline fill="none" stroke="#c4b5fd" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="${points}"/>
      <circle cx="${splitX}" cy="${nowY}" r="3.5" fill="#c4b5fd"/>
    `;
  }

  function updateForecast(months) {
    const projected = LIQUIDITY_NOW + MONTHLY_DELTA * months;
    const valueEl = document.querySelector('[data-forecast-value]');
    const hintEl = document.querySelector('[data-forecast-hint]');
    const splitSvg = document.querySelector('[data-chart="liquidity-split"]');
    if (valueEl) valueEl.textContent = fmt(projected);
    if (hintEl) {
      hintEl.textContent =
        'Слева — ' +
        (HISTORY_LIQUIDITY.length - 1) +
        ' закрытых хода; справа — ' +
        months +
        ' мес. при остатке +' +
        MONTHLY_DELTA.toLocaleString('ru-RU') +
        ' ₽/мес. Без событий и сделок.';
    }
    if (splitSvg) drawLiquiditySplit(splitSvg, months);
  }

  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-btn');
      root.setAttribute('data-theme', theme);
      document.querySelectorAll('[data-theme-btn]').forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  const incomeSvg = document.querySelector('[data-chart="income-expense"]');
  if (incomeSvg) drawIncomeExpense(incomeSvg);

  const seg = document.querySelector('[data-forecast-seg]');
  if (seg) {
    seg.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        seg.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b === btn));
        updateForecast(Number(btn.getAttribute('data-months')));
      });
    });
    updateForecast(3);
  }
})();
