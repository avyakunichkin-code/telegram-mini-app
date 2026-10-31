import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

export function LiabilityPositionMetrics({
  totalDebt,
  monthlyPayment,
  annualRatePercent,
  overdueAmount = 0,
  remainingPeriods = null,
}) {
  const showOverdue = Number(overdueAmount) > 0;
  const showTerm = remainingPeriods != null && Number(remainingPeriods) >= 0;

  return (
    <MetricsRow className="mqx-asset-metrics-inline--position">
      <MetricInlineItem tip="Остаток долга (тело)" glyph="coin">
        <MoneyText value={totalDebt} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Платёж за ход (списание в конце хода; в модели совпадает с ежемесячным платежом)" glyph="down" tone="neg">
        <MoneyText value={monthlyPayment} decimals={0} />
      </MetricInlineItem>
      {showOverdue ? (
        <MetricInlineItem tip="Просрочка к доплате за ход" glyph="overdue" tone="neg">
          <MoneyText value={overdueAmount} decimals={0} />
        </MetricInlineItem>
      ) : null}
      <MetricInlineItem tip="Годовая ставка — платим проценты по долгу" glyph="percent" tone="neg">
        {Number(annualRatePercent)}
      </MetricInlineItem>
      {showTerm ? (
        <MetricInlineItem tip="Осталось ходов по графику" glyph="term">
          {Number(remainingPeriods)}
        </MetricInlineItem>
      ) : null}
    </MetricsRow>
  );
}
