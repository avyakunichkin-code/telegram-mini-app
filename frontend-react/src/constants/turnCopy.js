/** Игровая терминология: «ход» вместо «период» в UI (модель API — period_index). */

export const TURN_SINGULAR = 'Ход';
export const TURN_SINGULAR_GEN = 'хода';
export const TURN_PLURAL = 'ходов';

export const FINISH_TURN_BUTTON = 'Завершить ход';

export function turnLabel(index) {
  const n = Number(index);
  if (!Number.isFinite(n) || n <= 0) return TURN_SINGULAR;
  return `${TURN_SINGULAR} #${n}`;
}

export function turnCloseTitle(index) {
  const n = Number(index);
  return n > 0 ? `Итоги ${TURN_SINGULAR_GEN} #${n}` : `Итоги ${TURN_SINGULAR_GEN}`;
}

export function turnClosedTitle(index) {
  const n = Number(index);
  return n > 0 ? `${TURN_SINGULAR} №${n} завершён` : `${TURN_SINGULAR} завершён`;
}
