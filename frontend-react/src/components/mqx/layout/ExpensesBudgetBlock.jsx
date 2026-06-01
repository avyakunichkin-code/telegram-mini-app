import { useMemo, useState } from 'react';
import { MoneyText } from '../../MoneyText';
import {
  formatExpenseRatio,
  getExpenseLines,
  getMonthlyBurn,
  getTopExpenseCategories,
} from '../../../utils/expensesDisplay';

/**
 * Блок «Расходы на жизнеобеспечение»: итог + топ категорий (+ разворот всех статей).
 */
export function ExpensesBudgetBlock({
  overview,
  topLimit = 5,
  showOutflow = true,
  defaultExpanded = false,
  embedded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const burn = getMonthlyBurn(overview);
  const topCategories = useMemo(() => getTopExpenseCategories(overview, topLimit), [overview, topLimit]);
  const allLines = useMemo(() => getExpenseLines(overview), [overview]);
  const income = Number(overview?.total_monthly_income) || 0;
  const outflow = Number(overview?.total_monthly_outflow) || 0;
  const expenseRatio = Number(overview?.expense_to_income_ratio);
  const maxCat = topCategories.reduce((m, c) => Math.max(m, Number(c.amount) || 0), 0);

  const wrapperClass = embedded
    ? 'mqx-expenses-budget mqx-expenses-budget--embedded'
    : 'mqx-card mqx-expenses-budget';

  if (burn <= 0 && topCategories.length === 0) {
    return (
      <div className={wrapperClass} aria-label="Расходы на жизнь">
        {!embedded ? <div className="mqx-card__kicker mqx-card__kicker--amber">Жизнеобеспечение</div> : null}
        {!embedded ? <h2 className="mqx-expenses-budget__title">Расходы на жизнь</h2> : null}
        <p className="mqx-expenses-budget__empty">Статьи бюджета появятся после старта игры из шаблона.</p>
      </div>
    );
  }

  const showExpand = allLines.length > topCategories.length;

  return (
    <div className={wrapperClass} aria-label="Расходы на жизнь">
      <div className="mqx-expenses-budget__head">
        <div>
          {!embedded ? <div className="mqx-card__kicker mqx-card__kicker--amber">Жизнеобеспечение</div> : null}
          {!embedded ? <h2 className="mqx-expenses-budget__title">Расходы на жизнь</h2> : null}
          <p className="mqx-expenses-budget__sub">
            Списываются в конце периода
            {income > 0 ? (
              <>
                {' '}
                · {formatExpenseRatio(expenseRatio)} от дохода
              </>
            ) : null}
          </p>
        </div>
        <div className="mqx-expenses-budget__total">
          <div className="mqx-expenses-budget__total-label">В месяц</div>
          <div className="mqx-expenses-budget__total-value">
            <MoneyText value={burn} decimals={0} />
          </div>
        </div>
      </div>

      {showOutflow && outflow > burn ? (
        <p className="mqx-expenses-budget__outflow" role="note">
          Всего уйдёт за период (долги + жизнь): <MoneyText value={outflow} decimals={0} />
        </p>
      ) : null}

      {topCategories.length > 0 ? (
        <ul className="mqx-expenses-budget__list">
          {topCategories.map((cat) => {
            const amt = Number(cat.amount) || 0;
            const frac = maxCat > 0 ? amt / maxCat : 0;
            return (
              <li key={cat.category_key} className="mqx-expenses-budget__row">
                <div className="mqx-expenses-budget__row-top">
                  <span className="mqx-expenses-budget__row-title">{cat.title}</span>
                  <span className="mqx-expenses-budget__row-amount">
                    <MoneyText value={amt} decimals={0} />
                  </span>
                </div>
                <div className="mqx-expenses-budget__track" aria-hidden>
                  <div
                    className="mqx-expenses-budget__fill"
                    style={{ width: `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showExpand ? (
        <>
          <button
            type="button"
            className="mqx-expenses-budget__toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Свернуть статьи' : `Все статьи (${allLines.length})`}
          </button>
          {expanded ? (
            <ul className="mqx-expenses-budget__lines">
              {allLines.map((line) => (
                <li key={line.id} className="mqx-expenses-budget__line">
                  <span className="mqx-expenses-budget__line-title">{line.title}</span>
                  <span className="mqx-expenses-budget__line-meta">{line.category_title}</span>
                  <span className="mqx-expenses-budget__line-amount">
                    <MoneyText value={line.amount} decimals={0} />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
