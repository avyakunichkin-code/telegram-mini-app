/** Разрешения механик из overview.mechanics (blueprint шаблона). */

const DEFAULT_MECHANICS = Object.freeze({
  capital_invest: true,
  capital_insurance: true,
  capital_property: true,
  capital_liabilities: true,
});

export function getMechanicsFromOverview(overview) {
  const m = overview?.mechanics;
  if (!m || typeof m !== 'object') {
    return { ...DEFAULT_MECHANICS };
  }
  return {
    capital_invest: m.capital_invest !== false,
    capital_insurance: m.capital_insurance !== false,
    capital_property: m.capital_property !== false,
    capital_liabilities: m.capital_liabilities !== false,
  };
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
