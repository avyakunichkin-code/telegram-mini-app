import { useMemo } from 'react';
import { buildVictorySummary } from '../utils/victoryGoalDisplay';
import { MqxCard } from './MqxCard';
import { MqxCardHeader } from './MqxCardHeader';
import { MqxGoalBadge } from './MqxGoalBadge';
import { VictoryGoalItem } from './VictoryGoalItem';

/**
 * Панель целей победы v2 (M из N) + fallback на legacy подушку.
 */
export function VictoryGoalsPanel({ victory, legacyGoal, flat = false }) {
  const summary = useMemo(() => buildVictorySummary(victory, legacyGoal), [victory, legacyGoal]);

  const gateNote =
    summary.gateOpen === false && summary.minPeriod
      ? `Победа доступна с периода ${summary.minPeriod}`
      : null;

  const sub = [summary.subtitle, gateNote].filter(Boolean).join(' · ') || null;

  const body = (
    <>
      <MqxCardHeader
        layout="split"
        kicker="Цель"
        kickerTone="emerald"
        title={summary.title}
        titleId="mq-victory-goals"
        sub={sub}
        trailing={<MqxGoalBadge>{summary.badge}</MqxGoalBadge>}
      />

      {summary.goals.length === 0 ? (
        <div className="mqx-goal__progress">
          <div className="mqx-goal__row">
            <span>Цель не задана</span>
            <span>—</span>
          </div>
        </div>
      ) : (
        <ul className="mqx-victory-goals">
          {summary.goals.map((goal) => (
            <VictoryGoalItem key={goal.key} goal={goal} />
          ))}
        </ul>
      )}
    </>
  );

  if (flat) {
    return (
      <div className="mqx-period-dash__goals" aria-labelledby="mq-victory-goals">
        {body}
      </div>
    );
  }

  return (
    <MqxCard variant="goal" ariaLabelledBy="mq-victory-goals">
      {body}
    </MqxCard>
  );
}
