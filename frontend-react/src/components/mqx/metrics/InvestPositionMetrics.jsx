import { MoneyText } from '../../MoneyText';
import { investMonthlyAccrual } from '../../../constants/investProducts';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

/** Позиция депозита/облигации: сумма, ставка % (зелёная), доход за период. */
export function InvestPositionMetrics({ principal, annualRatePercent, rateTone = 'pos' }) {
  const monthly = investMonthlyAccrual(principal, annualRatePercent);

  return (
    <MetricsRow className="mqx-asset-metrics-inline--invest">
      <MetricInlineItem tip="Сумма позиции" glyph="coin">
        <MoneyText value={principal} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Ставка годовых" glyph="percent" tone={rateTone}>
        {Number(annualRatePercent)}%
      </MetricInlineItem>
      <MetricInlineItem tip="Доход за период (1/12 ставки)" glyph="up" tone="pos">
        <MoneyText value={monthly} decimals={0} />
      </MetricInlineItem>
    </MetricsRow>
  );
}
