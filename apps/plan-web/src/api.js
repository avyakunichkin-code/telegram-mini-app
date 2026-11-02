// Клиент plan-api поверх общего @tvoy/api-client (SPL-403). Формат ошибок: { error: { code, message } }.
import { createApiClient } from '@tvoy/api-client'

const TOKEN_KEY = 'plan.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* приватный режим: живём без сохранения сессии */
  }
}

export { ApiError } from '@tvoy/api-client'

const call = createApiClient({ getToken })

export const api = {
  meta: () => call('GET', '/api/meta'),
  requestCode: (email) => call('POST', '/api/auth/email/request-code', { email }),
  verify: (email, code, consentVersion) =>
    call('POST', '/api/auth/email/verify', { email, code, consent_version: consentVersion }),
  me: () => call('GET', '/api/me'),
  deleteMe: () => call('DELETE', '/api/me'),
  putMembers: (members) => call('PUT', '/api/household/members', members),
  createCheckup: (entryQuestion) => call('POST', '/api/checkups', { entry_question: entryQuestion }),
  listCheckups: () => call('GET', '/api/checkups'),
  getCheckup: (id) => call('GET', `/api/checkups/${id}`),
  quick: (id, answers) => call('POST', `/api/checkups/${id}/quick`, answers),
  putSection: (id, section, rows) => call('PUT', `/api/checkups/${id}/sections/${section}`, rows),
  demo: (id) => call('POST', `/api/checkups/${id}/demo`),
  report: (id) => call('GET', `/api/checkups/${id}/report`),
  complete: (id) =>
    call('POST', `/api/checkups/${id}/complete`, undefined, { 'Idempotency-Key': `complete-${id}` }),
  patchStep: (id, status) => call('PATCH', `/api/steps/${id}`, { status }),
}
