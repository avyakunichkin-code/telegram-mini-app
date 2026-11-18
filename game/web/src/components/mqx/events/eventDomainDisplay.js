/** Визуал event_domain (L3 ★) — подписи и CSS-модификаторы. */

const DOMAIN_LABELS = {
  consumption: 'Повседневное',
  housing: 'Жильё и быт',
  health: 'Здоровье',
  insurance: 'Страхование',
  auto: 'Авто',
  credit_debt: 'Кредиты',
  investment_education: 'Обучение',
  social_family: 'Семья',
  income_work: 'Работа',
  meta: 'Системное',
};

export function eventDomainLabel(domainKey) {
  const key = String(domainKey || '').trim();
  return DOMAIN_LABELS[key] || 'Событие';
}

export function eventDomainModifier(domainKey) {
  const key = String(domainKey || 'consumption').trim();
  if (DOMAIN_LABELS[key]) {
    return `mqx-events-card--domain-${key.replace(/_/g, '-')}`;
  }
  return 'mqx-events-card--domain-consumption';
}

/** @param {{ event_domain?: string }} event */
export function eventDomainTheme(event) {
  const key = event?.event_domain || 'consumption';
  return {
    key,
    label: eventDomainLabel(key),
    modifierClass: eventDomainModifier(key),
  };
}
