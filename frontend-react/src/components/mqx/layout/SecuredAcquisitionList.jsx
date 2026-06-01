import { AssetTemplateMetrics } from '../metrics/AssetTemplateMetrics';
import { LiabilityTemplateMetrics } from '../metrics/LiabilityTemplateMetrics';
import { MoneyText } from '../../MoneyText';
import { CapitalPositionCard } from './CapitalPositionCard';

/** Список bundle «первый взнос + кредит + актив». */
export function SecuredAcquisitionList({ bundles, onAcquire, busyKey = null }) {
  if (!bundles.length) {
    return <p className="mqx-capital-sheet-empty">Нет доступных связок кредит и актив.</p>;
  }

  return (
    <div className="mqx-capital-template-list">
      {bundles.map((b) => {
        const rowKey = `${b.liabilityKey}:${b.assetKey}`;
        return (
          <CapitalPositionCard
            key={rowKey}
            variant="asset"
            title={`${b.assetTitle} · ${b.liabilityTitle}`}
            kicker={
              <>
                Первый взнос <MoneyText value={b.downPayment} decimals={0} /> · кредит{' '}
                <MoneyText value={b.principal} decimals={0} />
              </>
            }
            metrics={
              <>
                <AssetTemplateMetrics
                  assetValue={b.assetValue}
                  monthlyMaintenanceCost={0}
                  monthlyIncome={0}
                />
                <LiabilityTemplateMetrics
                  totalDebt={b.principal}
                  monthlyPayment={b.monthlyPayment}
                  annualRatePercent={b.annualRatePercent}
                />
              </>
            }
            action={{
              onClick: () => void onAcquire(b),
              disabled: busyKey === rowKey,
            }}
            actionLabel="+"
            actionAriaLabel={`Оформить: ${b.assetTitle}`}
          />
        );
      })}
    </div>
  );
}
