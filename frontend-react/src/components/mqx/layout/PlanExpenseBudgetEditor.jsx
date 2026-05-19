import { useMemo } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { MoneyText } from '../../MoneyText';
import { sanitizeIntInput, parseNumLoose } from '../../../utils/numberFields';
import {
  PLAN_EXPENSE_CATEGORIES,
  defaultPlanExpenseBudget,
  sumExpenseBudget,
} from '../../../utils/planExpenseBudget';

/**
 * Локальный редактор бюджета Plan (мастер старта): category_key → сумма / мес.
 */
export function PlanExpenseBudgetEditor({ budget, onChange, monthlySalary = 0 }) {
  const total = useMemo(() => sumExpenseBudget(budget), [budget]);
  const salary = Number(monthlySalary) || 0;

  const handleSuggest = () => {
    if (salary <= 0) return;
    onChange(defaultPlanExpenseBudget(salary));
  };

  const setAmount = (key, raw) => {
    const val = parseNumLoose(sanitizeIntInput(raw), 0);
    onChange({ ...budget, [key]: val });
  };

  return (
    <div className="mqx-plan-expense-editor">
      <div className="mqx-plan-expense-editor__head">
        <p className="mqx-plan-expense-editor__hint">
          Статьи списываются в конце каждого периода. Позже можно изменить в «Финансах».
        </p>
        <div className="mqx-plan-expense-editor__total">
          <span className="mqx-plan-expense-editor__total-label">Итого / мес</span>
          <span className="mqx-plan-expense-editor__total-value">
            <MoneyText value={total} decimals={0} />
          </span>
        </div>
      </div>

      {salary > 0 ? (
        <Button type="button" mode="outline" size="s" stretched onClick={handleSuggest}>
          Подставить ~55% от зарплаты
        </Button>
      ) : null}

      <ul className="mqx-plan-expense-editor__list">
        {PLAN_EXPENSE_CATEGORIES.map((cat) => (
          <li key={cat.category_key} className="mqx-plan-expense-editor__row">
            <label className="mq-field mqx-plan-expense-editor__field">
              <span className="mq-field__label">{cat.title}</span>
              <input
                className="mq-field__input"
                inputMode="numeric"
                placeholder="0"
                value={budget[cat.category_key] > 0 ? String(budget[cat.category_key]) : ''}
                onChange={(e) => setAmount(cat.category_key, e.target.value)}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
