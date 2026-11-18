export function rub(value, { sign = false } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const n = Math.round(value)
  const s = Math.abs(n).toLocaleString('ru-RU')
  const prefix = n < 0 ? '−' : sign && n > 0 ? '+' : ''
  // Неразрывный пробел перед ₽: разряды toLocaleString уже неразрывные, знак рубля тоже не отрываем
  return `${prefix}${s}\u00a0₽`
}

export function pct(value, digits = 0) {
  if (value === null || value === undefined) return '—'
  return `${(value * 100).toFixed(digits)} %`
}

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

export function monthLabel(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}
