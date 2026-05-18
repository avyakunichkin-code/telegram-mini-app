/** Фиксированные ставки MVP (выбор продукта — в бэклоге). */
export const DEPOSIT_ANNUAL_RATE_PERCENT = 12;
export const BOND_ANNUAL_RATE_PERCENT = 10;

export function investAmountStep(maxAmount) {
  const max = Math.max(0, Math.floor(Number(maxAmount) || 0));
  if (max <= 0) return 1;
  if (max <= 10_000) return 100;
  if (max <= 100_000) return 1_000;
  return 10_000;
}

export function clampInvestAmount(value, maxAmount) {
  const max = Math.max(0, Math.floor(Number(maxAmount) || 0));
  const n = Math.floor(Number(value) || 0);
  return Math.min(Math.max(0, n), max);
}

/** Начисление за период: 1/12 годовой ставки. */
export function investMonthlyAccrual(principal, annualRatePercent) {
  const p = Number(principal) || 0;
  const r = Number(annualRatePercent) || 0;
  return Math.round((p * r) / 100 / 12);
}
