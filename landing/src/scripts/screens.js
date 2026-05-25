/** База ассетов (GitHub Pages: BASE_PATH=/telegram-mini-app/landing/). */
const assetBase = import.meta.env.BASE_URL || '/';

export function screenPath(id, theme) {
  const base = assetBase.endsWith('/') ? assetBase : `${assetBase}/`;
  return `${base}screens/${id}-${theme}.png`;
}

/**
 * Крупный кроп вертикального скрина: одна PNG, разный фрагмент через object-position.
 * y — % от верха кадра; ratio — ширина/высота окна обрезки.
 */
export const UI_FOCUS = {
  'dashboard.period': { id: 'dashboard', y: '6%', ratio: '1.55', fit: 'cover' },
  'dashboard.cash': { id: 'dashboard', y: '18%', ratio: '1.6', fit: 'cover' },
  'dashboard.goal': { id: 'dashboard', y: '38%', ratio: '1.65', fit: 'cover' },
  'capital.summary': { id: 'capital', y: '8%', ratio: '1.58', fit: 'cover' },
  'capital.invest': { id: 'capital', y: '46%', ratio: '1.55', fit: 'cover' },
  'events.card': { id: 'events', y: '50%', ratio: '1.35', fit: 'cover' },
};

export function themeForSection(onDark) {
  return onDark ? 'light' : 'dark';
}
