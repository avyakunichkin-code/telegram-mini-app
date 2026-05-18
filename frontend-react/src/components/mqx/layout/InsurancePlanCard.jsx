import { Button } from '@telegram-apps/telegram-ui';
import { findInsuranceCatalogItem } from '../../../constants/insuranceProducts';
import { InsurancePlanMetrics } from '../metrics/InsurancePlanMetrics';

/** Готовый тариф: название, метрики, кнопка оформления. */
export function InsurancePlanCard({ plan, busy, onBuy }) {
  const catalog = findInsuranceCatalogItem(plan.kind);
  const title = `${catalog.title} — ${plan.label}`;

  return (
    <article className="mqx-ins-plan">
      <div className="mqx-ins-plan__body">
        <div className="mqx-ins-plan__title">{title}</div>
        <InsurancePlanMetrics
          monthlyPremium={plan.monthly_premium}
          payoutAmount={plan.payout_amount}
          termPeriods={plan.term_periods}
        />
      </div>
      <Button size="s" mode="filled" disabled={busy} onClick={() => onBuy(plan)}>
        Оформить
      </Button>
    </article>
  );
}
