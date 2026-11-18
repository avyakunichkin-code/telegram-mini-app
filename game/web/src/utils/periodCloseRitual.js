import { turnClosedTitle } from '../constants/turnCopy.js';
import { derivePeriodCloseMetrics } from './periodCloseDisplay.js';

function formatMoneyAbs(n) {
  const v = Math.round(Math.abs(Number(n) || 0));
  return v.toLocaleString('ru-RU');
}

/**
 * Реплика Монетки под чеком Квити (★ ink-mascots-round «Итоги хода»): одна строка о главном за ход.
 * Приоритет: просрочка → подушка выросла → итог хода в плюс / в минус / в ноль.
 */
export function periodCloseMonetkaLine(summary) {
  const m = derivePeriodCloseMetrics(summary);
  if (!m) return null;
  if (Number(summary?.overdue_added) > 0) {
    return 'Появилась просрочка — долг растёт. Закрой её в «Капитале», пока не набежали пени.';
  }
  if (m.safetyDelta > 0) {
    return `Подушка выросла на ${formatMoneyAbs(m.safetyDelta)} ₽ — так держать!`;
  }
  if (m.cashDelta > 0) return 'Ход в плюс! Интересно, а что если часть отложить в подушку?';
  if (m.cashDelta < 0) return 'Ход в минус. Интересно, какая строчка чека съела больше всего?';
  return 'Ход в ноль: сколько пришло, столько и ушло.';
}

export function periodCloseRitualPeriodLabel(summary) {
  const m = derivePeriodCloseMetrics(summary);
  return turnClosedTitle(m?.periodIndex || 0);
}
