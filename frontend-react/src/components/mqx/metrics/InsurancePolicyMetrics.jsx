import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

/** Активный полис: премия, выплата, срок (периоды). */
export function InsurancePolicyMetrics({ policy }) {
  const payout = policy.payout_amount ?? policy.coverage_limit ?? 0;
  const term =
    policy.started_period_index && policy.expires_period_index
      ? `${policy.started_period_index}–${policy.expires_period_index}`
      : policy.term_periods
        ? `${policy.term_periods} пер.`
        : '—';

  return (
    <MetricsRow className="mqx-ins-metrics">
      <MetricInlineItem tip="Оплата за период" glyph="down" tone="neg">
        <MoneyText value={policy.monthly_premium} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Сумма выплаты" glyph="coin">
        <MoneyText value={payout} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Срок" glyph="term">
        {term}
      </MetricInlineItem>
    </MetricsRow>
  );
}
