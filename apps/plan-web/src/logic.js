// Чистая логика экранов plan-web — без React, тестируется `node --test` (P3-14).
import { SECTIONS } from './sections.js'
import { pct, plural, rub } from './format.js'

// Те же пороги, что в plan_api/analysis/config.py (PRECISION_*): точность считаем одинаково на сервере и в мастере
export const PRECISION_EXACT_RATIO = 1.1
export const PRECISION_APPROX = 0.5
export const PRECISION_REFINED = 0.85
// spec §Rules: max / min > 3 — предупреждение в UI, не ошибка
export const WIDE_RANGE_RATIO = 3

export function toNum(s) {
  const cleaned = String(s).replace(/\s/g, '').replace(',', '.')
  if (cleaned === '') return ''
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : ''
}

/** Строка раздела → тело для PUT: диапазоны и числа приводятся, пустое необязательное — null. */
export function normalizeRow(section, row) {
  const out = { ...row }
  for (const f of SECTIONS[section].fields) {
    const v = out[f.key]
    if (f.type === 'range') out[f.key] = { min: Number(v?.min) || 0, max: Number(v?.max) || 0 }
    else if (['money', 'number', 'int'].includes(f.type)) out[f.key] = v === null || v === '' ? (f.optional ? null : 0) : Number(v)
  }
  if (section === 'expenses' && !out.category_key) out.category_key = 'other'
  return out
}

/** Вилка слишком широкая: «от 50 до 200 тыс.» ещё допустимо, но разбор будет грубым. */
export function isWideRange(v) {
  const lo = Number(v?.min) || 0
  const hi = Number(v?.max) || 0
  return lo > 0 && hi / lo > WIDE_RANGE_RATIO
}

const RANGE_SECTIONS = ['incomes', 'expenses', 'savings']

/**
 * Точность ввода как на сервере (adapter.precision): доля «точных» сумм, взвешенная по сумме,
 * плюс неточный вес по разделам — чтобы подсказать, что уточнить первым.
 */
export function precisionOf(data) {
  let total = 0
  let exact = 0
  const loose = {}
  for (const section of RANGE_SECTIONS) {
    for (const row of data?.[section] || []) {
      const lo = Number(row.amount?.min) || 0
      const hi = Number(row.amount?.max) || 0
      if (hi <= 0) continue
      total += hi
      if (lo > 0 && hi / lo <= PRECISION_EXACT_RATIO) exact += hi
      else loose[section] = (loose[section] || 0) + hi
    }
  }
  for (const li of data?.liabilities || []) {
    const pay = Number(li.monthly_payment) || 0
    total += pay
    if (li.estimated) loose.liabilities = (loose.liabilities || 0) + pay
    else exact += pay
  }
  const share = total > 0 ? exact / total : 0
  const level = share >= PRECISION_REFINED ? 'refined' : share >= PRECISION_APPROX ? 'approximate' : 'draft'
  const [worst] = Object.entries(loose).sort((a, b) => b[1] - a[1])
  return { share, level, worst: worst ? worst[0] : null }
}

/** «Что уточнить, чтобы точность выросла» — раздел с наибольшим неточным весом. */
export function precisionTip(data) {
  const { worst } = precisionOf(data)
  if (!worst) return null
  const title = SECTIONS[worst]?.title || worst
  return worst === 'liabilities'
    ? `Уточните «${title}»: остаток долга оценён по платежу — это больше всего снижает точность.`
    : `Уточните «${title}»: здесь самые широкие вилки — точность вырастет сильнее всего.`
}

/** Главная цифра плитки-ответа — своя для каждого вопроса со входа. */
export function heroFor(ea) {
  const n = ea.numbers || {}
  if (n.dti_after !== undefined && n.dti_after !== null) return [Math.round(n.dti_after), ['% дохода', 'уйдёт на платежи']]
  if (n.current?.months) return [n.current.months, [plural(n.current.months, 'месяц', 'месяца', 'месяцев'), 'до закрытия кредитов']]
  if ('months_until_negative' in n) {
    return n.months_until_negative
      ? [n.months_until_negative, [plural(n.months_until_negative, 'месяц', 'месяца', 'месяцев'), 'продержитесь']]
      : ['12+', ['месяцев', 'бюджет выдерживает']]
  }
  if ('green' in n) return [n.green, ['из 4 областей', 'в порядке']]
  return null
}

/** Плитка светофора наверху отчёта (★ C2): одна главная цифра области и подпись. */
export function areaSummary(area) {
  const m = area.metrics
  switch (area.key) {
    case 'budget':
      return m.savings_rate === null ? ['—', 'нет дохода'] : [pct(m.savings_rate), 'норма сбережений']
    case 'debts':
      return m.overdue > 0 ? [`${m.dti_percent.toFixed(0)} %`, `просрочка ${rub(m.overdue)}`] : [`${m.dti_percent.toFixed(0)} %`, 'платежи от дохода']
    case 'cushion':
      return [`${m.months.toFixed(1).replace('.', ',')} мес.`, `цель ${m.target_months} мес.`]
    default: {
      const n = area.flags?.length || 0
      return n ? [`${n} ${plural(n, 'флаг', 'флага', 'флагов')}`, area.flags[0].text] : ['в порядке', 'пробелов не видно']
    }
  }
}

/** Выделенный шаг — первый ещё не сделанный и не отклонённый. */
export function nextStep(steps) {
  return steps.find((s) => s.status === 'suggested') || null
}

// ── ★ Повторный чекап (recheck-round R2 + G2, утверждено 2026-11-02) ──

const STEP_STATUS = { done: ['сделано', 'st-done'], suggested: ['в работе', 'st-open'], dismissed: ['не подошло', 'st-no'] }

/** Подпись и класс статуса прошлого шага. */
export function stepStatus(status) {
  return STEP_STATUS[status] || STEP_STATUS.suggested
}

const comma1 = (v) => v.toFixed(1).replace('.', ',')
const thousands = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.round(Math.abs(v) / 1000)}`

/** Плитка «С прошлого раза»: три метрики было → стало. Нет значения — «—». */
export function previousCells(prev) {
  const m = prev?.metrics || {}
  const pair = (key, fmt) => {
    const { before, now } = m[key] || {}
    return [before, now].map((v) => (v === null || v === undefined ? '—' : fmt(v))).join(' → ')
  }
  return [
    { label: 'Подушка', value: pair('cushion_months', comma1), unit: 'мес.' },
    { label: 'Платежи', value: `${pair('dti_percent', (v) => v.toFixed(0))} %`, unit: 'от дохода' },
    { label: 'Остаётся', value: pair('free_cashflow', thousands), unit: 'тыс. ₽/мес' },
  ]
}

/** Полоска цели: сколько накоплено сейчас и где были в прошлый раз, в % от суммы цели. */
export function goalBar(goal) {
  const target = Number(goal.target_amount) || 0
  const share = (v) => (target > 0 ? Math.max(0, Math.min(100, (v / target) * 100)) : 0)
  const before = goal.progress ? share(goal.progress.saved_before) : null
  return { now: share(Number(goal.saved_amount) || 0), before }
}
