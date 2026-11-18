import { showNotification } from '../components/notifications';
import { createPwaUpdateGate } from './pwaUpdateGate';

/** Интервал фоновой проверки новой версии SW (GitHub Pages + standalone PWA). */
const UPDATE_INTERVAL_MS = 30 * 60 * 1000;

export const PWA_UPDATE_WAITING_COPY = 'Доступна новая версия — обновится после хода';

/** Подставляется после регистрации SW; gate один на вкладку, чтобы не терять safe zone до неё. */
let updateSW = () => {};
const gate = createPwaUpdateGate({
  apply: () => updateSW(true),
  notify: () => showNotification(PWA_UPDATE_WAITING_COPY, 'info', { ttlMs: 4000 }),
});

/** Меню / экраны до партии — обновление можно ставить без ожидания хода. */
export function setPwaUpdateSafeZone(isSafe) {
  gate.setSafeZone(isSafe);
}

/** Вызывать, когда игрок закрыл итоги хода. */
export function applyPwaUpdateAtTurnBoundary() {
  gate.turnBoundary();
}

/**
 * Регистрация PWA (registerType: 'prompt' в vite.config.js):
 * - проверка новой версии при возврате в приложение и периодически в фоне;
 * - новая версия ждёт безопасного момента (pwaUpdateGate.js), затем updateSW(true) → reload.
 */
export function registerPwaUpdates() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  import('virtual:pwa-register').then(({ registerSW }) => {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        gate.needRefresh();
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        const checkForUpdate = () => {
          registration.update().catch(() => {});
        };

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate();
        });
        window.addEventListener('focus', checkForUpdate);
        window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
      },
    });
  });
}
