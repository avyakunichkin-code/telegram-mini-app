import { useMemo, useState } from 'react';
import {
  DEFAULT_INSURANCE_CATALOG_KEY,
  findInsuranceCatalogItem,
  insuranceGridCatalog,
  plansForKind,
} from '../../../constants/insuranceProducts';
import { InsuranceCatalogGrid } from './InsuranceCatalogGrid';
import { InsurancePlanCard } from './InsurancePlanCard';

/**
 * Вариант B: сетка 2×2 типов + список готовых тарифов (без редактирования полей).
 */
export function InsuranceProductPicker({ onBuy, buyingPlanKey = null }) {
  const gridItems = useMemo(() => insuranceGridCatalog(), []);
  const [selectedKind, setSelectedKind] = useState(DEFAULT_INSURANCE_CATALOG_KEY);
  const selected = findInsuranceCatalogItem(selectedKind);
  const plans = useMemo(() => plansForKind(selectedKind), [selectedKind]);

  return (
    <div className="mqx-ins-picker">
      <InsuranceCatalogGrid items={gridItems} selectedKind={selectedKind} onSelect={setSelectedKind} />
      <div className="mqx-ins-picker__heading">{selected.title}</div>
      <p className="mqx-ins-picker__hint">Выберите тариф — параметры фиксированы, премию спишем в конце периода.</p>
      <div className="mqx-ins-plan-list">
        {plans.map((plan) => (
          <InsurancePlanCard
            key={plan.plan_key}
            plan={plan}
            busy={buyingPlanKey === plan.plan_key}
            onBuy={onBuy}
          />
        ))}
      </div>
    </div>
  );
}
