/** Тексты и данные дашборда ★ BG-1 «настольная игра» (без React). */

import { victoryFromTurn } from '../../../constants/turnCopy.js';

export const NEEDS_AXES = [
  { key: 'comfort', label: 'Комфорт' },
  { key: 'status', label: 'Статус' },
  { key: 'social', label: 'Связи' },
  { key: 'health', label: 'Здоровье' },
];

export function pluralRu(n, one, few, many) {
  const abs = Math.abs(Math.trunc(Number(n) || 0));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** «2 события», «5 событий»; 0 — «События решены». */
export function eventsPlateTitle(count) {
  const n = Math.max(0, Math.trunc(Number(count) || 0));
  if (n === 0) return 'События решены';
  return `${n} ${pluralRu(n, 'событие', 'события', 'событий')}`;
}

export function eventsPlateHint(count) {
  const n = Math.max(0, Math.trunc(Number(count) || 0));
  if (n === 0) return 'новые придут в следующем ходу';
  return n === 1 ? 'ждёт решения в этом ходу' : 'ждут решения в этом ходу';
}

/** Ось потребностей с минимальным значением (для подсказки о риске). */
export function lowestNeedAxis(needs) {
  if (!needs || typeof needs !== 'object' || needs.enabled === false) return null;
  let min = null;
  for (const a of NEEDS_AXES) {
    const v = Number(needs[a.key]);
    const value = Number.isFinite(v) ? v : 0;
    if (!min || value < min.value) min = { ...a, value };
  }
  return min;
}

/**
 * Монетка одной строкой — самое срочное в этом ходу.
 * Порядок: риск поражения по потребностям → просрочка → минус после хода → зарплата → события → шаг цели.
 * `closePreview` — из `closePreviewView`; `safetyBalance` — подушка (подскажем снять, PR-07).
 * @returns {{ text: string, tone: 'risk' | 'normal' }}
 */
export function buildTurnTip({
  needs = null,
  needsZeroStreak = 0,
  overdueCount = 0,
  salaryAvailable = false,
  pendingEventsCount = 0,
  goalView = null,
  closePreview = null,
  safetyBalance = 0,
} = {}) {
  if (Number(needsZeroStreak) > 0) {
    const axis = lowestNeedAxis(needs);
    const label = axis ? `«${axis.label}»` : 'Потребность';
    return { text: `${label} на нуле — позаботься о себе`, tone: 'risk' };
  }
  if (Number(overdueCount) > 0) {
    return { text: 'Есть просрочка — погаси долг в «Капитале»', tone: 'risk' };
  }
  if (closePreview?.negative) {
    // Превью без зарплаты: не забрана — в конце хода её не будет (C-2).
    if (salaryAvailable) return { text: 'Не хватит на расходы — забери зарплату', tone: 'risk' };
    if (Number(safetyBalance) > 0) return { text: 'Не хватит на расходы — сними из подушки', tone: 'risk' };
    return { text: 'Не хватит на расходы хода — уйдёшь в минус', tone: 'risk' };
  }
  if (salaryAvailable) return { text: 'Забери зарплату до конца хода', tone: 'normal' };
  if (Number(pendingEventsCount) > 0) return { text: 'Реши события до конца хода', tone: 'normal' };

  const phase = goalView?.phase;
  if (phase === 'active' && goalView.currentGoal?.title) {
    return { text: `Шаг цели: ${goalView.currentGoal.title}`, tone: 'normal' };
  }
  if (phase === 'gate') {
    return { text: `Все шаги готовы. ${victoryFromTurn(goalView.minPeriod)}`, tone: 'normal' };
  }
  if (phase === 'win') return { text: 'Победа! Можно играть дальше', tone: 'normal' };
  return { text: 'Всё сделано — можно завершать ход', tone: 'normal' };
}

/**
 * Превью конца хода ★ close-preview-round A (PR-07): строка под «Завершить ход».
 * Источник — `period_close_preview` из `GET /api/finance/overview` (тот же расчёт, что закрытие хода).
 * @returns {{ charges: number, after: number, negative: boolean, defeat: boolean } | null}
 */
export function closePreviewView(preview) {
  if (!preview || typeof preview !== 'object') return null;
  const after = Number(preview.estimated_cash_after_close) || 0;
  return {
    charges: Math.max(0, Number(preview.estimated_charges_total) || 0),
    after,
    negative: Boolean(preview.would_be_negative_after_close),
    defeat: Boolean(preview.defeat_if_close_negative),
  };
}

/** Подпись свёрнутой цели: «шаг 3 из 5». */
export function goalStepCaption(view) {
  if (!view || view.total <= 0) return '';
  if (view.phase === 'win') return 'победа';
  if (view.phase === 'gate') return 'все шаги готовы';
  if (view.phase === 'all_met') return `все ${view.total} готовы`;
  return `шаг ${view.currentIndex + 1} из ${view.total}`;
}

/** Строка финиша в раскрытой цели. */
export function goalFinishText(view) {
  if (view?.phase === 'win') return 'Победа — игра продолжается';
  // Ворота по номеру хода сейчас сняты (engine: min_period_index = 1) — номер показываем только если > 1.
  const min = Number(view?.minPeriod);
  if (Number.isFinite(min) && min > 1) return `Победа с ${min}-го хода — игра продолжится`;
  return 'Финиш — победа, игра продолжится';
}

/**
 * Ячейка дохода ★ BG-3: всегда «Доходы за ход» — плановый доход хода из всех источников
 * (`total_monthly_income`: зарплата + доход с вложений), как «Доходы за ход» в «Капитале».
 * Сумма самой зарплаты показана на её кнопке в «Действиях хода».
 * @returns {{ label: string, value: number }}
 */
export function incomeCell(overview) {
  const total = Number(overview?.total_monthly_income) || 0;
  const salary = Number(overview?.salary?.monthly_amount) || 0;
  return { label: 'Доходы за ход', value: total || salary };
}
