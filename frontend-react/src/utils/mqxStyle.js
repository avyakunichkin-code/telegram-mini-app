/**
 * Стиль интерфейса: «ink» — чернильный край (необрутализм A, styles/mqx/ink.css), «classic» — прежний ★ BG.
 * Переключение: ?style=classic или ?style=ink в адресе (до #) — выбор запоминается в localStorage.
 */
const STORAGE_KEY = 'mqx-style';
const STYLES = ['ink', 'classic'];
export const DEFAULT_MQX_STYLE = 'ink';

export function resolveMqxStyle(search, stored) {
  const fromUrl = new URLSearchParams(search || '').get('style');
  if (STYLES.includes(fromUrl)) return { style: fromUrl, persist: true };
  if (STYLES.includes(stored)) return { style: stored, persist: false };
  return { style: DEFAULT_MQX_STYLE, persist: false };
}

export function applyMqxStyle() {
  if (typeof document === 'undefined') return;
  let stored = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch (_) {
    /* приватный режим — без памяти */
  }
  const { style, persist } = resolveMqxStyle(window.location.search, stored);
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, style);
    } catch (_) {
      /* no-op */
    }
  }
  document.documentElement.dataset.mqxStyle = style;
}
