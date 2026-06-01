import { MoneyText } from '../../MoneyText';
import { MqxProgress } from '../primitives/MqxProgress';
import { goalProgressHintText, goalStatusLabel, pctClamp01 } from '../utils/victoryGoalDisplay';

function GoalProgressHint({ goal }) {
  const hint = goalProgressHintText(goal);
  if (typeof hint === 'string') return hint;
  if (hint?.kind === 'money_pair') {
    return (
      <>
        <MoneyText value={hint.current} decimals={0} />
        {' '}
        / <MoneyText value={hint.target} decimals={0} />
      </>
    );
  }
  if (hint?.kind === 'avg_threshold') {
    return (
      <>
        {hint.avg}
        {' '}
        / {hint.threshold}
        {hint.samples > 0 ? ` · ${hint.samples} пер.` : ''}
      </>
    );
  }
  return '—';
}

/** Одна цель победы: прогресс + подпись. */
export function VictoryGoalItem({ goal }) {
  const frac = pctClamp01(goal.progress);
  const met = !!goal.met;

  return (
    <li className={`mqx-victory-goals__item${met ? ' mqx-victory-goals__item--met' : ''}`}>
      <div className="mqx-goal__row">
        <span className="mqx-victory-goals__title">{goal.title}</span>
        <span className="mqx-victory-goals__status">{goalStatusLabel(goal)}</span>
      </div>
      <MqxProgress
        value={Math.round(frac * 100)}
        aria-label={goal.title}
        className={met ? 'mqx-progress--done' : undefined}
      />
      <div className="mqx-goal__row mqx-victory-goals__hint">
        <span>{goal.available === false && goal.blocked_reason ? 'Откроется' : 'Прогресс'}</span>
        <span>
          {goal.available === false && goal.blocked_reason ? (
            goal.blocked_reason
          ) : (
            <GoalProgressHint goal={goal} />
          )}
        </span>
      </div>
    </li>
  );
}
