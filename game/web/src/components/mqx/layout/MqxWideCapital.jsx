import { FlowBreakdown } from './CapitalPeriodFlowsBlock';
import { useState } from 'react';
import { DEPOSIT_ANNUAL_RATE_PERCENT, investMonthlyAccrual } from '../../../constants/investProducts';
import { MqxButton } from '../primitives/MqxButton';
import { MqxCapitalSheet } from './MqxCapitalSheet';
import './capital-wide.css';

const depositIncome = investMonthlyAccrual(80000, DEPOSIT_ANNUAL_RATE_PERCENT);

const actions = [
  ['deposit', 'Депозит', 'invest'], ['bond', 'Облигации', 'invest'],
  ['credit', 'Кредиты', 'liabilities'], ['mortgage', 'Ипотека', 'mortgage'],
  ['realestate', 'Недвижимость', 'property'], ['car', 'Авто', 'car'],
];
const incomes = [[11, 'Зарплата', 60000], [12, 'Проценты по депозиту', depositIncome], [1, 'Купон по облигациям', 1600], [4, 'Аренда', 8000]];
const expenses = [[3, 'Жильё', 25000], [13, 'Повседневные расходы', 7500], [14, 'Платёж по ипотеке', 10000], [4, 'Содержание квартиры', 2000], [15, 'Страховой взнос', 500]];
const portfolio = [
  ['Вложения', [[0, 'Депозит', 80000, `${DEPOSIT_ANNUAL_RATE_PERCENT}% годовых · +${new Intl.NumberFormat('ru-RU').format(depositIncome)} ₽ за ход`], [1, 'Облигации', 120000, '16% годовых · +1 600 ₽ за ход']]],
  ['Имущество', [[4, 'Квартира', 900000, 'Аренда +8 000 ₽ · содержание −2 000 ₽ за ход']]],
  ['Долги', [[3, 'Ипотека', 500000, '12% годовых · платёж 10 000 ₽ за ход', 'Осталось 70 ходов · залог: квартира']]],
  ['Страховки', [[15, 'Полис жилья', 300000, 'Взнос 500 ₽ за ход · до хода 12']]],
];
const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
const total = (rows) => rows.reduce((sum, [, , amount]) => sum + amount, 0);

function Icon({ index }) {
  return <span aria-hidden="true" className="lab-capital__icon"
    style={{ backgroundPosition: [4, 34, 64, 94][index % 4] + '% ' + [4, 34, 64, 94][Math.floor(index / 4)] + '%' }} />;
}

function Rows({ rows, coverage }) {
  return <ul className="lab-capital__rows">{rows.map(([icon, label, amount, note, extra]) => (
    <li key={label}><Icon index={icon} /><div><strong>{label}</strong>
      {note && <small>{note}</small>}{extra && <small>{extra}</small>}
    </div><b>{coverage && 'Покрытие '}{money.format(amount)}</b></li>
  ))}</ul>;
}

export function MqxWideCapital({ flows, sections, onOpenAction, details, sheets, flowsSection, netCapital }) {
  const [action, setAction] = useState(null);
  const income = flows ? flows.income.total : total(incomes);
  const expense = flows ? flows.expense.total : total(expenses);
  return <main className="lab-capital">
    <section className="mqx-wide__panel lab-capital__panel">
      <h1>Капитал</h1>
      <div className="lab-capital__summary">
        {[[6, 'Доход за ход', income], [7, 'Расходы за ход', expense], [8, 'Остаётся', income - expense]].map(([icon, label, value]) => (
          <div key={label}><Icon index={icon} /><span>{label}<strong>{money.format(value)}</strong></span></div>
        ))}
      </div>
      <h2 className="lab-capital__band">Действия</h2>
      <div className="lab-capital__actions">
        {actions.map(([id, title, section], index) => (!sections || sections[section] !== 'hidden') && <MqxButton key={id} variant="hero-outline" disabled={sections?.[section] === 'locked'} onClick={() => onOpenAction ? onOpenAction(id) : setAction(index)}>
          <Icon index={index} /><span>{title}{sections?.[section] === 'locked' && <small>Откроется по цели</small>}</span>
        </MqxButton>)}
      </div>
      <div className="lab-capital__breakdown">
        <section tabIndex={flowsSection === 'income' ? 0 : undefined}><h2 className="lab-capital__band"><Icon index={9} />Доходы за ход</h2>{flows ? <FlowBreakdown side={flows.income} emptyText="Доходов за ход пока нет." /> : <Rows rows={incomes} />}</section>
        <section tabIndex={flowsSection === 'expense' ? 0 : undefined}><h2 className="lab-capital__band"><Icon index={10} />Расходы за ход</h2>{flows ? <FlowBreakdown side={flows.expense} emptyText="Расходов за ход нет." /> : <Rows rows={expenses} />}</section>
      </div>
    </section>
    <section className="mqx-wide__panel lab-capital__panel">
      <h2 className="lab-capital__title">Портфель</h2>
      {details ?? portfolio.map(([group, rows], index) => <section key={group}>
        <h3 className="lab-capital__band">{group}</h3>
        <Rows rows={rows} coverage={index === 3} />
      </section>)}
      <div className="lab-capital__net"><Icon index={6} /><strong>Чистый капитал</strong><b>{money.format(flows ? netCapital : total(portfolio[0][1]) + total(portfolio[1][1]) - total(portfolio[2][1]))}</b></div>
    </section>
    {sheets}
    <MqxCapitalSheet open={action !== null} title={actions[action]?.[1]} onClose={() => setAction(null)}>
      <p>Пример раздела в Design Lab.</p>

    </MqxCapitalSheet>
  </main>;
}
