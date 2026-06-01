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

/** Фин.подушка / защита. */
export function IconMetricShield({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        d="M12 3 20 7v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4Z"
        fill="none"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M9.5 12.2 11 13.7 14.6 10.1"
        fill="none"
      />
    </svg>
  );
}

/** Предупреждение / ошибка секции. */
export function IconMetricWarn({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        d="M12 3 22 20H2L12 3Z"
        fill="none"
      />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 9v5M12 17h.01" fill="none" />
    </svg>
  );
}

/** Удаление / закрытие — канон по умолчанию в `MqxRowAction` (F2); символ «−» — `removeVisual="minus"` (F1). */
export function IconMetricTrash({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M9 3h6l1 2h4v2H4V5h4l1-2Z"
      />
      <path stroke="currentColor" strokeWidth="1.75" d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}
