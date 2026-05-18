import {
  IconMetricCoins,
  IconMetricPercent,
  IconMetricTrendDown,
  IconMetricTrendUp,
} from '../icons/FinanceMetricIcons';

const GLYPH_ICONS = {
  coin: IconMetricCoins,
  down: IconMetricTrendDown,
  up: IconMetricTrendUp,
  percent: IconMetricPercent,
};

/** Иконка + значение в линию; подсказка при наведении. */
export function MetricInlineItem({ tip, tone, glyph, children }) {
  const Icon = GLYPH_ICONS[glyph];
  return (
    <span
      className="mqx-inline-metric"
      role="listitem"
      data-tip={tip}
      title={tip}
      aria-label={tip}
      tabIndex={0}
    >
      <span className={`mqx-metric-glyph mqx-metric-glyph--${glyph}${tone ? ` mqx-metric-glyph--${tone}` : ''}`} aria-hidden="true">
        {Icon ? <Icon /> : null}
      </span>
      <span className={`mqx-inline-metric__val${tone ? ` mqx-inline-metric__val--${tone}` : ''}`}>{children}</span>
    </span>
  );
}
