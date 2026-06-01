/** Каталог и тарифы страховок (синхрон с backend/app/insurance_catalog.py). */

export const INSURANCE_CATALOG = [
  {
    product: 'mortgage',
    insured_object: 'life',
    kind: 'mortgage_life',
    title: 'Ипотека — страхование жизни',
    product_label: 'Ипотека',
    object_label: 'Жизнь',
  },
  {
    product: 'mortgage',
    insured_object: 'property',
    kind: 'mortgage_property',
    title: 'Ипотека — страхование имущества',
    product_label: 'Ипотека',
    object_label: 'Имущество',
  },
  {
    product: 'auto',
    insured_object: 'property',
    kind: 'auto_property',
    title: 'КАСКО',
    product_label: 'Авто',
    object_label: 'Имущество',
  },
  {
    product: 'auto',
    insured_object: 'liability',
    kind: 'auto_liability',
    title: 'ОСАГО',
    product_label: 'Авто',
    object_label: 'Ответственность',
  },
  {
    product: 'health',
    insured_object: 'life',
    kind: 'health_life',
    title: 'Страхование здоровья',
    product_label: 'Здоровье',
    object_label: 'Жизнь',
  },
  {
    product: 'property',
    insured_object: 'property',
    kind: 'property_property',
    title: 'Страхование имущества',
    product_label: 'Имущество',
    object_label: 'Имущество',
  },
];

/** Пары для сетки 2×2 на экране страховок. */
export const INSURANCE_GRID_KINDS = [
  'mortgage_life',
  'mortgage_property',
  'auto_liability',
  'auto_property',
];

export const INSURANCE_PLANS = [
  { plan_key: 'mortgage_life_basic', kind: 'mortgage_life', label: 'Базовый', monthly_premium: 1200, payout_amount: 1500000, term_periods: 12 },
  { plan_key: 'mortgage_life_standard', kind: 'mortgage_life', label: 'Стандарт', monthly_premium: 1800, payout_amount: 2500000, term_periods: 12 },
  { plan_key: 'mortgage_life_plus', kind: 'mortgage_life', label: 'Максимум', monthly_premium: 2600, payout_amount: 4000000, term_periods: 24 },
  { plan_key: 'mortgage_property_basic', kind: 'mortgage_property', label: 'Базовый', monthly_premium: 1400, payout_amount: 2000000, term_periods: 12 },
  { plan_key: 'mortgage_property_standard', kind: 'mortgage_property', label: 'Стандарт', monthly_premium: 1800, payout_amount: 3500000, term_periods: 12 },
  { plan_key: 'mortgage_property_plus', kind: 'mortgage_property', label: 'Максимум', monthly_premium: 2400, payout_amount: 5000000, term_periods: 24 },
  { plan_key: 'auto_liability_basic', kind: 'auto_liability', label: 'Базовый', monthly_premium: 1800, payout_amount: 300000, term_periods: 12 },
  { plan_key: 'auto_liability_standard', kind: 'auto_liability', label: 'Стандарт', monthly_premium: 2400, payout_amount: 400000, term_periods: 12 },
  { plan_key: 'auto_liability_plus', kind: 'auto_liability', label: 'Плюс', monthly_premium: 3600, payout_amount: 600000, term_periods: 12 },
  { plan_key: 'auto_property_basic', kind: 'auto_property', label: 'Базовый', monthly_premium: 6500, payout_amount: 800000, term_periods: 12 },
  { plan_key: 'auto_property_standard', kind: 'auto_property', label: 'Стандарт', monthly_premium: 8500, payout_amount: 1200000, term_periods: 12 },
  { plan_key: 'auto_property_plus', kind: 'auto_property', label: 'Премиум', monthly_premium: 12000, payout_amount: 2500000, term_periods: 24 },
  { plan_key: 'health_life_basic', kind: 'health_life', label: 'Базовый', monthly_premium: 900, payout_amount: 200000, term_periods: 12 },
  { plan_key: 'health_life_standard', kind: 'health_life', label: 'Стандарт', monthly_premium: 1500, payout_amount: 400000, term_periods: 12 },
  { plan_key: 'property_property_basic', kind: 'property_property', label: 'Базовый', monthly_premium: 1100, payout_amount: 500000, term_periods: 12 },
  { plan_key: 'property_property_standard', kind: 'property_property', label: 'Стандарт', monthly_premium: 1600, payout_amount: 1000000, term_periods: 12 },
];

export const DEFAULT_INSURANCE_CATALOG_KEY = 'auto_liability';

export function findInsuranceCatalogItem(kindOrKey) {
  return INSURANCE_CATALOG.find((x) => x.kind === kindOrKey) ?? INSURANCE_CATALOG[0];
}

export function insuranceGridCatalog() {
  return INSURANCE_CATALOG.filter((x) => INSURANCE_GRID_KINDS.includes(x.kind));
}

export function plansForKind(kind) {
  return INSURANCE_PLANS.filter((p) => p.kind === kind);
}

export function findInsurancePlan(planKey) {
  return INSURANCE_PLANS.find((p) => p.plan_key === planKey) ?? null;
}

/** Подсказка под плиткой каталога (ОСАГО, КАСКО…). */
export function catalogTileHint(item) {
  if (item?.kind === 'auto_liability') return 'ОСАГО';
  if (item?.kind === 'auto_property') return 'КАСКО';
  return null;
}

/** Accent-bar для карточек полиса. */
export function insuranceAccentClass(product) {
  if (product === 'auto') return 'auto';
  if (product === 'mortgage') return 'mortgage';
  return 'default';
}
