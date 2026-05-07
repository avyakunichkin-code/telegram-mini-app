/** Мини-линейные графики без зависимостей (видна траектория по закрытым периодам + текущий снимок). */

function SparkLineSvg({ series, title, subtitle, accent = 'violet' }) {
  const vals = (series ?? []).filter((v) => Number.isFinite(v));
  if (vals.length === 0) return null;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(max - min, 1e-6);
  const w = 220;
  const h = 48;
  const pad = 4;
  const points = vals
    .map((v, i) => {
      const x = pad + (i / Math.max(vals.length - 1, 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`mq-spark-block mq-spark-block--${accent}`}>
      <div className="mq-spark-block__titles">
        <span className="mq-spark-block__title">{title}</span>
        {subtitle ? <span className="mq-spark-block__sub">{subtitle}</span> : null}
      </div>
      <svg className="mq-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden role="presentation">
        <polyline fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    </div>
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
  const tail = last?.is_projection ? 'текущий период' : 'последняя точка';

  return (
    <div className="mq-spark-pair">
      <SparkLineSvg
        series={cashSeries}
        title="Денежный счёт"
        subtitle={`${Number.isFinite(lastCash) ? lastCash.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'} ₽ · ${tail}`}
        accent="violet"
      />
      <SparkLineSvg
        series={cushionSeries}
        title="Подушка безопасности"
        subtitle={`${Number.isFinite(lastCushion) ? lastCushion.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'} ₽ · ${tail}`}
        accent="emerald"
      />
    </div>
  );
}
