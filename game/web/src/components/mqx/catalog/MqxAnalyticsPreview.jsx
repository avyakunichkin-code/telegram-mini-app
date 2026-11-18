import { useState } from 'react';
import { BottomGameNav } from '../../BottomGameNav';
import { MqxAnalyticsPage } from '../layout/MqxAnalyticsPage';

const scenarios = {
  surplus: { label: 'Большая подушка', cash: 42000, reserve: 240000, income: 35000, expenses: 30000, turn: 8 },
  thin: { label: 'Тонкая подушка', cash: 42000, reserve: 15000, income: 35000, expenses: 30000, turn: 8 },
  deficit: { label: 'Дефицит', cash: 24000, reserve: 15000, income: 25000, expenses: 30000, turn: 8 },
  first: { label: 'Первый ход', cash: 42000, reserve: 0, income: 35000, expenses: 30000, turn: 1 },
};

export function MqxAnalyticsPreview() {
  const [scenario, setScenario] = useState('surplus');
  const model = scenarios[scenario];
  const { cash, reserve, income, expenses, turn } = model;
  const history = [3, 2, 1].filter((offset) => offset < turn).map((offset) => ({
    period_index: turn - offset,
    cash_balance: cash - offset * (income - expenses),
    safety_fund_balance: reserve,
  }));

  return (
    <div className="app-shell mqx-menu-preview mqx-capital-pocket-preview mqx-analytics-lab">
      <MqxAnalyticsPage {...model} history={history}>
        <label className="mqx-analytics-pocket__scenario">
          Сценарий Design Lab
          <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
            {Object.entries(scenarios).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
          </select>
        </label>
      </MqxAnalyticsPage>
      <BottomGameNav activeTab="analytics" setActiveTab={() => {}} />
    </div>
  );
}
