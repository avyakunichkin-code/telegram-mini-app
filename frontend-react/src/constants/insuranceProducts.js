/** Каталог страховок (синхрон с backend/app/insurance_catalog.py). */

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

export const DEFAULT_INSURANCE_CATALOG_KEY = 'auto_liability';

export function findInsuranceCatalogItem(kindOrKey) {
  return INSURANCE_CATALOG.find((x) => x.kind === kindOrKey) ?? INSURANCE_CATALOG[0];
}

export function catalogKey(item) {
  return item?.kind ?? DEFAULT_INSURANCE_CATALOG_KEY;
}
