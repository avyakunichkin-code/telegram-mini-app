/**
 * Геометрия fixed guidance strip над tab bar (tab bar в потоке, strip — fixed).
 */

export function parseCssPx(value, fallback) {
  const n = parseFloat(String(value || '').trim());
  return Number.isFinite(n) ? n : fallback;
}

/** Отступ fixed strip от низа viewport (над tab bar). */
export function defaultGuidanceStripBottom(tabInsetPx = 64) {
  return Math.max(0, Number(tabInsetPx) || 0);
}

/**
 * Нижний padding скролла: только высота strip (+ зазор).
 * Tab bar вне scroll-контейнера — не добавляем его сюда.
 */
export function computeGuidanceScrollPad(stripHeightPx, extraPad = 12) {
  const h = Math.max(0, Number(stripHeightPx) || 0);
  const pad = Math.max(0, Number(extraPad) || 0);
  return `calc(${h}px + ${pad}px)`;
}

/** bottom для sheet над strip + tab bar (portal). */
export function computeGuidanceSheetLift(stripHeightPx, tabInsetPx, extraPad = 4) {
  const h = Math.max(0, Number(stripHeightPx) || 0);
  const tab = Math.max(0, Number(tabInsetPx) || 0);
  const pad = Math.max(0, Number(extraPad) || 0);
  return `calc(${h}px + ${tab}px + ${pad}px)`;
}
