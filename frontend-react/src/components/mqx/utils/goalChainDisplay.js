import { buildVictorySummary } from './victoryGoalDisplay';

/**
 * Цепочка целей из victory v2: первая невыполненная = текущая, предыдущие = done, следующие = locked.
 * @param {object|null|undefined} victory
 * @param {object|null|undefined} legacyGoal
 */
export function buildGoalChainView(victory, legacyGoal) {
  const summary = buildVictorySummary(victory, legacyGoal);
  const allGoals = (victory?.goals || summary.goals).filter((g) => g.enabled !== false);
  const goals = allGoals.filter((g) => g.available !== false);
  const lockedLater = allGoals.filter((g) => g.available === false);
  const total = goals.length;

  if (total === 0) {
    return {
      total: 0,
      currentIndex: -1,
      currentGoal: null,
      chain: [],
      stepAriaLabel: null,
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

  for (const g of lockedLater) {
    chain.push({
      key: g.key,
      title: g.title,
      status: 'locked',
      blockedReason: g.blocked_reason || null,
    });
  }

  let phase = 'active';
  if (allMet) {
    if (victory?.win_reached) phase = 'win';
    else if (summary.gateOpen === false && summary.minPeriod) phase = 'gate';
    else phase = 'all_met';
  }

  const stepNum = allMet ? total : resolvedIndex + 1;
  const doneCount = chain.filter((s) => s.status === 'done').length;
  let stepAriaLabel = `Шаги сценария: ${doneCount} выполнено, активен шаг ${stepNum} из ${total}`;
  if (phase === 'win') stepAriaLabel = `Все ${total} шагов выполнены, победа`;
  else if (phase === 'gate') stepAriaLabel = `Все шаги выполнены, победа с ${summary.minPeriod ?? '—'}-го периода`;
  else if (allMet) stepAriaLabel = `Все ${total} шагов выполнены`;

  return {
    total,
    currentIndex: resolvedIndex,
    currentGoal,
    chain,
    stepAriaLabel,
    headerTitle: allMet && phase === 'win' ? 'Победа в сценарии' : currentGoal?.title ?? 'Цель',
    phase,
    nextGoalTitle: nextGoal?.title ?? null,
    minPeriod: summary.minPeriod,
  };
}
