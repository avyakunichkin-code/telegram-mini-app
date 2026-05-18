import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

/** Тариф страховки: оплата за период, сумма выплаты, срок. */
export function InsurancePlanMetrics({ monthlyPremium, payoutAmount, termPeriods }) {
  return (
    <MetricsRow className="mqx-ins-metrics">
      <MetricInlineItem tip="Оплата за период" glyph="down" tone="neg">
        <MoneyText value={monthlyPremium} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Сумма выплаты при случае" glyph="coin">
        <MoneyText value={payoutAmount} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Срок действия" glyph="term">
        {termPeriods} пер.
      </MetricInlineItem>
    </MetricsRow>
  );
}
