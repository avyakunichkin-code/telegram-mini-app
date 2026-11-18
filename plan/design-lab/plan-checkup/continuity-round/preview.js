const root = document.querySelector('#preview')
let variant = 'C', state = 'done', showingOld = false
const oldTitle = 'Отложить 60 000 ₽ — первый месяц подушки'
function facts() {
  const current = state === 'same' ? .4 : state === 'decline' ? .2 : 1.2
  const status = state === 'dismissed' ? 'dismissed' : ['partial', 'suggested'].includes(state) ? state : 'done'
  const captions = { done: 'Шаг отмечен завершённым', partial: 'В процессе · 1 из 3', suggested: 'Без отметок', dismissed: 'Шаг отложен' }
  const caption = state === 'manual' ? 'Завершён вручную · 1 из 3' : state === 'legacy' ? 'Шаг отмечен завершённым' : captions[status]
  return { current, status, caption, delta: current - .4 }
}
const num = n => n.toLocaleString('ru-RU', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
function metric() {
  const f = facts()
  return `<div class="metric-compare"><div><b>Подушка в месяцах расходов</b><span>Данные октября → ноября</span></div><div class="metric-pair"><span><small>Было</small><strong class="was">${state === 'missing' ? 'Нет данных' : '0,4 мес.'}</strong></span><span class="metric-arrow" aria-hidden="true">→</span><span><small>Стало</small><strong>${num(f.current)} мес.</strong></span></div></div>`
}
function past() {
  const f = facts()
  const framing = f.status === 'suggested' ? 'В прошлом отчёте было предложено' : f.status === 'partial' ? 'В прошлом шаге вы отметили действие' : f.status === 'dismissed' ? 'В прошлом отчёте вы отложили шаг' : 'В прошлом отчёте вы отметили'
  const progress = state === 'legacy' ? 'В этом старом отчёте нет списка отдельных действий.' : f.status === 'suggested' || f.status === 'dismissed' ? 'Отмечено 0 из 3 действий. Отметки в новом чекапе не переносятся.' : f.status === 'partial' || state === 'manual' ? 'Отмечено 1 из 3 действий. История отметок сохранена.' : 'Отмечены все 3 действия. История отметок сохранена.'
  const delta = state === 'missing' ? 'Изменение неизвестно: нет старой метрики' : f.delta === 0 ? 'Без изменений' : `${f.delta > 0 ? '+' : '−'}${num(Math.abs(f.delta))} мес. между чекапами`
  return `<section class="return-block" aria-label="Прошлый шаг"><div class="past-copy"><div class="past-top"><p>${framing}</p><span class="step-status status-${f.status}">${f.caption}</span></div><h4 class="past-title">${oldTitle}</h4><p class="past-caption">Отчёт от 5 октября 2026 · ${progress}</p></div>${state === 'versions' ? '<p class="notice">Правила расчёта различаются. Сравнивайте числа с учётом версии отчёта; вывод о смене цвета не делаем.</p>' : ''}${metric()}<div class="past-actions"><span class="delta">${delta}</span><button data-open ${state === 'offline' ? 'disabled' : ''}>Открыть прошлый отчёт ↗</button></div></section>`
}
function otherSteps() {
  return `<details class="other-steps"><summary>Ещё 2 шага из прошлого отчёта</summary><div class="other-row"><div><b>Сократить расходы на 2 000 ₽ в месяц</b><p>Было предложено · 0 из 3 действий отмечено</p><small>Свободный остаток: −2 000 ₽ → +24 000 ₽/мес.</small></div><span class="step-status status-suggested">Без отметок</span></div><div class="other-row"><div><b>Потеря дохода: укрепить запас</b><p>0 из 2 действий отмечено</p><small>Подушка: ${state === 'missing' ? 'Нет данных' : '0,4'} → ${num(facts().current)} мес.</small></div><span class="step-status status-dismissed">Отложен</span></div></details>`
}
function next() {
  const f = facts()
  const title = f.current < 1 ? `Отложить ${Math.round((1 - f.current) * 100000).toLocaleString('ru-RU')} ₽ — первый месяц подушки` : 'Пополнять подушку<br>по 12 000 ₽ в месяц'
  return `<section class="next-step" aria-label="Текущий шаг"><p class="eyebrow">${variant === 'C' ? 'Сейчас · новый разбор' : 'Следующий шаг по новому разбору'}</p><h4>${title}</h4><p>Сейчас запас — ${num(facts().current)} мес. расходов. Следующий ориентир этого отчёта — 3 месяца. Шаг предложен по текущим данным.</p><details class="next-progress"><summary><span>Выполнено 0 из 3</span><span aria-hidden="true">⌄</span></summary><ul><li><input type="checkbox" aria-label="Выбрать отдельный счёт" disabled><span>Выбрать отдельный счёт для резерва</span></li><li><input type="checkbox" aria-label="Пополнить резерв" disabled><span>Самостоятельно внести месячный взнос</span></li><li><input type="checkbox" aria-label="Проверить зачисление" disabled><span>Проверить зачисление</span></li></ul></details><button data-current ${state === 'offline' ? 'disabled' : ''}>Перейти к действиям</button><p class="next-hint">В lab действия — демонстрация. Приложение не переводит деньги.</p></section>`
}
function render() {
  const f = facts()
  const header = `<header class="report-head"><div><p class="eyebrow">Итоговый разбор · данные за ноябрь 2026</p><h2>С чего продолжить</h2><p>Новые данные — новый ориентир для семьи.</p></div><span>${state === 'offline' ? 'Офлайн · только чтение' : 'Повторный чекап'}</span></header>`
  const tiles = `<div class="context-tiles"><div class="context-tile"><span>Остаётся в месяц<small>По данным текущего отчёта</small></span><b>24 000 ₽</b></div><div class="context-tile reserve"><span>Запас на ${num(f.current)} мес.<small>Ориентир отчёта — 3 месяца</small></span><b>${Math.round(f.current * 100000).toLocaleString('ru-RU')} ₽</b></div></div>`
  let body
  if (showingOld) body = `<section class="old-report"><button data-back>← К новому разбору</button><h3>Сохранённый отчёт · октябрь 2026</h3><p>Здесь открывается предыдущий итоговый отчёт. Это превью на вымышленных данных.</p><dl><dt>Подушка в этом отчёте</dt><dd>${state === 'missing' ? 'Нет данных' : '0,4 мес.'}</dd><dt>Предложенный шаг</dt><dd>${oldTitle}</dd><dt>Статус шага</dt><dd>${f.caption}</dd></dl><p>Сохранённые числа не пересчитываются. Отметки прошлого шага в новом чекапе показываются как история.</p></section>`
  else if (state === 'first') body = next()
  else if (state === 'loading') body = `<section class="context-error" aria-busy="true"><p role="status">Загружаем контекст прошлого чекапа…</p><div class="loading-lines" aria-hidden="true"><i></i><i></i></div></section>${next()}`
  else if (state === 'error') body = `<section class="context-error"><p role="alert">Не удалось показать прошлый шаг. Новый отчёт доступен.</p><button data-retry>Повторить загрузку</button></section>${next()}`
  else body = variant === 'C' ? `<div class="bridge-layout">${past()}${next()}</div>${otherSteps()}` : `${past()}${variant === 'B' ? '' : otherSteps()}${next()}${variant === 'B' ? otherSteps() : ''}`
  root.innerHTML = `<article class="report-page variant-${variant}">${header}${showingOld ? '' : tiles}<section class="steps-section">${body}</section>${!showingOld && state !== 'first' ? '<p class="safety-note">Отметка шага и изменение данных показаны отдельно. Разница между чекапами не подтверждает, что изменение вызвано этим действием.</p>' : ''}<p class="preview-status" role="status" aria-live="polite"></p></article>`
}
document.querySelector('.lab-tabs').addEventListener('click', e => {
  const button = e.target.closest('[data-variant]')
  if (!button) return
  variant = button.dataset.variant; showingOld = false
  document.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === variant)))
  render()
})
document.querySelector('#state').addEventListener('change', e => { state = e.target.value; showingOld = false; render() })
root.addEventListener('click', e => {
  const button = e.target.closest('button')
  if (!button) return
  if ('open' in button.dataset) { showingOld = true; render(); root.querySelector('[data-back]').focus() }
  else if ('back' in button.dataset) { showingOld = false; render(); root.querySelector('[data-open]').focus() }
  else if ('retry' in button.dataset) { state = 'done'; document.querySelector('#state').value = state; render() }
  else if ('current' in button.dataset) { const details = root.querySelector('.next-progress'); details.open = true; details.querySelector('summary').focus(); root.querySelector('.preview-status').textContent = 'В приложении здесь доступны действия нового шага. В этой демонстрации они не сохраняются.' }
})
render()
