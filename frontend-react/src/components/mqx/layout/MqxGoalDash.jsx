import { useId, useMemo, useState } from 'react';

import { buildGoalChainView } from '../utils/goalChainDisplay';
import { GoalMonetkaGuidance } from './GoalMonetkaGuidance';

function GoalChevron() {
  return (
    <span className="mqx-icon-chevron mqx-goal-dash__chevron" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M8 10l4 4 4-4"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function GoalChainList({ chain }) {
  if (!chain?.length) return null;

  return (
    <div className="mqx-goal-chain">
      <h4 className="mqx-goal-chain__title">Цепочка сценария</h4>
      <ol className="mqx-goal-chain__list">
        {chain.map((step, index) => (
          <li
            key={step.key}
            className={`mqx-goal-chain__item mqx-goal-chain__item--${step.status}`}
          >
            <span className="mqx-goal-chain__mark" aria-hidden="true">
              {step.status === 'done' ? '✓' : index + 1}
            </span>
            <span>{step.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Раздел «Цель» на дашборде: цепочка шагов, подсказка Монетки (G1). */
export function MqxGoalDash({ victory, legacyGoal, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const expandId = useId();
  const view = useMemo(() => buildGoalChainView(victory, legacyGoal), [victory, legacyGoal]);

  if (view.phase === 'empty') return null;

  return (
    <div className="mqx-goal-dash-bleed">
      <section
        className={`mqx-goal-dash${expanded ? ' mqx-goal-dash--expanded' : ''}`}
        aria-label="Цель сценария"
      >
        <button
          type="button"
          className="mqx-goal-dash__toggle"
          aria-expanded={expanded}
          aria-controls={expandId}
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="mqx-goal-dash__toggle-inner">
            <div className="mqx-goal-dash__head-row">
              <div className="mqx-goal-dash__head-text">
                <span className="mqx-goal-dash__kicker">Цель</span>
                <span className="mqx-goal-dash__current-title">{view.headerTitle}</span>
                {view.stepLabel ? (
                  <span className="mqx-goal-dash__step">{view.stepLabel}</span>
                ) : null}
              </div>
              <GoalChevron />
            </div>
          </div>
        </button>

        {expanded ? (
          <div className="mqx-goal-dash__expand" id={expandId}>
            <article className="mqx-goal-focus">
              <GoalMonetkaGuidance goal={view.currentGoal} view={view} />
              <GoalChainList chain={view.chain} />
            </article>
          </div>
        ) : null}
      </section>
    </div>
  );
}
