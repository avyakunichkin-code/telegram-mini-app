// Разделы мастера уточнения: поля строки и пустая строка. Порядок задаёт вопрос со входа.

export const SECTIONS = {
  incomes: {
    title: 'Доходы',
    lead: 'Деньги на руки в месяц: зарплата, подработка, пособия, аренда.',
    empty: (members) => ({ member_id: members[0]?.id, kind: 'salary', amount: { min: 0, max: 0 } }),
    fields: [
      { key: 'member_id', label: 'Чей', type: 'member', adultsOnly: true },
      { key: 'kind', label: 'Вид', type: 'select', options: [['salary', 'Зарплата'], ['self_employed', 'Своё дело'], ['pension', 'Пенсия'], ['benefit', 'Пособие'], ['rent', 'Аренда'], ['other', 'Другое']] },
      { key: 'amount', label: 'Сумма в месяц', type: 'range' },
    ],
  },
  expenses: {
    title: 'Расходы',
    lead: 'Сколько уходит в месяц. «Обязательные» — то, без чего не обойтись.',
    empty: () => ({ category_key: 'other', title: '', tier: 'must', amount: { min: 0, max: 0 } }),
    fields: [
      { key: 'title', label: 'Статья', type: 'text', placeholder: 'Продукты' },
      { key: 'tier', label: 'Тип', type: 'select', options: [['must', 'Обязательные'], ['want', 'По желанию']] },
      { key: 'amount', label: 'В месяц', type: 'range' },
    ],
  },
  liabilities: {
    title: 'Кредиты и долги',
    lead: 'Ипотека, кредиты, карты, займы. Остаток, ставка и ежемесячный платёж.',
    empty: () => ({ kind: 'consumer', title: 'Кредит', balance: 0, annual_rate: 0, monthly_payment: 0, term_months_left: null, overdue_amount: 0, member_id: null }),
    fields: [
      { key: 'title', label: 'Название', type: 'text' },
      { key: 'kind', label: 'Вид', type: 'select', options: [['mortgage', 'Ипотека'], ['consumer', 'Потребкредит'], ['card', 'Кредитная карта'], ['car', 'Автокредит'], ['microloan', 'Микрозайм'], ['private', 'Частный долг']] },
      { key: 'member_id', label: 'Чей', type: 'member', adultsOnly: true, allowShared: true },
      { key: 'balance', label: 'Остаток долга, ₽', type: 'money' },
      { key: 'annual_rate', label: 'Ставка, % годовых', type: 'number' },
      { key: 'monthly_payment', label: 'Платёж в месяц, ₽', type: 'money' },
      { key: 'term_months_left', label: 'Осталось месяцев', type: 'int', optional: true, hint: 'Пусто — для карт и займов без срока' },
      { key: 'overdue_amount', label: 'Просрочка, ₽', type: 'money' },
    ],
  },
  savings: {
    title: 'Накопления и подушка',
    lead: 'Деньги на счетах и вкладах. Подушка — то, что отложено на чёрный день.',
    empty: () => ({ kind: 'account', amount: { min: 0, max: 0 }, annual_rate: 0, is_safety_fund: false, member_id: null }),
    fields: [
      { key: 'kind', label: 'Где', type: 'select', options: [['cash', 'Наличные'], ['account', 'Счёт / карта'], ['deposit', 'Вклад']] },
      { key: 'amount', label: 'Сумма', type: 'range' },
      { key: 'annual_rate', label: 'Ставка, %', type: 'number' },
      { key: 'is_safety_fund', label: 'Это подушка безопасности', type: 'bool' },
    ],
  },
  goals: {
    title: 'Цели',
    lead: 'На что копите и к какому сроку.',
    empty: () => ({ title: '', target_amount: 0, target_month: '', saved_amount: 0, priority: 1 }),
    fields: [
      { key: 'title', label: 'Цель', type: 'text', placeholder: 'Отпуск, ремонт, машина' },
      { key: 'target_amount', label: 'Сколько нужно, ₽', type: 'money' },
      { key: 'saved_amount', label: 'Уже отложено, ₽', type: 'money' },
      { key: 'target_month', label: 'К какому месяцу', type: 'month' },
      { key: 'priority', label: 'Приоритет (1 — главная)', type: 'int' },
    ],
  },
  decision: {
    title: 'Ваше решение',
    lead: 'Параметры ипотеки или крупного кредита, который обдумываете.',
    single: true,
    empty: () => ({ price: 0, down_payment: 0, annual_rate: 0, term_months: 240 }),
    fields: [
      { key: 'price', label: 'Стоимость покупки, ₽', type: 'money' },
      { key: 'down_payment', label: 'Первый взнос, ₽', type: 'money' },
      { key: 'annual_rate', label: 'Ставка, % годовых', type: 'number' },
      { key: 'term_months', label: 'Срок, месяцев', type: 'int' },
    ],
  },
  assets: {
    title: 'Имущество',
    lead: 'Квартира, машина, дача — сколько стоит и сколько стоит содержать.',
    empty: () => ({ kind: 'home', title: '', value: 0, monthly_maintenance: 0, monthly_income: 0 }),
    fields: [
      { key: 'title', label: 'Что', type: 'text' },
      { key: 'kind', label: 'Вид', type: 'select', options: [['home', 'Жильё'], ['car', 'Машина'], ['land', 'Участок'], ['other', 'Другое']] },
      { key: 'value', label: 'Стоимость, ₽', type: 'money' },
      { key: 'monthly_maintenance', label: 'Содержание в месяц, ₽', type: 'money' },
      { key: 'monthly_income', label: 'Доход в месяц (аренда), ₽', type: 'money' },
    ],
  },
  investments: {
    title: 'Вложения',
    lead: 'Только по классам активов — без названий бумаг.',
    empty: () => ({ asset_class: 'funds', amount: 0, liquidity: 'days', member_id: null }),
    fields: [
      { key: 'asset_class', label: 'Класс', type: 'select', options: [['bonds', 'Облигации'], ['stocks', 'Акции'], ['funds', 'Фонды'], ['deposits_long', 'Долгие вклады'], ['real_estate_invest', 'Недвижимость для дохода'], ['crypto', 'Криптовалюта'], ['other', 'Другое']] },
      { key: 'amount', label: 'Сумма, ₽', type: 'money' },
      { key: 'liquidity', label: 'Как быстро забрать', type: 'select', options: [['days', 'За дни'], ['months', 'За месяцы'], ['years', 'Через годы']] },
    ],
  },
  insurance: {
    title: 'Страховки',
    lead: 'Какие полисы есть сейчас.',
    empty: () => ({ kind: 'life', monthly_premium: 0, coverage: 0, member_id: null }),
    fields: [
      { key: 'kind', label: 'Вид', type: 'select', options: [['life', 'Жизнь'], ['health', 'Здоровье'], ['property', 'Имущество'], ['mortgage_title', 'Титул (ипотека)'], ['car', 'Авто']] },
      { key: 'monthly_premium', label: 'Взнос в месяц, ₽', type: 'money' },
      { key: 'coverage', label: 'Покрытие, ₽', type: 'money' },
    ],
  },
  pension: {
    title: 'Пенсия',
    lead: 'Есть ли накопления на пенсию у взрослых.',
    empty: (members) => ({ member_id: members.find((m) => m.role === 'adult')?.id, savings_amount: 0, has_voluntary_program: false }),
    fields: [
      { key: 'member_id', label: 'Кто', type: 'member', adultsOnly: true },
      { key: 'savings_amount', label: 'Накоплено, ₽', type: 'money' },
      { key: 'has_voluntary_program', label: 'Участвует в добровольной программе', type: 'bool' },
    ],
  },
}

const BASE = ['incomes', 'expenses', 'liabilities', 'savings', 'goals', 'assets', 'investments', 'insurance', 'pension']

export function sectionOrder(question) {
  const first = {
    mortgage: ['decision', 'incomes', 'liabilities', 'savings'],
    debts: ['liabilities', 'incomes', 'expenses'],
    resilience: ['incomes', 'expenses', 'savings', 'insurance'],
    goal: ['goals', 'incomes', 'expenses', 'savings'],
    overview: [],
  }[question] || []
  const all = question === 'mortgage' ? [...BASE, 'decision'] : BASE
  return [...first, ...all.filter((s) => !first.includes(s))]
}
