const stateSelect = document.querySelector('#state')
const report = document.querySelector('#report')
const placeholder = document.querySelector('#placeholder')
const announcement = document.querySelector('#announcement')
const checks = [...document.querySelectorAll('[data-action]')]
let dismissed = false
let pendingAction = null
let saveTimer
const committed = new Set()

const screens = {
  loading: '<div class="placeholder" role="status" aria-label="Загрузка отчёта"><p class="eyebrow">Собираем ваш атлас</p><h1>Прокладываем<br>маршрут.</h1><p>Сверяем данные чекапа. Суммы появятся, когда разбор будет готов.</p><div class="skeleton big" aria-hidden="true"></div><div class="skeleton short" aria-hidden="true"></div><div class="skeleton-route" aria-hidden="true"></div></div>',
  empty: '<section class="placeholder" aria-labelledby="empty-title"><span class="placeholder-marker" aria-hidden="true">↗</span><p class="eyebrow">У каждой карты есть начало</p><h1 id="empty-title">Сначала —<br>ваша точка.</h1><p>Пока недостаточно данных для разбора. Начните с доходов, расходов и накоплений. Суммы можно указать примерно и уточнить позже.</p><button type="button" class="button primary" data-demo-start>Начать демо-чекап <span aria-hidden="true">↗</span></button><p class="small-note">В этом раунде кнопка открывает готовый демонстрационный отчёт.</p></section>',
  error: '<section class="placeholder" aria-labelledby="error-title"><span class="placeholder-marker" aria-hidden="true">!</span><p class="eyebrow">Маршрут временно недоступен</p><h1 id="error-title">Не удалось<br>открыть разбор.</h1><p>Повторите загрузку. Данные чекапа не нужно вводить заново.</p><button type="button" class="button primary" data-retry>Попробовать ещё раз <span aria-hidden="true">↗</span></button></section>',
}

function updateProgress() {
  const count = committed.size
  document.querySelector('#progress').textContent = count === 2 ? 'Выполнено 2 из 2 · шаг завершён' : `Выполнено ${count} из 2`
  checks.forEach(input => { input.checked = committed.has(input.dataset.action) })
}

function syncDisabled() {
  const state = stateSelect.value
  const blocked = state === 'offline' || state === 'saving' || Boolean(saveTimer)
  checks.forEach(input => { input.disabled = blocked || dismissed })
  document.querySelector('#dismiss').disabled = blocked
  document.querySelector('#restore').disabled = blocked
  document.querySelector('#retry-save').disabled = blocked
  document.querySelector('.checklist').setAttribute('aria-busy', String(state === 'saving' || Boolean(saveTimer)))
}

function setState() {
  clearTimeout(saveTimer)
  saveTimer = null
  pendingAction = null
  const state = stateSelect.value
  const screen = screens[state]
  report.hidden = Boolean(screen)
  placeholder.hidden = !screen
  placeholder.innerHTML = screen || ''
  report.setAttribute('aria-busy', String(state === 'loading'))
  document.querySelector('#offline-note').hidden = state !== 'offline'
  document.querySelector('#save-error').hidden = state !== 'save-error'
  document.querySelector('#save-status').textContent = state === 'saving' ? 'Сохраняем…' : state === 'offline' ? 'Только чтение' : ''
  updateProgress()
  syncDisabled()
  announcement.textContent = state === 'ready' ? 'Демонстрационный отчёт готов.' : stateSelect.selectedOptions[0].textContent
}

function saveAction(action) {
  document.querySelector('#save-error').hidden = true
  pendingAction = action
  document.querySelector('#save-status').textContent = 'Сохраняем…'
  saveTimer = setTimeout(() => {
    saveTimer = null
    if (stateSelect.value === 'save-error') {
      document.querySelector('#save-error').hidden = false
      document.querySelector('#save-status').textContent = ''
      updateProgress()
    } else {
      if (action.checked) committed.add(action.key)
      else committed.delete(action.key)
      pendingAction = null
      updateProgress()
      document.querySelector('#save-status').textContent = 'Сохранено в демо'
    }
    syncDisabled()
  }, 650)
  syncDisabled()
}

checks.forEach(input => input.addEventListener('change', () => saveAction({ key: input.dataset.action, checked: input.checked })))
stateSelect.addEventListener('change', setState)
document.querySelectorAll('[name=variant]').forEach(input => input.addEventListener('change', () => {
  document.body.classList.toggle('action-first', input.value === 'action')
  const composition = document.querySelector('.composition')
  const atlas = document.querySelector('.atlas')
  const steps = document.querySelector('.steps-section')
  if (input.value === 'action') composition.insertBefore(steps, atlas)
  else composition.insertBefore(atlas, steps)
  announcement.textContent = input.value === 'action' ? 'Композиция A2. Первый шаг перед картой.' : 'Композиция A1. Карта перед шагами.'
}))
document.querySelector('#retry-save').addEventListener('click', () => {
  const retry = pendingAction
  stateSelect.value = 'ready'
  setState()
  if (retry) saveAction(retry)
  else announcement.textContent = 'Связь восстановлена. Отметьте действие ещё раз.'
})
document.querySelector('#dismiss').addEventListener('click', () => {
  dismissed = true
  document.querySelector('.step').classList.add('is-dismissed')
  document.querySelector('#dismiss-note').hidden = false
  document.querySelector('#dismiss').hidden = true
  syncDisabled()
  announcement.textContent = 'Шаг отмечен как не подходящий. Можно вернуть его в план.'
  document.querySelector('#restore').focus()
})
document.querySelector('#restore').addEventListener('click', () => {
  dismissed = false
  document.querySelector('.step').classList.remove('is-dismissed')
  document.querySelector('#dismiss-note').hidden = true
  document.querySelector('#dismiss').hidden = false
  syncDisabled()
  document.querySelector('#dismiss').focus()
  announcement.textContent = 'Шаг возвращён в план.'
})
placeholder.addEventListener('click', event => {
  if (!event.target.closest('[data-retry], [data-demo-start]')) return
  stateSelect.value = 'ready'
  setState()
  document.querySelector('#title').setAttribute('tabindex', '-1')
  document.querySelector('#title').focus()
})
document.querySelectorAll('.navigation a').forEach(link => link.addEventListener('click', () => {
  if (report.hidden) {
    stateSelect.value = 'ready'
    setState()
  }
  document.querySelectorAll('.navigation a').forEach(item => item.removeAttribute('aria-current'))
  link.setAttribute('aria-current', 'location')
}))
setState()
