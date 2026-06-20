/** Интервал фоновой проверки новой версии SW (GitHub Pages + standalone PWA). */
const UPDATE_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Регистрация PWA с агрессивной проверкой обновлений:
 * - при возврате в приложение (visibility/focus);
 * - периодически в фоне;
 * - reload после активации нового SW (controllerchange).
 *
 * Работает вместе с registerType: 'autoUpdate' в vite.config.js.
 */
export function registerPwaUpdates() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
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
