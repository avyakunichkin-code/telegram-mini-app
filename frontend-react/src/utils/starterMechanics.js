/** Разрешения механик из overview.mechanics (blueprint шаблона). */

const DEFAULT_MECHANICS = Object.freeze({
  capital_invest: true,
  capital_insurance: true,
  capital_property: true,
  capital_liabilities: true,
});

function normalizeMechanics(m) {
  if (!m || typeof m !== 'object') {
    return { ...DEFAULT_MECHANICS };
  }
  return {
    capital_invest: m.capital_invest === true,
    capital_insurance: m.capital_insurance === true,
    capital_property: m.capital_property === true,
    capital_liabilities: m.capital_liabilities === true,
  };
}

/** Потолок шаблона (blueprint.mechanics). */
export function getMechanicsFromOverview(overview) {
  return normalizeMechanics(overview?.mechanics);
}

/** Реально доступные разделы после цепочки целей (overview.mechanics_effective). */
export function getEffectiveMechanicsFromOverview(overview) {
  const eff = overview?.mechanics_effective;
  if (eff && typeof eff === 'object') {
    return normalizeMechanics(eff);
  }
  return getMechanicsFromOverview(overview);
}

/** Подзаголовок страницы «Капитал». */
export function capitalPageSubtitle(mechanics) {
  const parts = ['Доходы и расходы за период'];
  if (mechanics.capital_invest) parts.push('инвестиции');
  if (mechanics.capital_insurance) parts.push('страховки');
  if (mechanics.capital_property) parts.push('имущество');
  if (mechanics.capital_liabilities) parts.push('обязательства');
  return `${parts.join(' · ')}.`;
}

const CAPITAL_MECHANIC_KEYS = [
  'capital_invest',
  'capital_insurance',
  'capital_property',
  'capital_liabilities',
];

/** `open` | `locked` | `hidden` — шаблон vs effective для раздела капитала. */
export function capitalSectionState(overview, mechanicKey) {
  if (!CAPITAL_MECHANIC_KEYS.includes(mechanicKey)) return 'hidden';
  const templateCap = getMechanicsFromOverview(overview);
  const effective = getEffectiveMechanicsFromOverview(overview);
  if (!templateCap[mechanicKey]) return 'hidden';
  if (effective[mechanicKey]) return 'open';
  return 'locked';
}

/** Подсказка для заблокированного раздела (цели победы, без XP/уровня). */
export function capitalLockHint(overview) {
  const victory = overview?.victory;
  if (!victory) {
    return 'Раздел откроется после предыдущих шагов сценария — см. цели на главной.';
  }
  const goals = victory.goals || [];
  const currentKey = victory.current_goal_key;
  const currentGoal = goals.find((g) => g.key === currentKey);
  if (currentGoal?.title) {
    return `Сначала выполните цель «${currentGoal.title}» — раздел откроется на следующем шаге.`;
  }
  const pending = goals.find((g) => g.enabled !== false && !g.met && g.available !== false);
  if (pending?.title) {
    return `Продолжайте сценарий: «${pending.title}». Раздел откроется по цепочке целей.`;
  }
  return 'Раздел откроется после предыдущих шагов сценария — см. цели на главной.';
}
