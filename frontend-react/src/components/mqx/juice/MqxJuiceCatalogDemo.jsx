import { useState } from 'react';
import { MqxJuiceGainFeedback } from './MqxJuiceGainFeedback';
import { MqxPeriodCloseRitual } from './MqxPeriodCloseRitual';
import { MqxSalaryWarnModal } from './MqxSalaryWarnModal';
import { MqxButton } from '../primitives/MqxButton';

const DEMO_PERIOD_CLOSE = {
  closed_period_index: 2, new_balance:50133, cash_delta:25133,
  income_delta:62633,expense_delta:37500,safety_fund_delta:0,
  period_highlights:[
    {key:'expenses',label:'Расходы списаны',amount:37500},
    {key:'bond_coupons',label:'Купоны по облигациям на счёт',amount:133},
    {key:'deposit_interest',label:'Проценты на депозитах',amount:117,note:'капитализированы'},
  ],
};

/** Витрина juice A/C/D для #/dev/mqx */
export function MqxJuiceCatalogDemo() {
  const [burstKey, setBurstKey] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [ritualOpen, setRitualOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);

  const playGain = () => {
    setBurstKey((k) => k + 1);
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 2400);
  };

  return (
    <div className="mqx-catalog-juice">
      <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
        ★ Gain и Warning — game-ui/juice-round. Итог хода — утверждённый компактный A из period-close/clear-result-round.
      </p>
      <div className="mqx-juice-host" style={{ maxWidth: 360, minHeight: 200, marginTop: 12 }}>
        <MqxJuiceGainFeedback
          burstKey={burstKey}
          amount={12400}
          toastVisible={toastVisible}
          toastMessage="Зарплата в кошелёк — ход стал сильнее"
        />
        <MqxButton variant="primary" onClick={playGain}>
          A — проиграть gain
        </MqxButton>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        <MqxButton variant="secondary" onClick={() => setRitualOpen(true)}>
          C — ритуал хода
        </MqxButton>
        <MqxButton variant="secondary" onClick={() => setWarnOpen(true)}>
          D — зарплата сгорит
        </MqxButton>
      </div>
      <MqxPeriodCloseRitual
        summary={DEMO_PERIOD_CLOSE}
        open={ritualOpen}
        onClose={() => setRitualOpen(false)}
      />
      <MqxSalaryWarnModal
        open={warnOpen}
        salaryAmount={12400}
        onClose={() => setWarnOpen(false)}
        onConfirmSkip={() => setWarnOpen(false)}
      />
    </div>
  );
}
