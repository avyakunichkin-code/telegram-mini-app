import { Modal, Button } from '@telegram-apps/telegram-ui';
import { MoneyText } from './MoneyText';

function breakdownLabel(item) {
  if (item.type === 'expense_category') return item.title;
  return item.title || item.type;
}

function buildXpLines(summary) {
  const lines = [];
  const periodXp = Number(summary.xp_period_close) || 0;
  const milestoneXp = Number(summary.xp_milestone) || 0;
  const achievementXp = Number(summary.xp_from_achievements) || 0;

  if (periodXp > 0) {
    lines.push({ key: 'period', label: 'За месяц', xp: periodXp });
  }
  if (milestoneXp > 0) {
    lines.push({
      key: 'milestone',
      label: summary.milestone_title || 'Веха пути',
      xp: milestoneXp,
    });
  }
  if (achievementXp > 0) {
    lines.push({ key: 'achievements', label: 'Достижения', xp: achievementXp });
  }

  if (lines.length === 0 && Number(summary.xp_earned) > 0) {
    lines.push({ key: 'total', label: 'Опыт', xp: Number(summary.xp_earned) });
  }

  return lines;
}

export function PeriodCloseModal({ summary, onClose }) {
  if (!summary) return null;

  const expenseRows = (summary.breakdown || []).filter(
    (row) => row.type === 'expense_category' || row.type === 'lifestyle',
  );
  const otherRows = (summary.breakdown || []).filter(
    (row) => row.type !== 'expense_category' && row.type !== 'lifestyle',
  );

  const xpLines = buildXpLines(summary);
  const achievements = Array.isArray(summary.achievement_unlocks) ? summary.achievement_unlocks : [];
  const totalXp = Number(summary.xp_earned) || 0;

  return (
    <Modal open onClose={onClose} title="Итог месяца">
      <div className="mqx-modal" role="document" aria-labelledby="mqx-period-close-title">
        <div className="mqx-card mqx-period-close">
          <div className="mqx-card__kicker mqx-card__kicker--violet">Период закрыт</div>
          <h2 id="mqx-period-close-title" className="mqx-period-close__title">
            Итог месяца
          </h2>
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

          {totalXp > 0 ? (
            <section className="mqx-period-close__section mqx-period-close__section--xp" aria-label="Опыт за период">
              <h3 className="mqx-period-close__section-title">Прогресс</h3>
              {xpLines.length > 0 ? (
                <ul className="mqx-period-close__xp-lines">
                  {xpLines.map((line) => (
                    <li key={line.key} className="mqx-period-close__xp-line">
                      <span>{line.label}</span>
                      <span className="mqx-period-close__xp-val">+{line.xp} XP</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mqx-period-close__xp-total">
                Всего +{totalXp} XP
                {summary.level_up && summary.new_level
                  ? ` · Уровень ${summary.new_level}`
                  : ''}
              </p>
            </section>
          ) : null}

          {achievements.length > 0 ? (
            <section className="mqx-period-close__section" aria-label="Новые достижения">
              <h3 className="mqx-period-close__section-title">Достижения</h3>
              <ul className="mqx-period-close__achievements">
                {achievements.map((item) => (
                  <li
                    key={`${item.chain_key}-${item.tier_key}`}
                    className="mqx-period-close__achievement"
                  >
                    <span className="mqx-period-close__achievement-title">{item.title}</span>
                    <span className="mqx-period-close__achievement-xp">+{item.xp_reward} XP</span>
                  </li>
                ))}
              </ul>
            </section>
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
