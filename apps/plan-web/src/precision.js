// UI estimate of adapter.precision. The saved report remains server-owned.
export const PRECISION_SECTIONS = ['incomes', 'expenses', 'savings', 'liabilities']
export const PRECISION_LABELS = { empty: 'Нет сумм для оценки', invalid: 'Проверьте ввод', draft: 'Черновые данные', approximate: 'Приблизительные данные', refined: 'Уточнённые данные' }

export function amount(value) {
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'string' && value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function rangeState(value) {
  const min = amount(value?.min), max = amount(value?.max)
  const valid = min !== null && max !== null && max >= min
  return { min, max, valid, broad: valid && max > 0 && (min === 0 || max / min > 3) }
}

export function analyzePrecision(data) {
  let total = 0, exact = 0, invalid = false
  const sections = PRECISION_SECTIONS.map(key => {
    let weight = 0, uncertain = 0
    for (const row of data?.[key] || []) {
      let sum, precise
      if (key === 'liabilities') {
        sum = amount(row.monthly_payment)
        if (sum === null) { invalid = true; continue }
        precise = !row.estimated
      } else {
        const range = rangeState(row.amount)
        if (!range.valid) { invalid = true; continue }
        sum = range.max
        precise = range.min > 0 && sum / range.min <= 1.1
      }
      if (sum <= 0) continue
      weight += sum
      if (!precise) uncertain += sum
    }
    total += weight; exact += weight - uncertain
    return { key, weight, uncertain }
  })
  const share = total > 0 ? exact / total : 0
  const candidate = invalid ? null : sections.reduce((best, section) => section.uncertain > (best?.uncertain || 0) ? section : best, null)?.key || null
  return { share, total, sections, candidate, invalid, level: invalid ? 'invalid' : total === 0 ? 'empty' : share >= .85 ? 'refined' : share >= .5 ? 'approximate' : 'draft' }
}

// A title/member/payment edit is not evidence that an inferred balance/rate is known.
export function estimatedAfterEdit(row, patch, fields) {
  if (!row.estimated) return false
  const next = { ...row, ...patch }
  return !(fields.has('balance') && fields.has('annual_rate') && amount(next.balance) !== null && amount(next.annual_rate) !== null)
}

export function invalidNumericField(meta, rows) {
  for (const row of rows) for (const field of meta.fields) {
    if (field.type === 'range' && !rangeState(row[field.key]).valid) return field.label
    if (['money', 'number', 'int'].includes(field.type)) {
      const raw = row[field.key]
      if (field.optional && (raw === null || raw === undefined || raw === '')) continue
      const value = amount(raw)
      if (value === null || field.type === 'int' && !Number.isInteger(value)) return field.label
    }
  }
  return null
}
