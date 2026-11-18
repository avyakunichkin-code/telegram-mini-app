// Общий HTTP-клиент приложений (SPL-403, ADR-016 п.2): fetch + Bearer + Idempotency-Key + ApiError.
// Без фреймворков и без знания доменов: пути, хранение токена и разбор ошибок задаёт приложение.

export class ApiError extends Error {
  /**
   * @param {{ status: number, code?: string, message?: string, detail?: unknown, raw?: unknown, endpoint?: string, method?: string }} p
   */
  constructor({ status, code = 'error', message = 'Что-то пошло не так', detail, raw, endpoint, method }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
    this.raw = raw
    this.endpoint = endpoint
    this.method = method
  }
}

export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Разбор тела ошибки в `{ code, message, detail }`.
 * Понимает формат Plan `{ error: { code, message } }` и FastAPI `{ detail }` (строка или список `{ msg }`).
 */
export function parseErrorBody(body, fallback = 'Что-то пошло не так') {
  if (body && typeof body === 'object' && body.error && typeof body.error === 'object') {
    return { code: body.error.code || 'error', message: body.error.message || fallback, detail: body.error }
  }
  const detail = body && typeof body === 'object' ? (body.detail ?? body.message) : body
  return { code: 'error', message: detailText(detail, fallback), detail }
}

function detailText(detail, fallback) {
  if (detail == null || detail === '') return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const lines = detail.map((d) => (typeof d === 'string' ? d : d?.msg || d?.message)).filter(Boolean)
    return lines.length ? lines.join(' ') : fallback
  }
  if (typeof detail === 'object') return detail.msg || detail.message || fallback
  return String(detail)
}

/**
 * @param {{
 *   baseUrl?: string,
 *   getToken?: () => string | null,
 *   idempotent?: (method: string, path: string) => boolean,
 *   onNetworkFailure?: () => void,
 *   onNetworkOk?: () => void,
 *   offlineMessage?: string,
 *   fetchImpl?: typeof fetch,
 * }} options
 */
export function createApiClient({
  baseUrl = '',
  getToken = () => null,
  idempotent = () => false,
  onNetworkFailure,
  onNetworkOk,
  offlineMessage = 'Нет связи с сервером',
  fetchImpl,
} = {}) {
  /**
   * @param {string} method
   * @param {string} path
   * @param {unknown} [body]
   * @param {Record<string, string>} [headers] — явный `Idempotency-Key` важнее автоматического
   */
  return async function call(method, path, body, headers = {}) {
    const doFetch = fetchImpl || globalThis.fetch
    const h = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) h.Authorization = `Bearer ${token}`
    if (idempotent(method.toUpperCase(), path.split('?')[0])) h['Idempotency-Key'] = newIdempotencyKey()
    Object.assign(h, headers)

    let res
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        method,
        headers: h,
        body: body === undefined || body === null ? undefined : JSON.stringify(body),
      })
    } catch (err) {
      if (!(err instanceof TypeError)) throw err
      onNetworkFailure?.()
      // status 0 — ответа не было; текст для UI вместо «Failed to fetch»
      throw new ApiError({ status: 0, code: 'offline', message: offlineMessage, endpoint: path, method })
    }
    onNetworkOk?.()

    if (res.status === 204) return null
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await res.json().catch(() => ({})) : await res.text()
    if (!res.ok) {
      const { code, message, detail } = parseErrorBody(data)
      throw new ApiError({ status: res.status, code, message, detail, raw: data, endpoint: path, method })
    }
    return data
  }
}
