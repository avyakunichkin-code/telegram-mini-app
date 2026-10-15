/** SVG-графики аналитики ★ BG-2 без chart-lib. Канон: design-lab/analytics/APPROVED.md. */

import { buildForecastChart, turnsPhrase } from './mqx/utils/analyticsBoardDisplay';

const num = (v) => {
  const n = Math.round(Number(v) || 0);
  return `${n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('ru-RU')}`;
};
const rub = (v) => `${num(v)} ₽`;

/** Полоса долей «Куда уходит доход»: ширины — атрибутами SVG, без inline-style. */
export function IncomeSplitBar({ segments }) {
  const parts = (segments ?? []).filter((s) => s.share > 0);
  let x = 0;
  const label = parts.map((s) => `${s.label} ${Math.round(s.share * 100)}%`).join(', ');
  return (
    <svg className="mqx-an-stack" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label={label}>
      {parts.map((s) => {
        const w = s.share * 100;
        const rect = <rect key={s.key} className={`mqx-an-tone--${s.tone}`} x={x} y="0" width={w} height="10" />;
        x += w;
        return rect;
      })}
    </svg>
  );
}

/** «Счёт + подушка»: факт сплошной фиолетовой, прогноз пунктиром золотом, отметка «сейчас». */
export function LiquidityForecastChart({ points, liquidityNow, delta, horizon = 3 }) {
  const g = buildForecastChart({ points, liquidityNow, delta, horizon });
  const nowLabelLeft = g.now.x > 60;
  // Подпись прогноза — по свободную сторону линии: рост → под концом, падение → вверху справа.
  const endLabelY =
    g.end.value > g.now.value
      ? Math.min(g.end.y + 16, g.baseY - 4)
      : g.end.value < g.now.value
        ? 10
        : Math.max(10, g.end.y - 8);
  const aria =
    g.closedCount > 0
      ? `Было ${rub(g.first)} ${turnsPhrase(g.closedCount)} назад, сейчас ${rub(g.now.value)}, через ${turnsPhrase(horizon)} — около ${rub(g.end.value)}`
      : `Сейчас ${rub(g.now.value)}, через ${turnsPhrase(horizon)} — около ${rub(g.end.value)}`;

  return (
    <svg className="mqx-an-chart__svg" viewBox={`0 0 ${g.width} ${g.height}`} role="img" aria-label={aria}>
      <line className="mqx-an-chart__base" x1="0" y1={g.baseY} x2={g.width} y2={g.baseY} />
      <line className="mqx-an-chart__grid" x1="0" y1={g.midY} x2={g.width} y2={g.midY} />
      {g.historyPoints ? <polyline className="mqx-an-chart__fact" points={g.historyPoints} /> : null}
      <polyline className="mqx-an-chart__forecast" points={g.forecastPoints} />
      <line className="mqx-an-chart__now-line" x1={g.now.x} y1="12" x2={g.now.x} y2={g.baseY} />
      <circle className="mqx-an-chart__now-dot" cx={g.now.x} cy={g.now.y} r="5" />
      <text
        className="mqx-an-chart__label"
        x={nowLabelLeft ? g.now.x - 6 : g.now.x + 6}
        y="10"
        textAnchor={nowLabelLeft ? 'end' : 'start'}
      >
        сейчас
      </text>
      <text className="mqx-an-chart__label mqx-an-chart__label--coin" x={g.width - 6} y={endLabelY} textAnchor="end">
        ≈{num(g.end.value)}
      </text>
    </svg>
  );
}
