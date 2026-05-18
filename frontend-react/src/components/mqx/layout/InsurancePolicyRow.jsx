import { findInsuranceCatalogItem, insuranceAccentClass } from '../../../constants/insuranceProducts';
import { InsurancePolicyMetrics } from '../metrics/InsurancePolicyMetrics';
import { CapitalPositionCard } from './CapitalPositionCard';

/** Активный полис — та же сетка H, кнопка «−» (отмена). */
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
        className: 'mqx-capital-delete-btn',
        onClick: () => !busy && onCancel(policy.id),
      }}
      actionLabel="−"
      actionAriaLabel={`Отменить полис ${policy.title}`}
    />
  );
}
