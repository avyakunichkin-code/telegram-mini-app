import { useId, useMemo, useState } from 'react';

import { goalsAggregateFrac, goalsAggregateLabel } from '../utils/victoryGoalDisplay';

import { MqxProgress } from '../primitives/MqxProgress';

import { VictoryGoalsPanel } from './VictoryGoalsPanel';

function LevelChevron() {
  return (
    <span className="mqx-icon-chevron mqx-level-dash__chevron" aria-hidden>
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

/** Блок целей победы на главной: аккордеон с прогрессом M из N. */
export function MqxLevelDash({
  periodIndex,
  victory,
  legacyGoal,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const expandId = useId();
  const goalsLabel = useMemo(
    () => goalsAggregateLabel(victory, legacyGoal),
    [victory, legacyGoal],
  );
  const goalsFrac = useMemo(
    () => goalsAggregateFrac(victory, legacyGoal),
    [victory, legacyGoal],
  );
  const period = Math.max(1, Number(periodIndex) || 1);

  return (
    <div className="mqx-level-dash-bleed">
      <section
        className={`mqx-level-dash${expanded ? ' mqx-level-dash--expanded' : ''}`}
        aria-label={`Период ${period}`}
      >
        <button
          type="button"
          className="mqx-level-dash__toggle"
          aria-expanded={expanded}
          aria-controls={expandId}
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="mqx-level-dash__toggle-inner">
            <div className="mqx-level-dash__head-row">
              <span className="mqx-level-dash__title">Период {period}</span>
              <LevelChevron />
            </div>
            {goalsLabel ? (
              <div className="mqx-level-dash__goals-agg mqx-level-dash__xp-pinned">
                <span className="mqx-level-dash__goals-agg-label">{goalsLabel.line}</span>
                <MqxProgress
                  value={Math.round(goalsFrac * 100)}
                  className="mqx-progress--sm"
                  aria-label="Прогресс целей"
                />
              </div>
            ) : null}
          </div>
        </button>

        {expanded ? (
          <div className="mqx-level-dash__expand" id={expandId}>
            <VictoryGoalsPanel victory={victory} legacyGoal={legacyGoal} flat />
            <div className="mqx-level-dash__section">
              <h3 className="mqx-level-dash__section-title">Достижения</h3>
              <p className="mqx-level-dash__hint">Скоро — награды за финансовые вехи в сценарии.</p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
