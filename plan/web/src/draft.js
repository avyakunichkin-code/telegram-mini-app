export const DRAFT_KEY = 'plan.unsaved-section.v1'
const TTL = 24 * 60 * 60 * 1000
const sections = ['incomes','expenses','liabilities','savings','assets','investments','pension','insurance','goals','decision']
export function createDraftCache({ storage = () => globalThis.sessionStorage, token = () => globalThis.localStorage.getItem('plan.token'), crypto = globalThis.crypto, now = () => Date.now() } = {}) {
  let epoch = 0, queue = Promise.resolve()
  const fingerprint = async value => {
    const payload = JSON.parse(atob(value.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')))
    if (!payload.sub || !(payload.exp * 1000 > now())) throw Error('Expired session')
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), x => x.toString(16).padStart(2, '0')).join('')
  }
  function clear() { epoch++; try { storage().removeItem(DRAFT_KEY) } catch { /* unavailable storage */ } }
  function save(checkup, active, rows, fields = []) {
    const started = epoch
    let session
    try { session = token() } catch { return Promise.resolve(false) }
    queue = queue.catch(() => false).then(async () => {
      try {
        if (!session || checkup.status !== 'draft' || !sections.includes(active)) return false
        const binding = await fingerprint(session)
        if (started !== epoch || session !== token()) return false
        storage().setItem(DRAFT_KEY, JSON.stringify({ version: 1, binding, id: checkup.id, active, baseline: checkup.data[active] || [], rows, fields, at: now() }))
        return true
      } catch { return false }
    })
    return queue
  }
  async function load(checkup) {
    const started = epoch
    try {
      const session = token()
      await queue
      const value = JSON.parse(storage().getItem(DRAFT_KEY) || 'null')
      if (!value) return null
      const binding = await fingerprint(session)
      if (started !== epoch || token() !== session) return null
      const validRows = rows => Array.isArray(rows) && rows.length <= 50 && rows.every(row => row && typeof row === 'object' && !Array.isArray(row))
      const validFields = Array.isArray(value.fields) && value.fields.every(entry => Array.isArray(entry) && entry.length === 2 && Number.isInteger(entry[0]) && entry[0] >= 0 && Array.isArray(entry[1]) && entry[1].every(key => typeof key === 'string'))
      if (checkup.status !== 'draft' || value.version !== 1 || value.id !== checkup.id || value.binding !== binding || !sections.includes(value.active) || !validRows(value.rows) || !validRows(value.baseline) || !validFields || !Number.isFinite(value.at) || now() - value.at > TTL || value.at > now()) { clear(); return null }
      return { ...value, conflict: JSON.stringify(value.baseline) !== JSON.stringify(checkup.data[value.active] || []) }
    } catch { clear(); return null }
  }
  return { clear, save, load }
}
export const draftCache = createDraftCache()
