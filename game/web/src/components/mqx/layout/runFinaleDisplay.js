/** Тексты и данные финала партии ★ BG-2 (без React). Данные — payload `run_finale` из API. */

import { pluralRu } from '../utils/boardDashDisplay.js';

export const FINALE_WIN_TITLE = 'Цель пройдена!';
export const FINALE_LOSS_TITLE = 'Партия окончена';
export const FINALE_LOSS_LEAD = 'Она уйдёт в архив сохранений. Следующая пойдёт лучше.';

export function isFinaleWin(payload) {
  return payload?.outcome === 'victory';
}

/** Только отображение выбранных API фактов; порог и ранжирование остаются на backend. */
export function finaleDecisions(payload) {
  if (!Array.isArray(payload?.decisions)) return [];
  const burn = Number(payload.monthly_burn);
  return payload.decisions.filter((d) => d && ['cost', 'gain'].includes(d.direction)
    && typeof d.amount === 'number' && Number.isFinite(d.amount) && d.amount > 0
    && typeof d.title === 'string' && d.title.trim()).slice(0, 3).map((d) => ({
    ...d,
    sign: d.direction === 'gain' ? '+' : '−',
    expenseMonths: Number.isFinite(burn) && burn > 0
      ? `${(d.amount / burn).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} мес. расходов` : null,
  }));
}

function fmtRub(value) {
  if (value == null || value === '') return null;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return null;
  const abs = Math.abs(n).toLocaleString('ru-RU').replace(/\s/g, ' ');
  return `${n < 0 ? '−' : ''}${abs} ₽`;
}

function fmtTurns(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (Math.round(n * 10) / 10).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}

/** Три показателя победы: ходов · на счёте · ходов подушки. Нет данных — «—». */
export function finaleWinStats(payload) {
  const turns = Math.max(0, Math.trunc(Number(payload?.turns_completed) || 0));
  const cushion = fmtTurns(payload?.cushion_turns);
  return [
    { key: 'turns', value: String(turns), label: pluralRu(turns, 'ход', 'хода', 'ходов') },
    { key: 'cash', value: fmtRub(payload?.cash_balance) ?? '—', label: 'на счёте', money: true },
    { key: 'cushion', value: cushion ?? '—', label: 'ходов подушки' },
  ];
}

/** Поражение: факт риска (title), деталь (text), не больше двух советов. */
export function finaleDefeatFact(payload) {
  const fact = payload?.fact;
  if (!fact) return null;
  return {
    title: fact.title || '',
    text: fact.text || '',
    tips: Array.isArray(fact.tips) ? fact.tips.filter(Boolean).slice(0, 2) : [],
  };
}
