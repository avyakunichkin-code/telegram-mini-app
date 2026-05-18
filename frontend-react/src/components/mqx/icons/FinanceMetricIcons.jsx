/** Иконки метрик финансов (активы, долги, инвестиции). */

export function IconMetricCoins({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="8" cy="7" rx="5" ry="2.2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 7v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V7" stroke="currentColor" strokeWidth="1.75" />
      <ellipse cx="14" cy="13" rx="5" ry="2.2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 13v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2v-4" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

/** Расход / платёж — стрелка вниз. */
export function IconMetricTrendDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" d="M12 5v10" />
      <path
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 13l4 4 4-4"
      />
    </svg>
  );
}

/** Доход — стрелка вверх. */
export function IconMetricTrendUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" d="M12 19V9" />
      <path
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 11l4-4 4 4"
      />
    </svg>
  );
}

/** Срок / период — для страховок и срочных продуктов. */
export function IconMetricTerm({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="13" r="7.25" stroke="currentColor" strokeWidth="1.75" />
      <path stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" d="M12 10v4l2.5 1.5" />
      <path stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" d="M12 4.5V3" />
    </svg>
  );
}

/** Ставка % — для позиций и шаблонов. */
export function IconMetricPercent({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.85" />
      <circle cx="17" cy="17" r="2.25" stroke="currentColor" strokeWidth="1.85" />
      <path stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" d="M5 19L19 5" />
    </svg>
  );
}
