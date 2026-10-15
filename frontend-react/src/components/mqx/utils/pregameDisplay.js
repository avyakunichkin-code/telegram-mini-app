/**
 * Подписи экранов до партии ★ BG-2 (Меню, Выбор жизни) — из данных существующих API.
 * Канон: design-lab/board-game/screens-round/, design-lab/pre-game-shell/APPROVED.md.
 */
import { pluralRu } from './boardDashDisplay.js';

const MONTHLY_MONEY_RE = /~?\s*(\d[\d\s]*)\s*₽\s*\/\s*мес/i;
const CONSONANT_END_RE = /[бвгджзклмнпрстфхцчшщ]$/i;

/**
 * Доход за ход из строки «Зарплата ~62 500 ₽/мес» (highlights шаблона): «~62 500 ₽ за ход».
 * @param {string[]} highlights
 */
export function lifeIncomePerTurn(highlights) {
  for (const line of highlights || []) {
    const m = String(line).match(MONTHLY_MONEY_RE);
    if (m) return `~${m[1].trim()} ₽ за ход`;
  }
  return null;
}

/**
 * Стартовые условия: первая строка highlights без суммы в месяц, иначе описание шаблона.
 * @param {{ highlights?: string[], description?: string|null }} template
 */
export function lifeStartConditions(template) {
  const rest = (template?.highlights || []).filter((line) => !MONTHLY_MONEY_RE.test(String(line)));
  if (rest.length) return rest[0];
  return template?.description || null;
}

/** «Начать за Студента»: винительный падеж роли (роли мужского рода: на согласную или «ь»). */
export function roleAccusative(title) {
  const t = String(title || '').trim();
  if (!t) return '';
  if (/ь$/i.test(t)) return `${t.slice(0, -1)}я`;
  return CONSONANT_END_RE.test(t) ? `${t}а` : t;
}

export function lifeStartLabel(title) {
  const who = roleAccusative(title);
  return who ? `Начать за ${who}` : 'Начать игру';
}

/** «3 партии» — подсказка у кнопки «Все сохранения». */
export function savesCountHint(count) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  return `${n} ${pluralRu(n, 'партия', 'партии', 'партий')}`;
}

/** Итог партии в списке сохранений; без бейджа режима (ADR-013). */
export function runOutcomeLabel(profile) {
  const outcome = profile?.run_outcome || profile?.runOutcome;
  if (outcome === 'victory') return 'Победа';
  if (outcome === 'defeat' || (profile?.is_archived && !profile?.is_active)) return 'Поражение';
  return null;
}
