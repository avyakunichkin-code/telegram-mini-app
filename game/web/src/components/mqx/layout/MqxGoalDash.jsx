import { useId, useMemo, useState } from 'react';

import { buildGoalChainView } from '../utils/goalChainDisplay';
import { goalFinishText, goalStepCaption } from '../utils/boardDashDisplay';

function Coin({ className = '' }) {
  return (
    <span className={['mqx-bg-coin', className].filter(Boolean).join(' ')} aria-hidden="true">
      ₽
    </span>
  );
}

/** Свёрнутая дорожка: точки шагов без подписей + золотой финиш. */
function GoalTrack({ chain, phase }) {
  return (
    <span className="mqx-bg-track" aria-hidden="true">
      {chain.map((step) => (
        <i key={step.key} className="mqx-bg-track__dot" data-status={step.status} />
      ))}
      <span className={`mqx-bg-track__finish${phase === 'win' ? ' is-won' : ''}`}>
        <Coin className="mqx-bg-coin--sm" />
      </span>
    </span>
  );
}

function GoalChain({ chain, view }) {
  return (
    <ol className="mqx-bg-chain">
      {chain.map((step, index) => (
        <li key={step.key} className="mqx-bg-chain__item" data-status={step.status}>
          <span className="mqx-bg-chain__dot" aria-hidden="true">
            {step.status === 'done' ? '✓' : index + 1}
          </span>
          <span className="mqx-bg-chain__text">
            {step.title}
            <span className="mqx-bg-sr-only">
              {step.status === 'done' ? ', выполнено' : step.status === 'current' ? ', текущий шаг' : ''}
            </span>
          </span>
        </li>
      ))}
      <li className="mqx-bg-chain__item mqx-bg-chain__item--finish" data-status={view.phase === 'win' ? 'done' : 'finish'}>
        <span className="mqx-bg-chain__dot" aria-hidden="true">
          <Coin className="mqx-bg-coin--sm" />
        </span>
        <span className="mqx-bg-chain__text">{goalFinishText(view)}</span>
      </li>
    </ol>
  );
}

/**
 * Цель ★ BG-1: свёрнута — «Цель, шаг N из M» + дорожка точек + золотой финиш;
 * раскрыта — список шагов цепочки победы (victory_config_json), без Монетки.
 */
export function MqxGoalDash({ victory, legacyGoal, defaultExpanded = false }) {
  const bodyId = useId();
  const view = useMemo(() => buildGoalChainView(victory, legacyGoal), [victory, legacyGoal]);
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (view.phase === 'empty') return null;

  return (
    <section
      className={['mqx-bg-goal', expanded && 'mqx-bg-goal--open'].filter(Boolean).join(' ')}
      aria-labelledby={`${bodyId}-title`}
      data-onboarding-anchor="goal"
    >
      <h2 id={`${bodyId}-title`} className="mqx-bg-sr-only">
        Цель
      </h2>
      <button
        type="button"
        className="mqx-bg-btn mqx-bg-goal__toggle"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="mqx-bg-goal__label">
          <span className="mqx-bg-goal__title">
            Цель
          </span>
          <small className="mqx-bg-goal__step">{goalStepCaption(view)}</small>
        </span>
        <GoalTrack chain={view.chain} phase={view.phase} />
        <span className="mqx-bg-goal__chev" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="mqx-bg-sr-only">{view.stepAriaLabel}</span>
      </button>

      {expanded ? (
        <div className="mqx-bg-goal__body" id={bodyId}>
          <GoalChain chain={view.chain} view={view} />
        </div>
      ) : null}
    </section>
  );
}
