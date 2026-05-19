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
      <MetricInlineItem tip="Лимит выплаты / покрытие по полису" glyph="coin">
        <MoneyText value={payout} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Премия за период (списание в конце периода)" glyph="down" tone="neg">
        <MoneyText value={policy.monthly_premium} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Срок действия (периоды игры)" glyph="term">
        {term}
      </MetricInlineItem>
    </MetricsRow>
  );
}
