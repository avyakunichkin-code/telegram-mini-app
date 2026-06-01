/** Категории и доли по умолчанию (синхрон с backend expense_template_defaults). */

export const PLAN_EXPENSE_CATEGORIES = [
  { category_key: 'housing', title: 'Жильё' },
  { category_key: 'food', title: 'Еда' },
  { category_key: 'transport', title: 'Транспорт' },
  { category_key: 'health', title: 'Здоровье' },
  { category_key: 'clothing', title: 'Одежда и быт' },
  { category_key: 'communications', title: 'Связь и подписки' },
  { category_key: 'leisure', title: 'Досуг' },
  { category_key: 'other', title: 'Прочее' },
];

const DEFAULT_SHARES = {
  housing: 0.14,
  food: 0.38,
  transport: 0.12,
  communications: 0.08,
  health: 0.09,
  clothing: 0.07,
  leisure: 0.12,
  other: 0,
};

function normalizeSum(budget, target) {
  const keys = Object.keys(budget);
  const current = keys.reduce((s, k) => s + Math.max(0, Number(budget[k]) || 0), 0);
  if (current <= 0) {
    const out = Object.fromEntries(keys.map((k) => [k, 0]));
    if (keys.length) out[keys[0]] = target;
    else out.other = target;
    return out;
  }
  if (Math.abs(current - target) < 0.02) {
    return Object.fromEntries(keys.map((k) => [k, Math.round(Math.max(0, Number(budget[k]) || 0))]));
  }
  const scale = target / current;
  const scaled = Object.fromEntries(
    keys.map((k) => [k, Math.round(Math.max(0, Number(budget[k]) || 0) * scale)]),
  );
  const diff = Math.round(target - keys.reduce((s, k) => s + scaled[k], 0));
  if (diff !== 0 && keys.length) scaled[keys[0]] += diff;
  return scaled;
}

/** Стартовый бюджет Plan: ~55% зарплаты по долям категорий. */
export function defaultPlanExpenseBudget(monthlySalary, lifestyleShare = 0.55) {
  const salary = Math.max(0, Number(monthlySalary) || 0);
  if (salary <= 0) {
    return Object.fromEntries(PLAN_EXPENSE_CATEGORIES.map((c) => [c.category_key, 0]));
  }
  const target = Math.round(salary * lifestyleShare);
  const rough = Object.fromEntries(
    Object.entries(DEFAULT_SHARES).map(([k, share]) => [k, Math.round(target * share)]),
  );
  return normalizeSum(rough, target);
}

export function sumExpenseBudget(budget) {
  return Object.values(budget || {}).reduce((s, v) => s + Math.max(0, Number(v) || 0), 0);
}
