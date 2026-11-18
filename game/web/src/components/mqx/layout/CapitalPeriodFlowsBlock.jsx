import { useMemo, useState } from 'react';
import { MoneyText } from '../../MoneyText';
import { buildCapitalPeriodFlows } from '../../../utils/buildCapitalPeriodFlows';
import { formatLotRub } from './CapitalLotNotes';

const PANEL_ID = 'capital-flows-breakdown';

function FlowLines({ article }) {
  if (!article?.items?.length) return null;

  return (
    <div className="mqx-cap-flow-lines">
      {article.items.map((item) => {
        if (article.byType && Array.isArray(item.items)) {
          return (
            <div key={item.key || item.label} className="mqx-cap-flow-group">
              <div className="mqx-cap-flow-line mqx-cap-flow-line--type">
                <span>{item.label}</span>
                <MoneyText value={item.amount} decimals={0} />
              </div>
              {item.items.map((sub) => (
                <div key={sub.id || sub.title} className="mqx-cap-flow-line">
                  <span>{sub.title}</span>
                  <MoneyText value={sub.amount} decimals={0} />
                </div>
              ))}
            </div>
          );
        }

        return (
          <div key={item.id || item.title || item.label} className="mqx-cap-flow-line">
            <span>{item.title || item.label}</span>
            <MoneyText value={item.amount} decimals={0} />
          </div>
        );
      })}
    </div>
  );
}

function FlowBreakdown({ side, emptyText }) {
  const articles = side?.articles || [];
  if (articles.length === 0) return <p className="mqx-cap-flows__empty">{emptyText}</p>;
  return articles.map((article) => (
    <div key={article.key} className="mqx-cap-flow-cat">
      <div className="mqx-cap-flow-cat__row">
        <span>{article.label}</span>
        <MoneyText value={article.amount} decimals={0} />
      </div>
      <FlowLines article={article} />
    </div>
  ));
}

/**
 * Потоки хода ★ BG-2: «Доходы за ход» / «Расходы за ход» (нажатие раскрывает статьи)
 * и итог «Остаётся после хода» (showNet — в режиме «Детали»).
 * @param {{ overview: object, investPositions?: object[], policies?: object[], openFlowsSection?: 'income'|'expense'|null, showNet?: boolean }} props
 */
export function CapitalPeriodFlowsBlock({
  overview,
  investPositions = [],
  policies = [],
  openFlowsSection = null,
  showNet = true,
}) {
  const flows = useMemo(
    () => buildCapitalPeriodFlows({ overview, investPositions, policies }),
    [overview, investPositions, policies],
  );
  const [expanded, setExpanded] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  // Запрос с дашборда («Доходы» / «Расходы») раскрывает нужную сторону — без эффекта.
  if (openFlowsSection !== lastRequest) {
    setLastRequest(openFlowsSection);
    if (openFlowsSection === 'income' || openFlowsSection === 'expense') setExpanded(openFlowsSection);
  }

  if (!overview) return null;

  const income = Number(flows.income?.total) || 0;
  const expense = Number(flows.expense?.total) || 0;
  const net = income - expense;
  const toggle = (side) => setExpanded((cur) => (cur === side ? null : side));

  return (
    <div className="mqx-cap-flows">
      <button
        type="button"
        id="capital-flows-income"
        className={`mqx-bg-btn mqx-cap-flow${expanded === 'income' ? ' is-open' : ''}`}
        aria-expanded={expanded === 'income'}
        aria-controls={PANEL_ID}
        onClick={() => toggle('income')}
      >
        <span className="mqx-cap-flow__label">Доходы за ход</span>
        <b className="mqx-cap-flow__value mqx-cap-flow__value--gain">{formatLotRub(income, '+')}</b>
      </button>
      <button
        type="button"
        id="capital-flows-expense"
        className={`mqx-bg-btn mqx-cap-flow${expanded === 'expense' ? ' is-open' : ''}`}
        aria-expanded={expanded === 'expense'}
        aria-controls={PANEL_ID}
        onClick={() => toggle('expense')}
      >
        <span className="mqx-cap-flow__label">Расходы за ход</span>
        <b className="mqx-cap-flow__value">{formatLotRub(expense, '−')}</b>
      </button>

      {expanded ? (
        <div id={PANEL_ID} className="mqx-cap-flows__breakdown" role="region" aria-label={expanded === 'income' ? 'Доходы за ход' : 'Расходы за ход'}>
          {expanded === 'income' ? (
            <FlowBreakdown side={flows.income} emptyText="Доходов за ход пока нет." />
          ) : (
            <FlowBreakdown side={flows.expense} emptyText="Расходов за ход нет." />
          )}
        </div>
      ) : null}

      {showNet ? (
        <div className={`mqx-cap-net mqx-cap-net--${net < 0 ? 'risk' : 'gain'}`}>
          <span>{net < 0 ? 'Не хватает за ход' : 'Остаётся после хода'}</span>
          <b>{formatLotRub(net, net < 0 ? '−' : '+')}</b>
        </div>
      ) : null}
    </div>
  );
}
