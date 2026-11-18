const titles = ['Выбрать отдельный счёт для резерва', 'Самостоятельно перевести 15 000 ₽', 'Проверить, что деньги зачислены']
const models = {}
let state = 'ready'
let count = 3
let generation = 0
function init() {
  generation++
  for (const key of ['A', 'B']) models[key] = { checked: Array.from({ length: count }, (_, i) => state === 'done' || (['partial', 'saving', 'error'].includes(state) && i === 0)), status: state === 'manual' || state === 'done' ? 'done' : state === 'dismissed' ? 'dismissed' : 'suggested', busy: false, error: state === 'error', pending: null }
  render()
}
function render() {
  document.querySelector('#variants').innerHTML = ['A', 'B'].map(key => {
    const m = models[key], n = m.checked.filter(Boolean).length
    const busy = m.busy || state === 'saving', locked = busy || ['loading', 'offline'].includes(state) || m.status !== 'suggested'
    const actions = `<ul class="action-list">${titles.slice(0, count).map((title, i) => `<li><label><input type="checkbox" data-action="${key}" data-index="${i}" ${m.checked[i] ? 'checked' : ''} ${locked ? 'disabled' : ''}><span>${title}</span></label></li>`).join('')}</ul>`
    return `<section><p class="eyebrow">${key} · ${key === 'A' ? 'ВСЕ ДЕЙСТВИЯ СРАЗУ' : 'КОМПАКТНЫЙ БИЛЕТ'}</p><article class="ticket" aria-busy="${busy || state === 'loading'}"><span class="badge">${m.status === 'done' ? 'Шаг завершён' : m.status === 'dismissed' ? 'Шаг отложен' : 'Первый шаг'}</span><h2>Пополнить резерв на 15 000 ₽</h2><p class="why">Чтобы неожиданный расход не пришлось покрывать кредитом.</p><p class="result">После пополнения: <b>25 000 ₽ → 40 000 ₽</b></p>${state === 'loading' ? '<p role="status">Загружаем действия…</p>' : state === 'empty' ? '<p>В этом отчёте нет отдельных действий. Можно отметить шаг целиком.</p>' : `<div class="action-progress">${key === 'A' ? `<p class="progress">Выполнено ${n} из ${count}</p><progress value="${n}" max="${count}" aria-label="Прогресс действий"></progress>${actions}` : `<details data-variant="${key}" ${m.expanded || n > 0 || m.error ? 'open' : ''}><summary><span class="summary-line"><span>Выполнено ${n} из ${count}</span><span class="disclosure-icon" aria-hidden="true"></span></span><progress value="${n}" max="${count}" aria-label="Прогресс действий"></progress></summary>${actions}</details>`}</div>`}
    <div class="status" role="status" aria-live="polite">${busy ? 'Сохраняем отметку…' : m.error ? '<span class="error">Не удалось сохранить отметку. Прогресс не изменён.</span>' : state === 'offline' ? 'Нет сети. Отметки доступны после подключения.' : m.status === 'done' ? `<span class="success">${n === count ? 'Все действия выполнены. Шаг завершён.' : 'Шаг завершён вручную. Отметки действий сохранены.'}</span>` : m.status === 'dismissed' ? 'Можно вернуться к шагу позже.' : 'Отметки сохранены.'}</div>
    ${m.error ? `<button data-retry="${key}" ${locked ? 'disabled' : ''}>Повторить сохранение</button>` : ''}
    <div class="controls">${m.status === 'suggested' ? `<button class="primary" data-complete="${key}" ${locked ? 'disabled' : ''}>Завершить шаг вручную</button><button data-dismiss="${key}" ${locked ? 'disabled' : ''}>Отложить</button>` : `<button data-reopen="${key}" ${busy || state === 'offline' ? 'disabled' : ''}>Вернуть в работу</button>`}</div><p class="hint">Приложение не переводит деньги. Отметьте действие после самостоятельного выполнения.</p></article></section>`
  }).join('')
}
async function save(key, index, value, fail = false) {
  const m = models[key], token = generation
  m.expanded = document.querySelector(`details[data-variant="${key}"]`)?.open || false
  m.busy = true; m.error = false; m.pending = { index, value }; render()
  await new Promise(resolve => setTimeout(resolve, 650))
  if (token !== generation) return
  m.busy = false
  if (fail) m.error = true
  else { m.checked[index] = value; m.status = m.checked.every(Boolean) ? 'done' : 'suggested'; m.pending = null }
  render()
}
document.querySelector('#variants').addEventListener('change', e => {
  if (e.target.dataset.action) save(e.target.dataset.action, Number(e.target.dataset.index), e.target.checked, state === 'error')
})
document.querySelector('#variants').addEventListener('click', e => {
  const d = e.target.dataset
  if (d.retry) { const m = models[d.retry], p = m.pending || { index: count - 1, value: true }; save(d.retry, p.index, p.value); return }
  const key = d.complete || d.dismiss || d.reopen
  if (!key) return
  const m = models[key]
  m.status = d.complete ? 'done' : d.dismiss ? 'dismissed' : 'suggested'
  if (d.reopen && m.checked.every(Boolean)) m.checked[count - 1] = false
  m.error = false; render()
})
document.querySelector('#state').addEventListener('change', e => { state = e.target.value; init() })
document.querySelector('#count').addEventListener('change', e => { count = Number(e.target.value); init() })
document.querySelector('#reset').addEventListener('click', () => { state = 'ready'; document.querySelector('#state').value = state; init() })
document.querySelector('#reload').addEventListener('click', () => { generation++; state = 'ready'; document.querySelector('#state').value = state; for (const m of Object.values(models)) { m.busy = false; m.error = false; m.pending = null } render() })
init()
