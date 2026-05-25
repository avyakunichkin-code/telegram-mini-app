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

/** Подзаголовок страницы «Управление капиталом». */
export function capitalPageSubtitle(mechanics) {
  const parts = ['Доходы и расходы за период'];
  if (mechanics.capital_invest) parts.push('инвестиции');
  if (mechanics.capital_insurance) parts.push('страховки');
  if (mechanics.capital_property) parts.push('имущество');
  if (mechanics.capital_liabilities) parts.push('обязательства');
  return `${parts.join(' · ')}.`;
}
