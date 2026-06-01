/**
 * Реальный клиент Telegram (есть initData) vs браузер / установленная PWA.
 */
export function isTelegramMiniApp() {
  if (typeof window === 'undefined') return false
  const initData = window.Telegram?.WebApp?.initData
  return typeof initData === 'string' && initData.length > 0
}

/** Standalone: PWA или добавление на домашний экран (не in-app браузер TG). */
export function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}
