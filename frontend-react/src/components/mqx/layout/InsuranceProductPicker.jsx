import { useMemo, useState } from 'react';
import {
  DEFAULT_INSURANCE_CATALOG_KEY,
  findInsuranceCatalogItem,
  insuranceGridCatalog,
  plansForKind,
} from '../../../constants/insuranceProducts';
import { assetsForInsuranceKind, insuranceKindNeedsAsset } from '../../../utils/capitalDl1';
import { InsuranceCatalogGrid } from './InsuranceCatalogGrid';
import { InsurancePlanCard } from './InsurancePlanCard';

/**
 * Вариант B: сетка 2×2 типов + список готовых тарифов (без редактирования полей).
 */
export function InsuranceProductPicker({ ownedAssets = [], onBuy, buyingPlanKey = null }) {
  const gridItems = useMemo(() => insuranceGridCatalog(), []);
  const [selectedKind, setSelectedKind] = useState(DEFAULT_INSURANCE_CATALOG_KEY);
  const selected = findInsuranceCatalogItem(selectedKind);
  const plans = useMemo(() => plansForKind(selectedKind), [selectedKind]);

  const assetNeed = insuranceKindNeedsAsset(selectedKind);
  const eligibleAssets = useMemo(
    () => assetsForInsuranceKind(ownedAssets, assetNeed),
    [ownedAssets, assetNeed],
  );
  const [insuredAssetId, setInsuredAssetId] = useState(null);

  const effectiveAssetId = useMemo(() => {
    if (!assetNeed) return null;
    if (insuredAssetId && eligibleAssets.some((a) => a.id === insuredAssetId)) {
      return insuredAssetId;
    }
    return eligibleAssets[0]?.id ?? null;
  }, [assetNeed, insuredAssetId, eligibleAssets]);

  const handleBuy = (plan) => {
    const payload = { plan_key: plan.plan_key };
    if (assetNeed) {
      if (!effectiveAssetId) return;
      payload.insured_asset_id = effectiveAssetId;
    }
    onBuy(payload, plan);
  };

  return (
    <div className="mqx-ins-picker">
      <InsuranceCatalogGrid items={gridItems} selectedKind={selectedKind} onSelect={setSelectedKind} />
      <div className="mqx-ins-picker__heading">{selected.title}</div>
      <p className="mqx-ins-picker__hint">Выберите тариф — параметры фиксированы, премию спишем в конце периода.</p>

      {assetNeed ? (
        <div className="mqx-ins-picker__asset">
          {eligibleAssets.length === 0 ? (
            <p className="mqx-ins-picker__asset-empty">
              {assetNeed === 'car'
                ? 'Сначала оформите автомобиль (вкладка «Авто»).'
                : 'Сначала купите недвижимость (вкладка «Недвижимость»).'}
            </p>
          ) : (
            <>
              <label className="mqx-ins-picker__asset-label" htmlFor="ins-asset-select">
                Объект страхования
              </label>
              <select
                id="ins-asset-select"
                className="mqx-ins-picker__asset-select"
                value={effectiveAssetId ?? ''}
                onChange={(e) => setInsuredAssetId(Number(e.target.value))}
              >
                {eligibleAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      ) : null}

      <div className="mqx-ins-plan-list">
        {plans.map((plan) => (
          <InsurancePlanCard
            key={plan.plan_key}
            plan={plan}
            busy={buyingPlanKey === plan.plan_key}
            disabled={assetNeed && !effectiveAssetId}
            onBuy={() => handleBuy(plan)}
          />
        ))}
      </div>
    </div>
  );
}
