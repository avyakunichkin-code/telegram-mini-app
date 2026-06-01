import { findInsuranceCatalogItem } from '../../../constants/insuranceProducts';
import { InsurancePolicyMetrics } from '../metrics/InsurancePolicyMetrics';
import { MqxFinListRow } from './MqxFinListRow';
import { MqxRowAction } from '../primitives/MqxRowAction';

/** Активный полис — компактная строка (`MqxFinListRow`), как позиции инвестиций. */
export function InsurancePolicyRow({ policy, onCancel, busy }) {
  const catalog = findInsuranceCatalogItem(policy.kind);
  const subtitle = `${catalog.product_label} · ${catalog.object_label}`;

  return (
    <MqxFinListRow
      className="mqx-fin-row--ins-policy"
      title={policy.title}
      subtitle={subtitle}
      metrics={<InsurancePolicyMetrics policy={policy} />}
      trailing={
        <MqxRowAction
          variant="remove"
          ariaLabel={`Отменить полис ${policy.title}`}
          disabled={busy}
          onClick={() => onCancel(policy.id)}
        />
      }
    />
  );
}
