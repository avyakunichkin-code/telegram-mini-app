import { findInsuranceCatalogItem, insuranceAccentClass } from '../../../constants/insuranceProducts';
import { InsurancePolicyMetrics } from '../metrics/InsurancePolicyMetrics';
import { CapitalPositionCard } from './CapitalPositionCard';

/** Активный полис — та же сетка H, удаление (корзина по канону F2). */
export function InsurancePolicyRow({ policy, onCancel, busy }) {
  const catalog = findInsuranceCatalogItem(policy.kind);
  const accent = insuranceAccentClass(policy.product ?? catalog.product);
  const kicker = `${catalog.product_label} · ${catalog.object_label}`;

  return (
    <CapitalPositionCard
      variant="insurance"
      accentTone={accent}
      kicker={kicker}
      title={policy.title}
      metrics={<InsurancePolicyMetrics policy={policy} />}
      action={{
        onClick: () => !busy && onCancel(policy.id),
        disabled: busy,
      }}
      actionLabel="−"
      actionAriaLabel={`Отменить полис ${policy.title}`}
    />
  );
}
