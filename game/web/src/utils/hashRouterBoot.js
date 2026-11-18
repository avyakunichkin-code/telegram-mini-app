/**
 * HashRouter не матчит маршруты без #/ — на iOS Safari часто открывают URL без hash (белый экран).
 * Не применять на /landing/ — там свой статический сайт с якорями #how, #faq.
 */

/** @param {string} [pathname] */
export function isLandingPathname(pathname = globalThis.location?.pathname ?? '') {
  return /\/landing(?:\/|$)/i.test(pathname)
}

/** @param {string} [pathname] */
export function isGameShellPathname(pathname = globalThis.location?.pathname ?? '') {
  if (isLandingPathname(pathname)) return false
  const base = (import.meta.env?.BASE_URL || '/telegram-mini-app/').replace(/\/$/, '')
  if (!base) return true
  return (
    pathname === base ||
    pathname === `${base}/` ||
    pathname === `${base}/index.html`
  )
}

export function ensureHashRouterEntry() {
  const loc = globalThis.location
  if (!loc || !isGameShellPathname(loc.pathname)) return
  const hash = loc.hash
  if (!hash || hash === '#') {
    loc.replace(`${loc.pathname}${loc.search}#/`)
  }
}
