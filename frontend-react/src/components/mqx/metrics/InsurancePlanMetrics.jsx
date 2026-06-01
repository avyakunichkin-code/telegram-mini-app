import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

/** Тариф страховки: оплата за период, сумма выплаты, срок. */
export function InsurancePlanMetrics({ monthlyPremium, payoutAmount, termPeriods }) {
  return (
    <MetricsRow className="mqx-ins-metrics">
      <MetricInlineItem tip="Сумма выплаты при случае (лимит)" glyph="coin">
        <MoneyText value={payoutAmount} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Премия за период (списание в конце периода)" glyph="down" tone="neg">
        <MoneyText value={monthlyPremium} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Срок действия (число периодов)" glyph="term">
        {termPeriods} пер.
      </MetricInlineItem>
    </MetricsRow>
  );
}
