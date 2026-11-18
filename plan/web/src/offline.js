// Only a completed report; no email, token copy or original questionnaire.
export const REPORT_CACHE_KEY = 'plan.last-report.v1'
export const TOKEN_KEY = 'plan.token'

function validArea(area) {
  const fields = {
    budget: ['income', 'outflow', 'free_cashflow'], debts: ['dti_percent', 'total_debt', 'overdue'],
    cushion: ['cushion', 'months', 'target_months'], protection: ['investments'],
  }[area?.key]
  return fields && typeof area.title === 'string' && ['green', 'yellow', 'red'].includes(area.light)
    && fields.every(key => Number.isFinite(area.metrics?.[key]))
    && (area.key !== 'budget' || area.metrics.savings_rate === null || Number.isFinite(area.metrics.savings_rate))
}

function subject(token, now) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')))
    return typeof payload.sub === 'string' && Number.isFinite(payload.exp) && payload.exp * 1000 > now ? payload.sub : null
  } catch { return null }
}

export function validSnapshot(value) {
  const r = value?.report, c = value?.checkup
  return value?.version === 1 && typeof value.ownerId === 'string' && typeof value.session === 'string'
    && Number.isFinite(Date.parse(value.savedAt)) && c?.status === 'completed'
    && Number.isFinite(Date.parse(c.completed_at)) && Number.isFinite(c.offline_starting)
    && r?.final === true && r.checkup_id === c.id && r.as_of === c.as_of
    && /^\d{4}-(0[1-9]|1[0-2])$/.test(r.as_of)
    && ['draft', 'approximate', 'refined'].includes(r.precision)
    && Number.isFinite(r.free_cashflow) && Number.isFinite(r.net_worth)
    && Number.isFinite(r.metrics_base?.outflow) && typeof r.entry_answer?.text === 'string'
    && Array.isArray(r.areas) && ['budget', 'debts', 'cushion', 'protection'].every(key => r.areas.some(a => a.key === key && validArea(a)))
    && ['base', 'pessimistic'].every(key => Array.isArray(r.forecast?.[key]) && r.forecast[key].length && r.forecast[key].every(p => Number.isFinite(p.liquid)))
    && Array.isArray(r.steps) && Array.isArray(r.scenarios) && Array.isArray(r.goals) && !!r.debt_strategy
}

export function createReportCache({ storage = () => globalThis.localStorage, token = () => storage().getItem(TOKEN_KEY), crypto = globalThis.crypto, now = () => Date.now() } = {}) {
  let epoch = 0, queue = Promise.resolve()
  const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('')
  function clear() {
    epoch++
    try { storage().removeItem(REPORT_CACHE_KEY) } catch { /* Storage may be denied. */ }
  }
  async function load() {
    const startedEpoch = epoch
    try {
      await queue.catch(() => false)
      const current = token(), owner = subject(current, now())
      if (!owner) { clear(); return null }
      const raw = storage().getItem(REPORT_CACHE_KEY)
      if (!raw) return null
      const value = JSON.parse(raw), session = await hash(current)
      if (startedEpoch !== epoch || token() !== current) return null
      if (!validSnapshot(value) || value.ownerId !== owner || value.session !== session) { clear(); return null }
      return value
    } catch { clear(); return null }
  }
  function save(ownerId, checkup, report) {
    const startedEpoch = epoch
    let current
    try { current = token() } catch { return Promise.resolve(false) }
    queue = queue.catch(() => false).then(async () => {
      try {
        if (subject(current, now()) !== ownerId || !report?.final || checkup?.status !== 'completed') return false
        const starting = checkup.offline_starting ?? (checkup.data?.savings || []).filter(s => s.is_safety_fund || s.kind !== 'deposit').reduce((sum, s) => sum + (Number(s.amount.min) + Number(s.amount.max)) / 2, 0)
        const value = { version: 1, ownerId, session: await hash(current), savedAt: new Date(now()).toISOString(),
          checkup: { id: checkup.id, status: 'completed', as_of: checkup.as_of, completed_at: checkup.completed_at, offline_starting: starting, data: { incomes: [], savings: [] } }, report }
        if (!validSnapshot(value) || startedEpoch !== epoch || token() !== current) return false
        let previous
        try { previous = JSON.parse(storage().getItem(REPORT_CACHE_KEY)) } catch { /* Replace corrupt data. */ }
        if (validSnapshot(previous) && previous.session === value.session && Date.parse(previous.checkup.completed_at) > Date.parse(value.checkup.completed_at)) return false
        storage().setItem(REPORT_CACHE_KEY, JSON.stringify(value))
        return true
      } catch { return false }
    })
    return queue
  }
  return { load, save, clear }
}

export const reportCache = createReportCache()
