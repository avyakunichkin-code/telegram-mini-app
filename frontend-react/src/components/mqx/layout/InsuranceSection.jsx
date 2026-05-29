import { useState } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { MqxModeButton } from '../primitives/MqxModeButton';
import { MqxCapitalEmpty } from '../primitives/MqxCapitalEmpty';
import { MqxSectionSeg } from '../primitives/MqxSectionSeg';
import { InsurancePolicyRow } from './InsurancePolicyRow';
import { InsuranceProductPicker } from './InsuranceProductPicker';

/**
 * Блок «Страховки» для Finance / Capital: оформление (сетка + тарифы) + активные полисы (сегмент B).
 */
export function InsuranceSection({
  policies = [],
  buyingPlanKey = null,
  cancellingPolicyId = null,
  onBuy,
  onCancel,
  intro = 'Премия списывается в конце периода. При страховом случае — полная выплата, полис закрывается.',
  useSectionSeg = false,
}) {
  const [uiMode, setUiMode] = useState('picker');
  const segMode = uiMode === 'picker' ? 'add' : 'mine';

  const introBlock = intro ? <div className="mqx-card__sub">{intro}</div> : null;

  const policiesList = (
    <div className="mqx-capital-position-list">
      {policies.length === 0 ? (
        <MqxCapitalEmpty
          message="Нет активных полисов"
          actionLabel="Оформить полис"
          onAction={() => setUiMode('picker')}
        />
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
  );

  if (useSectionSeg) {
    return (
      <>
        {introBlock}
        <MqxSectionSeg
          mode={segMode}
          onModeChange={(m) => setUiMode(m === 'add' ? 'picker' : 'policies')}
          addLabel="Оформить"
          mineLabel="Мои"
          mineCount={policies.length}
        />
        {uiMode === 'picker' ? (
          <InsuranceProductPicker onBuy={onBuy} buyingPlanKey={buyingPlanKey} />
        ) : (
          policiesList
        )}
      </>
    );
  }

  return (
    <>
      {introBlock}
      {uiMode === 'picker' ? (
        <>
          <InsuranceProductPicker onBuy={onBuy} buyingPlanKey={buyingPlanKey} />
          <div className="mqx-invest-form-actions">
            <MqxModeButton onClick={() => setUiMode('policies')}>
              Мои{policies.length ? ` (${policies.length})` : ''}
            </MqxModeButton>
          </div>
        </>
      ) : (
        <>
          <div className="mqx-fin-actions-top" style={{ marginTop: 12 }}>
            <Button mode="plain" size="s" onClick={() => setUiMode('picker')}>
              ← К оформлению
            </Button>
          </div>
          {policiesList}
        </>
      )}
    </>
  );
}
