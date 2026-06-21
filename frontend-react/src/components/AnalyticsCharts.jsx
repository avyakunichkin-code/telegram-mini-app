/** SVG-графики аналитики без внешних chart-lib (канон AN1 v2, lab A ★). */

const CHART_W = 320;
const CHART_H_INCOME = 56;
const CHART_H_LIQ = 72;

function seriesToPoints(values, width, height, pad, x0, x1) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-6);
  return values
    .map((v, i) => {
      const x = x0 + (i / Math.max(values.length - 1, 1)) * (x1 - x0);
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function mapSplitSeries(series, nowIndex, width, height, pad, splitX) {
  const xLeft = 12;
  const xRight = width - 12;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(max - min, 1e-6);
  const valToY = (v) => pad + (1 - (v - min) / span) * (height - pad * 2);

  return series
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
}

function splitNowY(series, nowIndex, height, pad) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(max - min, 1e-6);
  const valToY = (v) => pad + (1 - (v - min) / span) * (height - pad * 2);
  return valToY(series[nowIndex]).toFixed(1);
}

export function SparkLineSvg({ series, title, subtitle, accent = 'violet', dark = false, height = 48 }) {
  const vals = (series ?? []).filter((v) => Number.isFinite(v));
  if (vals.length === 0) return null;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(max - min, 1e-6);
  const w = 220;
  const h = height;
  const pad = 4;
  const points = vals
    .map((v, i) => {
      const x = pad + (i / Math.max(vals.length - 1, 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`mq-spark-block mq-spark-block--${accent}${dark ? ' mq-spark-block--dark' : ''}`}>
      <div className="mq-spark-block__titles">
        <span className="mq-spark-block__title">{title}</span>
        {subtitle ? <span className="mq-spark-block__sub">{subtitle}</span> : null}
      </div>
      <svg
        className="mq-sparkline"
        style={{ height: `${h}px` }}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
        role="presentation"
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    </div>
  );
}

/** Две линии доход/расход по закрытым ходам (одна шкала Y). */
export function IncomeExpenseChart({ points }) {
  const closed = (points ?? []).filter((p) => !p.is_projection);
  const income = closed.map((p) => Number(p.period_income_rate)).filter((v) => Number.isFinite(v));
  const expense = closed.map((p) => Number(p.period_expense_total)).filter((v) => Number.isFinite(v));

  if (closed.length === 0 || (income.every((v) => v === 0) && expense.every((v) => v === 0))) {
    return (
      <p className="mqx-analytics-dark__err">Пока нет завершённых ходов — график появится после первого «Закрыть месяц».</p>
    );
  }

  const combined = [...income, ...expense];
  const min = Math.min(...combined);
  const max = Math.max(...combined);
  const span = Math.max(max - min, 1e-6);
  const pad = 6;
  const w = CHART_W;
  const h = CHART_H_INCOME;

  const toPts = (values) =>
    values
      .map((v, i) => {
        const x = 8 + (i / Math.max(values.length - 1, 1)) * (w - 16);
        const y = pad + (1 - (v - min) / span) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="mqx-analytics-chart-block">
      <div className="mqx-analytics-chart-block__head">
        <div className="mqx-analytics-chart-block__titles">
          <p className="mqx-analytics-chart-block__title">Доходы и расходы</p>
          <p className="mqx-analytics-chart-block__sub">Факт за каждый закрытый ход · две линии на одном поле</p>
        </div>
      </div>
      <svg
        className="mqx-analytics-chart-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
        role="presentation"
      >
        <line x1="8" y1={h - pad} x2={w - 8} y2={h - pad} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <polyline
          className="mqx-analytics-chart-line mqx-analytics-chart-line--income"
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={toPts(income)}
        />
        <polyline
          className="mqx-analytics-chart-line mqx-analytics-chart-line--expense"
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={toPts(expense)}
        />
      </svg>
      <div className="mqx-analytics-chart-legend">
        <span>
          <i className="mqx-analytics-chart-legend__swatch mqx-analytics-chart-legend__swatch--income" aria-hidden /> Доходы
        </span>
        <span>
          <i className="mqx-analytics-chart-legend__swatch mqx-analytics-chart-legend__swatch--expense" aria-hidden /> Расходы
          (обязательства + жизнь)
        </span>
      </div>
    </div>
  );
}

/** Ликвидность: одна линия, история слева + прогноз справа (CashForecastSpark + split UI). */
export function LiquidityForecastChart({
  points,
  liquidityNow,
  monthlyDelta,
  forecastMonths,
  onForecastMonthsChange,
}) {
  const liquidity = (points ?? []).map((p) => (Number(p.cash_balance) || 0) + (Number(p.safety_fund_balance) || 0));
  if (liquidity.length === 0) {
    return (
      <p className="mqx-analytics-dark__err">Пока нет данных для прогноза ликвидности.</p>
    );
  }

  const tail = liquidity.slice(-Math.min(10, liquidity.length));
  const now = Number.isFinite(liquidityNow) ? liquidityNow : tail[tail.length - 1];
  const delta = Number(monthlyDelta) || 0;
  const months = Math.max(1, Number(forecastMonths) || 3);
  const projected = Array.from({ length: months + 1 }, (_, i) => now + i * delta);
  const series = [...tail.slice(0, -1), ...projected];
  const nowIndex = tail.length - 1;

  const w = CHART_W;
  const h = CHART_H_LIQ;
  const pad = 8;
  const splitX = Math.round(w * 0.58);
  const pointsStr = mapSplitSeries(series, nowIndex, w, h, pad, splitX);
  const nowY = splitNowY(series, nowIndex, h, pad);
  const endVal = projected[projected.length - 1];

  return (
    <div className="mqx-analytics-chart-block">
      <div className="mqx-analytics-chart-block__head">
        <div className="mqx-analytics-chart-block__titles">
          <p className="mqx-analytics-chart-block__title">Ликвидность: история и прогноз</p>
          <p className="mqx-analytics-chart-block__sub">
            {closedCountLabel(points)} · справа {months} мес. при Δ{' '}
            {delta >= 0 ? '+' : ''}
            {Math.round(delta).toLocaleString('ru-RU')} ₽/мес. Без событий и сделок.
          </p>
        </div>
        <div className="mqx-analytics-chart-block__value">
          {Number.isFinite(endVal) ? `≈ ${Math.round(endVal).toLocaleString('ru-RU')} ₽` : '—'}
        </div>
      </div>
      {onForecastMonthsChange ? (
        <div className="mqx-analytics-forecast-seg" role="group" aria-label="Горизонт прогноза">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              type="button"
              className={forecastMonths === m ? 'is-active' : ''}
              aria-pressed={forecastMonths === m}
              onClick={() => onForecastMonthsChange(m)}
            >
              {m} мес
            </button>
          ))}
        </div>
      ) : null}
      <svg
        className="mqx-analytics-chart-svg mqx-analytics-chart-svg--tall"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
        role="presentation"
      >
        <rect x={splitX - 1} y={pad} width="2" height={h - pad * 2} fill="rgba(255,255,255,0.12)" rx="1" />
        <text className="mqx-analytics-chart-split-label" x={splitX} y={pad + 2} textAnchor="middle">
          сейчас
        </text>
        <text className="mqx-analytics-chart-zone-label" x="14" y={h - 2}>
          история
        </text>
        <text className="mqx-analytics-chart-zone-label" x={w - 14} y={h - 2} textAnchor="end">
          прогноз
        </text>
        <polyline
          className="mqx-analytics-chart-line mqx-analytics-chart-line--liquidity"
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsStr}
        />
        <circle className="mqx-analytics-chart-now-dot" cx={splitX} cy={nowY} r="3.5" />
      </svg>
      <div className="mqx-analytics-chart-legend">
        <span>
          <i className="mqx-analytics-chart-legend__swatch mqx-analytics-chart-legend__swatch--liquidity" aria-hidden /> Одна
          траектория: факт слева, прямая экстраполяция справа от «сейчас»
        </span>
      </div>
      <p className="mqx-analytics-dark__hint">Живая траектория слева, экстраполяция справа. Без новых сделок и событий.</p>
    </div>
  );
}

