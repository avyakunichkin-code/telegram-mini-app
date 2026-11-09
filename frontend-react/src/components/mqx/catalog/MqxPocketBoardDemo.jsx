import { useState } from 'react';
import { DashboardScreen } from '../../../screens/game/DashboardScreen';
import { CATALOG_VICTORY_DEMO } from './catalogVictoryDemo';

export function MqxPocketBoardDemo() {
  const [claimed, setClaimed] = useState(false);
  const [turn, setTurn] = useState(8);
  const [notice, setNotice] = useState('Условные данные. Пример не меняет настоящую партию.');
  const [scenario, setScenario] = useState('normal');
  const cash = (scenario === 'large' ? 12500000 : 42000) + (claimed ? 50000 : 0);
  const charges = scenario === 'risk' ? 95000 : 30000;
  const overview = {
    period_index: turn, cash_balance: cash, safety_fund_balance: 25000,
    salary: { monthly_amount: 50000 }, total_monthly_income: 50000,
    total_monthly_outflow: charges, total_monthly_obligations: charges,
    safety_fund_baseline_target: charges * 3,
    starter_template_key: scenario === 'large' ? 'mq_game_debt_stack_v1' : 'mq_game_basic_v1',
    needs: { comfort: 70, status: 45, social: scenario === 'low' ? 39 : 60, health: 80 },
    treat_self: { available: true }, victory: CATALOG_VICTORY_DEMO,
    period_close_preview: { estimated_charges_total: charges, estimated_cash_after_close: cash - charges,
      would_be_negative_after_close: cash < charges, defeat_if_close_negative: scenario === 'risk' },
  };
  return <div data-catalog-demo="pocket-board">
    <p className="mqx-catalog__lead">А · «Игровой пульт» · утверждено 06.11.2026. Настоящие React-компоненты; баланс внутри карты, G1 с фирменной подписью, высоты зарплаты и подсказки стабильны.</p>
    <label>Пример <select value={scenario} onChange={event => setScenario(event.target.value)}>
    <option value="normal">Обычный ход</option><option value="risk">Риск поражения</option><option value="large">Крупные суммы</option><option value="low">Низкие потребности</option>
    </select></label>
    <DashboardScreen profileId="catalog-pocket" overview={overview} timeStatus={{ period_index: turn }}
      periodStatus={{ salary_claimed: claimed, can_claim_salary: !claimed }} eventsUnlocked pendingEventsCount={2}
      onOpenEvents={() => setNotice('Открытие событий: в игре используется действующая карусель.')}
      onNextPeriod={() => { setTurn(value => value + 1); setClaimed(false); }}
      claimSalary={async () => { setClaimed(true); return { status: 'success', amount: 50000 }; }}
      contributeToSafetyFund={async () => setNotice('Пример перевода в подушку.')}
      withdrawFromSafetyFund={async () => setNotice('Пример снятия из подушки.')}
      onGoFinanceInvest={() => setNotice('Переход к вложениям.')}
      onGoCapitalFlows={() => setNotice('Переход к финансовым потокам.')}
      getNeedsGuide={async () => ({})} treatSelf={async () => ({})} />
    <p role="status">{notice}</p>
  </div>;
}
