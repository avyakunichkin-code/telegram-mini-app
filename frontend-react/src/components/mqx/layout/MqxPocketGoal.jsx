import { useId, useMemo } from 'react';
import { MoneyText } from '../../MoneyText';
import { buildGoalChainView } from '../utils/goalChainDisplay';
import { nextGoalAction } from '../utils/nextGoalAction';
import { goalFinishText, goalStepCaption } from '../utils/boardDashDisplay';
import { MqxProgress } from '../primitives/MqxProgress';
import { MqxGoalNextStep } from './MqxGoalNextStep';

/** Compact route from approved Pocket A; all thresholds and titles remain native. */
export function MqxPocketGoal({ victory, legacyGoal, cash, outflow, onContribute, busy }) {
  const id = useId();
  const view = useMemo(() => buildGoalChainView(victory, legacyGoal), [victory, legacyGoal]);
  const action = nextGoalAction(view.currentGoal, cash, outflow);
  if (view.phase === 'empty') return null;
  return <section className="mqx-pocket-goal" aria-labelledby={id} data-onboarding-anchor="goal">
    <header><span>Маршрут партии</span><small>{goalStepCaption(view)}</small></header>
    <div className="mqx-pocket-route" aria-label={view.stepAriaLabel}>
      {view.chain.map((step, index) => <span key={step.key} data-status={step.status} title={step.title} aria-hidden="true">
        {step.status === 'done' ? '✓' : index + 1}
      </span>)}<span className="mqx-pocket-route__finish" aria-hidden="true">⚑</span>
    </div>
    <h2 id={id}>{view.headerTitle}</h2>
    {action ? <>
      <div className="mqx-pocket-goal__amount"><strong><MoneyText value={action.current} decimals={0} /></strong><span>из <MoneyText value={action.target} decimals={0} /></span></div>
      <MqxProgress value={Math.min(100, Math.max(0, action.current / action.target * 100))} aria-label="Прогресс текущей цели" />
      <p className="mqx-pocket-goal__remaining">До цели — <MoneyText value={action.remaining} decimals={0} />{action.kind === 'income' ? ' дохода за ход' : ''}</p>
      {action.kind === 'safety' && onContribute && <button type="button" className="mqx-bg-btn mqx-pocket-goal__action" disabled={busy || action.amount <= 0} onClick={() => onContribute(action.amount)}>Пополнить подушку <span aria-hidden="true">↗</span></button>}
    </> : view.phase !== 'active' ? <p>{goalFinishText(view)}</p> : null}
    <details className="mqx-pocket-goal__details"><summary>Все шаги и подробности</summary>
      <ol>{view.chain.map(step => <li key={step.key} data-status={step.status}>{step.title}{step.status === 'done' ? ' · выполнено' : step.status === 'current' ? ' · текущий' : ''}</li>)}</ol>
      {action && <MqxGoalNextStep goal={view.currentGoal} cash={cash} outflow={outflow} busy={busy} />}
      <p>{goalFinishText(view)}</p>
    </details>
  </section>;
}
