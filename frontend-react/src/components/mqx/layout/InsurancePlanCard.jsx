import { findInsuranceCatalogItem, insuranceAccentClass } from '../../../constants/insuranceProducts';
import { InsurancePlanMetrics } from '../metrics/InsurancePlanMetrics';
import { CapitalPositionCard } from './CapitalPositionCard';

/** Готовый тариф — карточка как asset H: accent, kicker, метрики, кнопка «+». */
export function InsurancePlanCard({ plan, busy, onBuy }) {
  const catalog = findInsuranceCatalogItem(plan.kind);
  const accent = insuranceAccentClass(catalog.product);

  return (
    <CapitalPositionCard
      variant="insurance"
      accentTone={accent}
      kicker={`${catalog.product_label} · ${catalog.object_label}`}
      title={`${catalog.title} — ${plan.label}`}
      metrics={
        <InsurancePlanMetrics
          monthlyPremium={plan.monthly_premium}
          payoutAmount={plan.payout_amount}
          termPeriods={plan.term_periods}
        />
      }
      action={{
        className: 'mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn',
        onClick: () => !busy && onBuy(plan),
      }}
      actionLabel="+"
      actionAriaLabel={`Оформить ${catalog.title} — ${plan.label}`}
    />
  );
}
