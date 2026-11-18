import { monthLabel, rub } from '../format.js'

export const QUESTIONS = { overview: 'Как у нас дела в целом?', resilience: 'Хватит ли запаса?', debts: 'Как быстрее закрыть кредиты?', goal: 'Получится ли накопить на цель?', mortgage: 'Потянем ли ипотеку?' }
export function reportDate(value) {
  return value ? new Date(value).toLocaleDateString('ru-RU') : 'Дата неизвестна'
}
export function historyValue(value, unit) {
  if (value == null || !Number.isFinite(value)) return 'Нет данных'
  if (unit === 'rub') return rub(value)
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)}${unit === 'months' ? ' мес.' : ' %'}`
}
export function historyDelta(metric) {
  if (metric.delta == null) return 'Нет сравнения'
  if (metric.delta === 0) return 'Без изменений'
  const amount = metric.unit === 'percent' ? `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(Math.abs(metric.delta))} п. п.` : historyValue(Math.abs(metric.delta), metric.unit)
  return `${metric.delta > 0 ? '+' : '−'}${amount}`
}
export function wideValues(metric) {
  return [metric.before, metric.after].some(value => historyValue(value, metric.unit).length > 13)
}
export function label(checkup, number) {
  return `${reportDate(checkup.completed_at)} · №${number}`
}
export { monthLabel }
