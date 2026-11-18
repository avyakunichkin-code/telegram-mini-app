// Чистая логика быстрого старта: отображение сумм и проверка анкеты до отправки.

/** Сумма для поля: разряды через пробел; пусто — нет ответа (виден placeholder), 0 — осознанный ответ. */
export function groupDigits(value) {
  const n = Number(value)
  if (value === '' || value === null || value === undefined || !Number.isFinite(n)) return ''
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** Текст поля → целое число или ''. Копейки отбрасываются, посторонние символы не стирают ввод. */
export function parseMoney(text) {
  const digits = String(text).replace(/[.,].*$/, '').replace(/\D/g, '')
  return digits === '' ? '' : Number(digits)
}

const RANGES = [
  ['income', 'Доход семьи'],
  ['must_expenses', 'Обязательные расходы'],
  ['debt_payments', 'Платежи по кредитам'],
  ['savings', 'Запас на чёрный день'],
]

/** Текст первой проблемы анкеты или null, если можно считать разбор. */
export function quickProblem(answers) {
  const answered = (v) => v?.min !== '' && v?.max !== '' && v?.min !== undefined && v?.max !== undefined
  if (!answered(answers.income)) return 'Укажите доход семьи. Если дохода сейчас нет, введите 0.'
  if (!answered(answers.must_expenses)) return 'Укажите обязательные расходы. Если их нет, введите 0.'
  const reversed = RANGES.find(([key]) => Number(answers[key]?.min) > Number(answers[key]?.max))
  return reversed ? `${reversed[1]}: значение «до» должно быть не меньше «от».` : null
}
