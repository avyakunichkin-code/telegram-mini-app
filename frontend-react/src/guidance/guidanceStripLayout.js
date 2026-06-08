/**
 * Геометрия fixed guidance strip над tab bar (tab bar в потоке, strip — fixed).
 */

export function parseCssPx(value, fallback) {
  const n = parseFloat(String(value || '').trim());
  return Number.isFinite(n) ? n : fallback;
}

export function defaultGuidanceStripBottom(tabInsetPx = 64) {
  return tabInsetPx + 4;
}

export function computeGuidanceScrollPad(stripHeightPx, stripBottomPx, extraPad = 8) {
  const h = Math.max(0, Number(stripHeightPx) || 0);
  const bottom = Math.max(0, Number(stripBottomPx) || 0);
  return `calc(${h}px + ${bottom}px + ${extraPad}px)`;
}
