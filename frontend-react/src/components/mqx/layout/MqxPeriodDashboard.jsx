import { useId, useMemo, useState } from 'react';
import { buildVictorySummary } from '../utils/victoryGoalDisplay';
import { MqxBlockSection } from './MqxBlockSection';
import { MqxStatMini } from './MqxStatMini';
import { VictoryGoalsPanel } from './VictoryGoalsPanel';

/**
 * Сворачиваемый «Дашборд периода» (D′): сводка целей + chip, разворот — цели и финансы.
 */
export function MqxPeriodDashboard({
  victory,
  legacyGoal,
  financeCards = [],
  onGoFinance,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const expandId = useId();
  const summary = useMemo(() => buildVictorySummary(victory, legacyGoal), [victory, legacyGoal]);

  const summaryLine = [summary.subtitle, summary.badge].filter(Boolean).join(' · ');

  return (
    <section
      className={`mqx-period-dash${expanded ? ' mqx-period-dash--expanded' : ''}`}
    >
      <button
        type="button"
        className="mqx-period-dash__toggle"
        aria-expanded={expanded}
        aria-controls={expandId}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="mqx-period-dash__compact-top">
          <div>
            <div className="mqx-period-dash__title">Дашборд периода</div>
            {summaryLine ? (
              <div className="mqx-period-dash__summary">{summaryLine}</div>
            ) : null}
          </div>
          <span className="mqx-period-dash__chevron" aria-hidden>
            ▼
          </span>
        </div>

        <div className="mqx-period-dash__chips" aria-hidden={expanded}>
          {financeCards.map((c) => (
            <div key={c.title} className="mqx-period-dash__chip">
              <div className="mqx-period-dash__chip-label">{c.title}</div>
              <div className="mqx-period-dash__chip-value">{c.valueNode}</div>
            </div>
          ))}
        </div>

        {!expanded ? (
          <p className="mqx-period-dash__hint">Цели и финансы — нажмите, чтобы развернуть</p>
        ) : null}
      </button>

      {expanded ? (
        <div className="mqx-period-dash__expand" id={expandId}>
          <VictoryGoalsPanel victory={victory} legacyGoal={legacyGoal} flat />
          <div className="mqx-period-dash__finance">
            <MqxBlockSection title="Финансы" actionLabel="Детали" onAction={onGoFinance}>
              <div className="mqx-grid2">
                {financeCards.map((c) => (
                  <MqxStatMini
                    key={c.title}
                    title={c.title}
                    value={c.valueNode}
                    icon={c.icon}
                    accent={c.accent}
                  />
                ))}
              </div>
            </MqxBlockSection>
          </div>
        </div>
      ) : null}
    </section>
  );
}
