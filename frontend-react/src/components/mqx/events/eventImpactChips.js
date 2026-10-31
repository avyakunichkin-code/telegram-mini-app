/**
 * ★ BG-2: последствия выбора события — чипы (деньги, потребности), без XP.
 * Роли цвета (ADR-014): risk — минус денег, gain — плюс, coin — сумма сделки,
 * потребности — нейтральные, изумрудные при росте.
 */

const NEED_AXES = [
  ['comfort', 'Комфорт'],
  ['status', 'Статус'],
  ['social', 'Связи'],
  ['health', 'Здоровье'],
];

const MINUS = '−';
const NBSP = ' ';

function formatRub(value) {
  const n = Math.round(Math.abs(Number(value) || 0));
  return `${n.toLocaleString('ru-RU')}${NBSP}₽`;
}

function signed(value, text) {
  const n = Number(value) || 0;
  if (n > 0) return `+${text}`;
  if (n < 0) return `${MINUS}${text}`;
  return text;
}

/** Тон денежного чипа: для расходов рост — риск. */
export function impactChipTone(kind, delta) {
  const n = Number(delta) || 0;
  if (kind === 'coin') return 'coin';
  if (kind === 'term') return 'neutral';
  if (kind === 'burn') return n > 0 ? 'risk' : n < 0 ? 'gain' : 'neutral';
  return n > 0 ? 'gain' : n < 0 ? 'risk' : 'neutral';
}

function impactChipText(imp) {
  const kind = imp?.kind || 'cash';
  const delta = Number(imp?.delta) || 0;
  switch (kind) {
    case 'cash':
      return signed(delta, formatRub(delta));
    case 'safety':
      return `Подушка ${signed(delta, formatRub(delta))}`;
    case 'burn':
      return `Расходы ${signed(delta, formatRub(delta))}/ход`;
    case 'insurance_payout':
      return `Выплата +${formatRub(delta)}`;
    case 'coin':
      return `Актив ${formatRub(delta)}`;
    case 'term':
      return String(imp?.tip || '').trim() || `Через ${delta} ход.`;
    default:
      return signed(delta, formatRub(delta));
  }
}

/** @returns {{ key: string, text: string, tone: string, tip?: string, money: boolean }[]} */
export function buildImpactChips(impacts) {
  if (!Array.isArray(impacts)) return [];
  return impacts.map((imp, idx) => {
    const kind = imp?.kind || 'cash';
    return {
      key: `${kind}-${idx}`,
      text: impactChipText(imp),
      tone: impactChipTone(kind, imp?.delta),
      tip: imp?.tip || undefined,
      money: kind !== 'term',
    };
  });
}

/**
 * Тост после выбора: те же округление и подписи, что у чипов карточки,
 * иначе игрок видит «Связи +4» до выбора и «Связи +3.6» после.
 */
export function needsChangeToastText(needsBefore, needsAfter) {
  if (!needsAfter || typeof needsAfter !== 'object') return null;
  if (!needsBefore || typeof needsBefore !== 'object') return 'Потребности изменились';
  const delta = Object.fromEntries(
    NEED_AXES.map(([key]) => [key, Number(needsAfter[key]) - Number(needsBefore[key])]),
  );
  const chips = buildNeedsChips(delta);
  return chips.length ? `Потребности: ${chips.map((c) => c.text).join(', ')}` : 'Потребности изменились';
}

/** Потребности: «Комфорт −8» нейтрально, «Статус +5» изумрудом. Нулевые оси скрыты. */
export function buildNeedsChips(needsDelta) {
  if (!needsDelta || typeof needsDelta !== 'object') return [];
  return NEED_AXES.map(([key, label]) => {
    const v = Math.round(Number(needsDelta[key]));
    if (!Number.isFinite(v) || v === 0) return null;
    return {
      key: `need-${key}`,
      text: `${label} ${v > 0 ? '+' : MINUS}${Math.abs(v)}`,
      tone: v > 0 ? 'gain' : 'neutral',
      money: false,
    };
  }).filter(Boolean);
}
