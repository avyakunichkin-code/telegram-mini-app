/**
 * Статус сети для UI. Состояние игры живёт на сервере, поэтому офлайн = «смотреть можно, ходить нельзя».
 * navigator.onLine врёт (Wi-Fi без интернета, VPN), поэтому офлайн ставит и неудачный fetch,
 * а снимает любой ответ сервера или событие `online`.
 */

export const OFFLINE_COPY = 'Нет сети. Прогресс сохранён на сервере — продолжишь, когда связь вернётся.';
export const BACK_ONLINE_COPY = 'Связь вернулась';

export function createNetworkStatus(initialOnline = true) {
  let offline = !initialOnline;
  const listeners = new Set();

  const set = (next) => {
    if (next === offline) return;
    offline = next;
    for (const l of listeners) l(offline);
  };

  return {
    isOffline: () => offline,
    markFailure: () => set(true),
    markOk: () => set(false),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** fetch бросает TypeError, когда ответа нет вовсе (сеть, DNS, CORS-обрыв) — не путать с HTTP-ошибкой. */
export function isNetworkFailure(err) {
  return err instanceof TypeError;
}

const hasWindow = typeof window !== 'undefined';
export const networkStatus = createNetworkStatus(
  typeof navigator === 'undefined' || navigator.onLine !== false,
);

if (hasWindow) {
  window.addEventListener('offline', () => networkStatus.markFailure());
  window.addEventListener('online', () => networkStatus.markOk());
}
