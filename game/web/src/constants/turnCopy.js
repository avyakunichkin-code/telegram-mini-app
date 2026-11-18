/** Игровая терминология: «ход» вместо «период» в UI (модель API — period_index). */

export const TURN_SINGULAR = 'Ход';
export const TURN_SINGULAR_GEN = 'хода';
export const TURN_PLURAL = 'ходов';
export const TURN_OPEN_STATUS = 'Ход в процессе';

export const FINISH_TURN_BUTTON = 'Завершить ход';
export const ACTIONS_OF_TURN = 'Действия хода';
export const FINANCES_OF_TURN = 'Финансы хода';
export const PER_TURN = 'за ход';
export const AT_TURN_END = 'в конце хода';

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

export function victoryFromTurn(minPeriod) {
  const n = Number(minPeriod);
  if (!Number.isFinite(n) || n <= 0) return 'Победа скоро';
  return `Победа с ${n}-го хода`;
}

export function waitForTurn(minPeriod) {
  const n = Number(minPeriod);
  if (!Number.isFinite(n) || n <= 0) return `Ждём ${TURN_SINGULAR_GEN}`;
  return `Ждём ${TURN_SINGULAR_GEN} ${n}`;
}

export function turnsCooldown(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 'Сейчас недоступно';
  return `Разблокируется через ${n} ${TURN_PLURAL}`;
}
