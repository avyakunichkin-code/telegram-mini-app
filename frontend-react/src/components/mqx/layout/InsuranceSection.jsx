import { InsurancePolicyRow } from './InsurancePolicyRow';
import { InsuranceProductPicker } from './InsuranceProductPicker';

/**
 * Блок «Страховки» для Finance / Capital: оформление (сетка + тарифы) + активные полисы.
 */
export function InsuranceSection({
  policies = [],
  buyingPlanKey = null,
  cancellingPolicyId = null,
  onBuy,
  onCancel,
  intro = 'Премия списывается в конце периода. При страховом случае — полная выплата, полис закрывается.',
}) {
  return (
    <>
      {intro ? <div className="mqx-card__sub">{intro}</div> : null}
      <InsuranceProductPicker onBuy={onBuy} buyingPlanKey={buyingPlanKey} />
      <div className="mqx-ins-policy-list">
        {policies.length === 0 ? (
          <div className="mqx-fin-empty">Нет активных полисов</div>
        ) : (
          policies.map((p) => (
            <InsurancePolicyRow
              key={p.id}
              policy={p}
              busy={cancellingPolicyId === p.id}
              onCancel={onCancel}
            />
          ))
        )}
      </div>
    </>
  );
}
