import { MoneyText } from '../../MoneyText';
import { investMonthlyAccrual } from '../../../constants/investProducts';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

/** Позиция депозита/облигации: порядок — сумма → доход → ставка (число без «%», цвет по tone). */
export function InvestPositionMetrics({ principal, annualRatePercent, rateTone = 'pos' }) {
  const monthly = investMonthlyAccrual(principal, annualRatePercent);

  return (
    <MetricsRow className="mqx-asset-metrics-inline--invest">
      <MetricInlineItem tip="Сумма позиции (остаток)" glyph="coin">
        <MoneyText value={principal} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Доход за период (начисление в конце периода; в модели — 1/12 годовой ставки)" glyph="up" tone="pos">
        <MoneyText value={monthly} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem
        tip={
          rateTone === 'neg'
            ? 'Годовая ставка — платим проценты по обязательству'
            : 'Годовая ставка — получаем проценты (депозит / купон)'
        }
        glyph="percent"
        tone={rateTone}
      >
        {Number(annualRatePercent)}
      </MetricInlineItem>
    </MetricsRow>
  );
}
