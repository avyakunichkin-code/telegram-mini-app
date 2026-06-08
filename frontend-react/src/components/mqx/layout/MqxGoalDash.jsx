import { useId, useMemo, useState } from 'react';

import { victoryFromTurn, waitForTurn } from '../../../constants/turnCopy';
import { buildGoalChainView } from '../utils/goalChainDisplay';
import { buildGoalActionHint } from '../utils/goalGuidanceCopy';
import { pctClamp01 } from '../utils/victoryGoalDisplay';
import { GoalMonetkaGuidance } from './GoalMonetkaGuidance';
import { MqxGoalPathStepper } from './MqxGoalPathStepper';
import { MqxProgress } from '../primitives/MqxProgress';

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

function goalStepBadge(view) {
  if (view.total <= 0) return null;
  const done = view.chain.filter((s) => s.status === 'done').length;
  if (view.phase === 'win') return `Победа · ${view.total}/${view.total}`;
  if (view.phase === 'gate') return waitForTurn(view.minPeriod);
  const current = view.currentIndex >= 0 ? view.currentIndex + 1 : 1;
  return `Шаг ${current}/${view.total}${done > 0 ? ` · ${done} готово` : ''}`;
}

function GoalDashHead({ view, showStepper, actionHint, stepBadge }) {
  const progressFrac =
    view.currentGoal && view.phase === 'active'
      ? pctClamp01(view.currentGoal.progress)
      : view.phase === 'win'
        ? 1
        : 0;

  return (
    <div className="mqx-goal-dash__head-text">
      <div className="mqx-goal-dash__kicker-row">
        <h2 className="mqx-finance-static__title mqx-goal-dash__title">Цель сценария</h2>
        {stepBadge ? <span className="mqx-goal-dash__step-chip">{stepBadge}</span> : null}
      </div>
      <span className="mqx-goal-dash__current-title">{view.headerTitle}</span>
      {view.phase === 'gate' && view.minPeriod ? (
        <span className="mqx-goal-dash__gate-hint">{victoryFromTurn(view.minPeriod)}</span>
      ) : null}
      {actionHint && view.phase === 'active' ? (
        <p className="mqx-goal-dash__action-hint">{actionHint}</p>
      ) : null}
      {view.phase === 'active' && view.currentGoal && !view.currentGoal.met ? (
        <MqxProgress
          value={Math.round(progressFrac * 100)}
          aria-label={`Прогресс: ${view.headerTitle}`}
          className="mqx-goal-dash__progress"
        />
      ) : null}
      {showStepper ? (
        <div className="mqx-goal-dash__path-row">
          <MqxGoalPathStepper
            chain={view.chain}
            phase={view.phase}
            dense={view.total > 5}
            ariaLabel={view.stepAriaLabel}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Раздел «Цель» на дашборде: тропа шагов + подсказка Монетки (G1). */
export function MqxGoalDash({
  victory,
  legacyGoal,
  periodIndex = 0,
  defaultExpanded = false,
}) {
  const expandId = useId();
  const view = useMemo(() => buildGoalChainView(victory, legacyGoal), [victory, legacyGoal]);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const showStepper = view.chain.length > 0;
  const actionHint = useMemo(
    () => buildGoalActionHint(view.currentGoal, view),
    [view.currentGoal, view],
  );
  const stepBadge = useMemo(() => goalStepBadge(view), [view]);

  if (view.phase === 'empty') return null;

  return (
    <div className="mqx-goal-dash-bleed">
      <section
        className={`mqx-goal-dash mqx-goal-dash--path-compact${expanded ? ' mqx-goal-dash--expanded' : ''}`}
        aria-label="Цель сценария"
        data-onboarding-anchor="goal"
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
              <GoalDashHead
                view={view}
                showStepper={showStepper}
                actionHint={actionHint}
                stepBadge={stepBadge}
              />
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
