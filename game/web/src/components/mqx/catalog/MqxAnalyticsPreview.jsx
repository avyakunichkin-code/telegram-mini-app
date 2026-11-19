import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BottomGameNav } from '../../BottomGameNav';
import { MoneyText } from '../../MoneyText';
import { AnalyticsForecastControls, AnalyticsRecommendation, MqxAnalyticsPage } from '../layout/MqxAnalyticsPage';
import { BOND_ANNUAL_RATE_PERCENT, DEPOSIT_ANNUAL_RATE_PERCENT } from '../../../constants/investProducts';

const scenarios = {
  surplus: { label: 'Большая подушка', cash: 42000, reserve: 240000, income: 35000, expenses: 30000, turn: 8 },
  thin: { label: 'Тонкая подушка', cash: 42000, reserve: 15000, income: 35000, expenses: 30000, turn: 8 },
  deficit: { label: 'Дефицит', cash: 24000, reserve: 15000, income: 25000, expenses: 30000, turn: 8 },
  first: { label: 'Первый ход', cash: 42000, reserve: 0, income: 35000, expenses: 30000, turn: 1 },
  overdue: { label: 'Просрочка', cash: 42000, reserve: 240000, income: 35000, expenses: 30000, turn: 8 },
  recurring: { label: 'Расходы выше доходов', cash: 42000, reserve: 15000, income: 25000, expenses: 30000, turn: 8 },
  empty: { label: 'Нет рекомендации', cash: 30000, reserve: 90000, income: 35000, expenses: 30000, turn: 8 },
};

const decisions = [
  { title: 'Фриланс-проект', choice: 'взяться за проект' },
  { title: 'Подержанный автомобиль', choice: 'внести задаток' },
];

const investmentOptions = <>
  Вклад — {DEPOSIT_ANNUAL_RATE_PERCENT}% годовых с капитализацией. Облигации — {BOND_ANNUAL_RATE_PERCENT}% годовых с купоном на счёт каждый ход.
</>;

const recommendations = {
  surplus: [<>Можно вложить <MoneyText value={150000} decimals={0} /></>, <>В подушке останется <MoneyText value={90000} decimals={0} /> — на 3 хода расходов.</>, investmentOptions],
  thin: ['Распредели свободные деньги', <>По <MoneyText value={4000} decimals={0} /> — в подушку, во вклад или облигации, и на счёт для событий.</>, investmentOptions],
  deficit: ['Не хватает на списание', <>До списания не хватает <MoneyText value={6000} decimals={0} />. Эту сумму можно перевести из подушки.</>],
  overdue: ['Есть просрочка', <>По кредиту просрочено <MoneyText value={5000} decimals={0} />. Проверь долг в «Капитале».</>],
  recurring: ['Расходы выше доходов', <>Текущих доходов не хватает на <MoneyText value={5000} decimals={0} /> за ход.</>],
};

function RecommendationPreview({ scenario }) {
  const recommendation = recommendations[scenario === 'first' ? 'thin' : scenario];
  if (!recommendation) return null;
  const [title, message, calculation] = recommendation;
  const tone = calculation ? 'guide' : 'risk';
  return <AnalyticsRecommendation title={title} message={message} details={calculation} tone={tone} />;
}

function ImportantDecisionsPreview() {
  return <section className="mqx-analytics-pocket__decision-panel">
    <h2>Важные решения</h2>
    <dl className="mqx-analytics-pocket__decisions">
      {decisions.map(({ title, choice }) => <div key={title}><dt>{title}</dt><dd>Вы выбрали: {choice}</dd></div>)}
    </dl>
  </section>;
}

export function MqxAnalyticsPreview() {
  const [params] = useSearchParams();
  const review = params.get('revision') === 'an1';
  const [scenario, setScenario] = useState('surplus');
  const [horizon, setHorizon] = useState(3);
  const model = scenarios[scenario];
  const { cash, reserve, income, expenses, turn } = model;
  const history = [3, 2, 1].filter((offset) => offset < turn).map((offset) => ({
    period_index: turn - offset,
    cash_balance: cash - offset * (income - expenses),
    safety_fund_balance: reserve,
  }));

  return (
    <div className="app-shell mqx-menu-preview mqx-capital-pocket-preview mqx-analytics-lab">
      <MqxAnalyticsPage
        {...model}
        an1Layout={review}
        history={history}
        horizon={review ? horizon : 3}
        recommendation={review ? (scenario === 'empty' ? null : <RecommendationPreview scenario={scenario} />) : undefined}
        forecastControls={review && <AnalyticsForecastControls horizon={horizon} onChange={setHorizon} />}
        importantDecisions={review && turn > 1 && scenario !== 'empty' && <ImportantDecisionsPreview />}
      >
        <label className="mqx-analytics-pocket__scenario">
          Сценарий Design Lab
          <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
            {Object.entries(scenarios).filter(([key]) => review || !['overdue', 'recurring', 'empty'].includes(key))
              .map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
          </select>
        </label>
      </MqxAnalyticsPage>
      <BottomGameNav activeTab="analytics" setActiveTab={() => {}} />
    </div>
  );
}
