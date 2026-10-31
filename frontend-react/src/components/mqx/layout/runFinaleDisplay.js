/** Тексты и данные финала партии ★ BG-2 (без React). Данные — payload `run_finale` из API. */

import { pluralRu } from '../utils/boardDashDisplay.js';

export const FINALE_WIN_TITLE = 'Цель пройдена!';
export const FINALE_LOSS_TITLE = 'Партия окончена';
export const FINALE_LOSS_LEAD = 'Она уйдёт в архив сохранений. Следующая пойдёт лучше.';

export function isFinaleWin(payload) {
  return payload?.outcome === 'victory';
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
  const turns = Math.max(0, Math.trunc(Number(payload?.period_index) || 0));
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
