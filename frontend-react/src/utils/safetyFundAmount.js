function clampToMax(value, maxAmount) {
  const max = Math.max(0, Math.floor(Number(maxAmount) || 0));
  const n = Math.max(0, Math.floor(Number(value) || 0));
  return Math.min(n, max);
}

/** Разумная стартовая сумма — ~25% доступного, округление к «круглым» числам. */
export function suggestSafetyFundAmount(maxAmount) {
  const max = Math.max(0, Math.floor(Number(maxAmount) || 0));
  if (max <= 0) return 0;
  if (max <= 500) return max;

  let n = Math.floor(max * 0.25);
  if (n >= 10_000) n = Math.floor(n / 1_000) * 1_000;
  else if (n >= 1_000) n = Math.floor(n / 100) * 100;
  else if (n >= 100) n = Math.floor(n / 10) * 10;

  return clampToMax(Math.max(1, n), max);
}

/**
 * Быстрые суммы: 25%, 50%, всё доступное (без дубликатов).
 * @param {number} maxAmount
 * @returns {{ label: string, value: number }[]}
 */
export function safetyFundAmountPresets(maxAmount) {
  const max = Math.max(0, Math.floor(Number(maxAmount) || 0));
  if (max <= 0) return [];

  const parts = [
    { label: '25%', value: clampToMax(Math.floor(max * 0.25), max) },
    { label: '50%', value: clampToMax(Math.floor(max * 0.5), max) },
    { label: 'Всё', value: max },
  ];

  const seen = new Set();
  return parts.filter((p) => {
    if (p.value <= 0 || seen.has(p.value)) return false;
    seen.add(p.value);
    return true;
  });
}
