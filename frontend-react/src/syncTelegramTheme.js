/**
 * Прокидывает themeParams клиента Telegram в CSS-переменные колонки #root.
 * Смешивается с палитрой ТВОЙ ХОД в index.css через color-mix.
 */
function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 6) return `#${h}`;
  if (h.length === 3) {
    const e = [...h].map((c) => c + c).join('');
    return `#${e}`;
  }
  return null;
}

export function syncTelegramThemeToRoot() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const rootEl = typeof document !== 'undefined' ? document.getElementById('root') : null;
  if (!tg || !rootEl || !tg.themeParams) return;

  try {
    tg.ready?.();
  } catch (_) {
    /* no-op */
  }

  const p = tg.themeParams;
  const set = (cssVar, value) => {
    const hex = normalizeHex(value);
    if (hex) rootEl.style.setProperty(cssVar, hex);
  };

  set('--tg-theme-bg-color', p.bg_color);
  set('--tg-theme-text-color', p.text_color);
  set('--tg-theme-hint-color', p.hint_color);
  // В TMA мы оставляем фон/текст из темы Telegram, но CTA/акцент фиксируем брендом ТВОЙ ХОД.
  // Это убирает конфликт «голубые кнопки + фиолетовое меню».
  rootEl.style.setProperty('--tg-theme-link-color', '#5B21B6');
  rootEl.style.setProperty('--tg-theme-button-color', '#6D28D9');
  rootEl.style.setProperty('--tg-theme-accent-text-color', '#6D28D9');
  set('--tg-theme-button-text-color', p.button_text_color);
  set('--tg-theme-secondary-bg-color', p.secondary_bg_color);

  try {
    const again = () => syncTelegramThemeToRoot();
    if (typeof tg.onEvent === 'function') {
      tg.onEvent('themeChanged', again);
      tg.onEvent('theme_changed', again);
    } else if (typeof tg.onThemeChanged === 'function') {
      tg.onThemeChanged(again);
    }
  } catch (_) {
    /* no-op */
  }
}
