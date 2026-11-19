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
export function periodCloseMonetkaReaction(summary) {
  const m = derivePeriodCloseMetrics(summary);
  if (!m) return null;
  if (Number(summary?.overdue_added) > 0) {
    return { pose: 'worried', text: 'Появилась просрочка — долг растёт. Закрой её в «Капитале», пока не набежали пени.' };
  }
  if (m.safetyDelta > 0) {
    return { pose: 'joy', text: `Подушка выросла на ${formatMoneyAbs(m.safetyDelta)} ₽ — так держать!` };
  }
  if (m.cashDelta > 0) return { pose: 'joy', text: 'Ход в плюс! Интересно, а что если часть отложить в подушку?' };
  if (m.cashDelta < 0) return { pose: 'support', text: 'Ход в минус. Интересно, какая строчка чека съела больше всего?' };
  return { pose: 'think', text: 'Ход в ноль: сколько пришло, столько и ушло.' };
}

export function periodCloseRitualPeriodLabel(summary) {
  const m = derivePeriodCloseMetrics(summary);
  return turnClosedTitle(m?.periodIndex || 0);
}
