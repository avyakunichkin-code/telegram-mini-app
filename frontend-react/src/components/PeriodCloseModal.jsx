import { Modal, Button } from '@telegram-apps/telegram-ui';
import { MoneyText } from './MoneyText';

function breakdownLabel(item) {
  if (item.type === 'expense_category') return item.title;
  return item.title || item.type;
}

export function PeriodCloseModal({ summary, onClose }) {
  if (!summary) return null;

  const expenseRows = (summary.breakdown || []).filter(
    (row) => row.type === 'expense_category' || row.type === 'lifestyle',
  );
  const otherRows = (summary.breakdown || []).filter(
    (row) => row.type !== 'expense_category' && row.type !== 'lifestyle',
  );

  return (
    <Modal open onClose={onClose}>
      <div className="mqx-modal">
        <div className="mqx-card mqx-period-close">
          <div className="mqx-card__kicker mqx-card__kicker--violet">Период закрыт</div>
          <h2 className="mqx-period-close__title">Итог месяца</h2>
          <p className="mqx-period-close__lead">
            Списано: <MoneyText value={summary.total_spent} decimals={0} /> · Баланс:{' '}
            <MoneyText value={summary.new_balance} decimals={0} />
          </p>

          {expenseRows.length > 0 ? (
            <section className="mqx-period-close__section">
              <h3 className="mqx-period-close__section-title">Расходы на жизнь</h3>
              <ul className="mqx-period-close__list">
                {expenseRows.map((row, idx) => (
                  <li key={`${row.type}-${row.title}-${idx}`} className="mqx-period-close__row">
                    <span>{breakdownLabel(row)}</span>
                    <span>
                      <MoneyText value={row.amount} decimals={0} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {otherRows.length > 0 ? (
            <section className="mqx-period-close__section">
              <h3 className="mqx-period-close__section-title">Прочие операции</h3>
              <ul className="mqx-period-close__list">
                {otherRows.slice(0, 8).map((row, idx) => (
                  <li key={`${row.type}-${row.title}-${idx}`} className="mqx-period-close__row">
                    <span>{breakdownLabel(row)}</span>
                    <span>
                      <MoneyText value={row.amount} decimals={0} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {summary.xp_earned > 0 ? (
            <p className="mqx-period-close__xp">
              +{summary.xp_earned} XP
              {summary.level_up && summary.new_level ? ` · Уровень ${summary.new_level}` : ''}
            </p>
          ) : null}

          <div className="mq-modal-actions" style={{ marginTop: 16 }}>
            <Button mode="filled" stretched onClick={onClose}>
              Понятно
            </Button>
          </div>
        </div>
        </div>
    </Modal>
  );
}
