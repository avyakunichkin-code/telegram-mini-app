import { MoneyText } from '../../MoneyText';
import { nextGoalAction } from '../utils/nextGoalAction';
import { MqxProgress } from '../primitives/MqxProgress';

export function MqxGoalNextStep({ goal, cash, outflow, onContribute, busy }) {
  const action = nextGoalAction(goal, cash, outflow);
  if (!action) return null;
  return <div className="mqx-next-step" data-testid="goal-next-step">
    <h3>{goal.title}</h3><span>Осталось {action.kind === 'income' ? 'дохода в месяц' : 'накопить'}</span>
    <strong className="mqx-next-step__amount"><MoneyText value={action.remaining} decimals={0} /></strong>
    <MqxProgress value={Math.min(100, Math.max(0, action.current / action.target * 100))} aria-label="Прогресс текущей цели" />
    <p><MoneyText value={action.current} decimals={0} /> из <MoneyText value={action.target} decimals={0} /></p>
    {action.kind === 'safety' && <>
      {action.amount > 0 ? <div className="mqx-next-step__suggestion"><strong>Ближайший шаг · внести <MoneyText value={action.amount} decimals={0} /></strong><p>На счёте останется <MoneyText value={action.after} decimals={0} /> — на текущие расходы. До цели после перевода: ещё <MoneyText value={Math.max(0, action.remaining - action.amount)} decimals={0} />.</p></div> : <p>Сейчас свободных денег после расходов нет. Можно получить зарплату, если она доступна, или вернуться к цели позже.</p>}
      {onContribute && <button type="button" className="mqx-bg-btn mqx-bg-cta mqx-next-step__button" disabled={busy || action.amount <= 0} onClick={() => onContribute(action.amount)}>Пополнить подушку</button>}
      <details><summary>Почему цель именно такая</summary><p>Подушка должна покрыть текущие расходы заданное число ходов. При изменении расходов изменится цель. Предложенная сумма оставляет деньги на текущее закрытие, но не резервирует будущие события.</p><p>Подушка — отдельный кошелёк, расходы не списываются из неё автоматически. Сумму можно изменить в окне перевода.</p></details>
    </>}
    {action.kind === 'income' && <p>Доход от вложений приближает к цели. Доступные продукты и их условия — в «Капитале».</p>}
  </div>;
}
