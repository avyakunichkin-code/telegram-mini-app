/**
 * Подписка на возврат приложения на передний план (TMA / PWA / браузер).
 * @param {(meta: { source: string }) => void} onForeground
 * @returns {() => void} unsubscribe
 */
export function subscribeAppForeground(onForeground) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  const emit = (source) => {
    if (document.visibilityState === 'hidden') return;
    onForeground({ source });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      emit('visibility');
    }
  };

  const onWindowFocus = () => emit('focus');

  const onPageShow = (event) => {
    if (event.persisted) {
      emit('pageshow-bfcache');
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onWindowFocus);
  window.addEventListener('pageshow', onPageShow);

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onWindowFocus);
    window.removeEventListener('pageshow', onPageShow);
  };
}

/** Debounce для серии focus + visibility при одном возврате. */
export function debounceForeground(handler, delayMs = 400) {
  let timerId = null;
  return (meta) => {
    if (timerId != null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      handler(meta);
    }, delayMs);
  };
}
