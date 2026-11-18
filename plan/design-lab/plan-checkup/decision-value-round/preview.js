const $ = id => document.getElementById(id)
let panel = 'sensitivity'
const rub = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽'
function render() {
  const variant = $('variant').value, state = $('state').value
  document.body.classList.toggle('wizard', variant === 'B')
  $('variant-title').textContent = variant === 'A' ? 'А · Рядом с решением' : 'Б · Мастер проверки'
  $('steps').hidden = variant !== 'B'
  $('content').hidden = state === 'empty' || state === 'loading'
  $('notice').textContent = { ready: '', loading: 'Проверяем данные…', empty: 'Нет сумм для сравнения. Сначала заполните доходы и обязательные расходы.', error: 'Не удалось пересчитать. Ввод сохранён на экране; показан предыдущий пример.', offline: 'Нет сети. Показан последний пример. Новый расчёт недоступен.' }[state]
  document.querySelectorAll('.panel').forEach(el => { el.hidden = variant === 'B' && el.id !== panel })
  document.querySelectorAll('[data-panel]').forEach(el => el.setAttribute('aria-current', el.dataset.panel === panel ? 'step' : 'false'))
  document.querySelectorAll('#content input, #content button').forEach(el => { el.disabled = state !== 'ready' })
}
$('variant').onchange = render
$('state').onchange = render
document.querySelectorAll('[data-panel]').forEach(el => el.onclick = () => { panel = el.dataset.panel; render() })
$('discard').onclick = () => { document.querySelector('.resume').hidden = true }
$('clarify').onclick = () => { $('income-editor').hidden = false; $('income').focus(); income() }
function income() {
  const raw = $('income').value, n = Number(raw)
  $('income-result').textContent = raw === '' || !Number.isFinite(n) || n < 0 ? 'Введите доход не меньше нуля.' : `При таком доходе месячный остаток: ${rub(n - 95000)}. Это пример; чекап не изменён.`
}
$('income').oninput = income
function scenario() {
  const raw = $('contribution').value, n = Number(raw), valid = raw !== '' && Number.isFinite(n) && n >= 0
  $('available').textContent = valid ? rub(10000 - n) : '—'
  $('reserve').textContent = valid && n <= 10000 ? '+' + rub(n) : '—'
  $('scenario-note').textContent = !valid ? 'Введите сумму не меньше нуля.' : n > 10000 ? 'Для такого перевода не хватает свободных денег. Пополнение не выполнено.' : 'Перевод не увеличивает общую сумму ваших денег.'
}
$('contribution').oninput = scenario
$('reset').onclick = () => { $('contribution').value = '0'; scenario() }
$('done').onchange = () => { $('action-result').textContent = $('done').checked ? 'Проверка отмечена. Изменение денег подтвердится только новыми данными.' : 'Ожидаемый результат: понять, какую сумму можно регулярно откладывать.' }
render()
