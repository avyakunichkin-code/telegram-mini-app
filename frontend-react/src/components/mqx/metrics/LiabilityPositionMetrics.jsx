import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

export function LiabilityPositionMetrics({
  totalDebt,
  monthlyPayment,
  annualRatePercent,
  overdueAmount = 0,
}) {
  const showOverdue = Number(overdueAmount) > 0;

  return (
    <MetricsRow className="mqx-asset-metrics-inline--position">
      <MetricInlineItem tip="Остаток долга" glyph="coin">
        <MoneyText value={totalDebt} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Платёж в месяц" glyph="down" tone="neg">
        <MoneyText value={monthlyPayment} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Ставка годовых" glyph="percent" tone="neg">
        {Number(annualRatePercent)}%
      </MetricInlineItem>
      {showOverdue ? (
        <MetricInlineItem tip="Просрочка" glyph="down" tone="neg">
          <MoneyText value={overdueAmount} decimals={0} />
        </MetricInlineItem>
      ) : null}
    </MetricsRow>
  );
}
