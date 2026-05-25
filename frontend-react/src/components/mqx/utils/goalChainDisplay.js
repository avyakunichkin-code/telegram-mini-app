import { buildVictorySummary } from './victoryGoalDisplay';

/**
 * Цепочка целей из victory v2: первая невыполненная = текущая, предыдущие = done, следующие = locked.
 * @param {object|null|undefined} victory
 * @param {object|null|undefined} legacyGoal
 */
export function buildGoalChainView(victory, legacyGoal) {
  const summary = buildVictorySummary(victory, legacyGoal);
  const goals = summary.goals.filter((g) => g.enabled !== false);
  const total = goals.length;

  if (total === 0) {
    return {
      total: 0,
      currentIndex: -1,
      currentGoal: null,
      chain: [],
      stepLabel: null,
      headerTitle: 'Цель не задана',
      phase: 'empty',
      nextGoalTitle: null,
    };
  }

  let currentIndex = goals.findIndex((g) => !g.met);
  if (victory?.current_goal_key) {
    const byKey = goals.findIndex((g) => g.key === victory.current_goal_key);
    if (byKey >= 0) currentIndex = byKey;
  }
  const allMet = currentIndex < 0;
  const resolvedIndex = allMet ? total - 1 : currentIndex;
  const currentGoal = goals[resolvedIndex];
  const nextGoal = allMet ? null : goals[currentIndex + 1] ?? null;

  const chain = goals.map((g, i) => {
    let status = 'locked';
    if (g.met || i < resolvedIndex) status = 'done';
    else if (i === resolvedIndex && !allMet) status = 'current';
    else if (allMet && i === resolvedIndex) status = 'done';
    return { key: g.key, title: g.title, status };
  });

  let phase = 'active';
  if (allMet) {
    if (victory?.win_reached) phase = 'win';
    else if (summary.gateOpen === false && summary.minPeriod) phase = 'gate';
    else phase = 'all_met';
  }

  const stepNum = allMet ? total : resolvedIndex + 1;
  const stepLabel = allMet
    ? `Шаг ${total} из ${total}${phase === 'win' ? ' · победа' : ' · выполнено ✓'}`
    : `Шаг ${stepNum} из ${total}`;

  return {
    total,
    currentIndex: resolvedIndex,
    currentGoal,
    chain,
    stepLabel,
    headerTitle: allMet && phase === 'win' ? 'Победа в сценарии' : currentGoal?.title ?? 'Цель',
    phase,
    nextGoalTitle: nextGoal?.title ?? null,
    minPeriod: summary.minPeriod,
  };
}
