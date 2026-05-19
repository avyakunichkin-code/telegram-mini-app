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
      <MetricInlineItem tip="Остаток долга (тело)" glyph="coin">
        <MoneyText value={totalDebt} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Платёж за период (списание в конце периода; в модели совпадает с ежемесячным платежом)" glyph="down" tone="neg">
        <MoneyText value={monthlyPayment} decimals={0} />
      </MetricInlineItem>
      {showOverdue ? (
        <MetricInlineItem tip="Просрочка к доплате за период" glyph="down" tone="neg">
          <MoneyText value={overdueAmount} decimals={0} />
        </MetricInlineItem>
      ) : null}
      <MetricInlineItem tip="Годовая ставка — платим проценты по долгу" glyph="percent" tone="neg">
        {Number(annualRatePercent)}
      </MetricInlineItem>
    </MetricsRow>
  );
}