function closedCountLabel(points) {
  const n = (points ?? []).filter((p) => !p.is_projection).length;
  if (n === 0) return 'Слева — нет закрытых ходов';
  return `Слева — ${n} ${n === 1 ? 'закрытый ход' : n < 5 ? 'закрытых хода' : 'закрытых ходов'}`;
}

/** @deprecated Используйте LiquidityForecastChart на экране AN1. */
export function CashForecastSpark({ timeseriesPayload, netMonthly }) {
  const pts = timeseriesPayload?.points ?? [];
  const cash = pts.map((p) => Number(p.cash_balance)).filter((v) => Number.isFinite(v));
  if (cash.length === 0) return null;

  const last = cash[cash.length - 1];
  const tail = cash.slice(-Math.min(10, cash.length));
  const net = Number(netMonthly) || 0;
  const horizon = 12;
  const projected = Array.from({ length: horizon + 1 }, (_, i) => last + i * net);
  const series = [...tail.slice(0, -1), ...projected];
  const endVal = projected[projected.length - 1];

  return (
    <SparkLineSvg
      series={series}
      title="Прогноз счёта"
      subtitle={`≈ ${Number.isFinite(endVal) ? endVal.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'} ₽ · +12 пер.`}
      accent="sky"
      dark
      height={56}
    />
  );
}

export function AnalyticsBalanceCharts({ timeseriesPayload }) {
  const pts = timeseriesPayload?.points ?? [];
  if (pts.length === 0) return null;

  const cashSeries = pts.map((p) => Number(p.cash_balance));
  const cushionSeries = pts.map((p) => Number(p.safety_fund_balance));

  const last = pts[pts.length - 1];
  const lastCash = Number(last?.cash_balance);
  const lastCushion = Number(last?.safety_fund_balance);
  const tail = last?.is_projection ? 'текущий ход' : 'последняя точка';

  return (
    <div className="mq-spark-pair">
      <SparkLineSvg
        series={cashSeries}
        title="Денежный счёт"
        subtitle={`${Number.isFinite(lastCash) ? lastCash.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'} ₽ · ${tail}`}
        accent="violet"
        dark={false}
      />
      <SparkLineSvg
        series={cushionSeries}
        title="Подушка безопасности"
        subtitle={`${Number.isFinite(lastCushion) ? lastCushion.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'} ₽ · ${tail}`}
        accent="emerald"
        dark={false}
      />
    </div>
  );
}
