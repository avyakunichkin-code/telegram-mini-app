const reports = [
  { id: 'nov', date: '5 ноября 2026', short: '05.11.2026', asOf: 'ноябрь 2026', question: 'Как у нас дела в целом?', version: 1, lights: ['green', 'green', 'yellow', 'yellow'], values: [40000, 1.3, 24, 860000, 526000] },
  { id: 'oct', date: '5 октября 2026', short: '05.10.2026', asOf: 'октябрь 2026', question: 'Хватит ли запаса?', version: 1, lights: ['yellow', 'yellow', 'red', 'yellow'], values: [12000, .7, 30, 940000, 360000] },
  { id: 'sep', date: '5 сентября 2026', short: '05.09.2026', asOf: 'сентябрь 2026', question: 'Как быстрее закрыть кредиты?', version: 1, lights: ['yellow', 'yellow', 'red', 'yellow'], values: [8000, .4, 34, 980000, 310000] },
]
const areaNames = ['Бюджет', 'Долги', 'Подушка', 'Защита']
const lightNames = { green: 'В порядке', yellow: 'Есть вопросы', red: 'Нужен разбор' }
const metrics = ['Свободный остаток в месяц', 'Подушка в месяцах расходов', 'Платежи от дохода', 'Общий долг', 'Капитал семьи']
let variant = 'B', archiveExpanded = window.matchMedia('(min-width:951px)').matches, state = 'ready', before = 'oct', after = 'nov', opened = null
let returnArchiveOpen = false
const root = document.querySelector('#preview')
const number = (v, digits = 0) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(v)
const format = (v, i) => v == null ? 'Нет данных' : `${number(v, i === 1 ? 1 : 0)}${i === 1 ? ' мес.' : i === 2 ? ' %' : ' ₽'}`
function currentReports() {
  return reports.slice(0, state === 'one' ? 1 : 3).map(r => ({ ...r, values: r.values.map((v, i) => state === 'missing' && r.id === 'oct' && i === 4 ? null : v), version: state === 'versions' && r.id !== 'nov' ? 0 : 1 }))
}
function signals(r) {
  return `<div class="signals" aria-label="Четыре области">${r.lights.map((light, i) => `<span class="signal" title="${areaNames[i]}: ${lightNames[light]}"><i class="dot ${light}" aria-hidden="true"></i><span>${areaNames[i]}<span class="stamp"> · ${lightNames[light]}</span></span></span>`).join('')}</div>`
}
function cards(list) {
  return `<div class="history-grid">${list.map((r, i) => `<article class="snapshot ${variant === 'B' ? (r.id === after ? 'selected-after' : r.id === before ? 'selected-before' : '') : ''}"><div class="date"><span>${r.date}</span>${variant === 'B' && [before, after].includes(r.id) ? `<span class="selection-tag">${r.id === after ? 'Стало' : 'Было'}</span>` : i === 0 ? '<span class="latest">Последний</span>' : ''}</div><h3>${r.question}</h3>${signals(r)}<p class="stamp">Данные: ${r.asOf}<br>Итоговый · расчёт v${r.version}</p><div class="tools"><button data-open="${r.id}">Открыть отчёт</button><button data-compare="${r.id}" ${list.length < 2 ? 'disabled' : ''}>Сравнить</button></div></article>`).join('')}</div>`
}
function comparison(list) {
  if (variant === 'B') return bookComparison(list)
  if (list.length < 2) return '<section class="comparison"><div class="empty-state"><p class="eyebrow">Первая точка отсчёта</p><h3>История уже началась.</h3><p>Для сравнения нужен ещё один итоговый чекап. Сейчас можно открыть сохранённый отчёт.</p><button data-new>Начать новый чекап</button></div></section>'
  const a = list.find(r => r.id === before), b = list.find(r => r.id === after)
  const mismatch = a.version !== b.version
  const options = (selected, excluded, role) => list.map(r => `<option value="${r.id}" ${r.id === selected ? 'selected' : ''} ${(role === 'before' ? list.indexOf(r) <= list.findIndex(x => x.id === excluded) : list.indexOf(r) >= list.findIndex(x => x.id === excluded)) ? 'disabled' : ''}>${r.short}</option>`).join('')
  return `<section class="comparison" aria-label="Сравнение отчётов"><div class="comparison-head"><p class="eyebrow">СОХРАНЁННЫЕ РЕЗУЛЬТАТЫ</p><h3>${variant === 'B' ? 'Ваша история в движении.' : 'Что изменилось между чекапами'}</h3><p>Два сохранённых отчёта. Один взгляд на изменения.</p>${variant === 'B' ? `<div class="pair-presets" aria-label="Быстрое сравнение"><button data-preset="previous" aria-pressed="${before === 'oct' && after === 'nov'}">С предыдущим</button><button data-preset="first" aria-pressed="${before === 'sep' && after === 'nov'}">С первым чекапом</button></div>` : ''}<div class="selectors"><label>Было · отчёт<select id="before">${options(a.id, b.id, 'before')}</select></label><label>Стало · отчёт<select id="after">${options(b.id, a.id, 'after')}</select></label></div></div><div class="comparison-body">${mismatch ? '<div class="notice" role="note">Версии расчёта различаются. Значения показаны как сохранены; изменение цвета может быть связано с правилами, а не только с вашими данными.</div>' : ''}${variant === 'B' ? summary(a, b) : ''}<h3>Четыре области</h3><div class="area-compare">${areaNames.map((name, i) => `<div class="area-change"><b>${name}</b><span><i class="dot ${a.lights[i]}" aria-hidden="true"></i>${lightNames[a.lights[i]]}</span><span class="area-arrow" aria-hidden="true">→</span><span><i class="dot ${b.lights[i]}" aria-hidden="true"></i>${lightNames[b.lights[i]]}</span></div>`).join('')}</div><h3>Пять ориентиров</h3><div class="metrics">${metrics.map((name, i) => {
    const x = a.values[i], y = b.values[i], delta = x == null || y == null ? null : y - x
    return `<div class="metric"><div class="metric-name"><span class="metric-index" aria-hidden="true">0${i + 1}</span>${name}</div><div class="metric-values"><div class="before">Было <span class="nowrap">${format(x, i)}</span></div><div class="after"><small>Стало </small><span class="nowrap">${format(y, i)}</span></div><div class="delta">${delta == null ? 'Изменение неизвестно: в старом отчёте нет метрики' : delta === 0 ? 'Без изменений' : `Изменение: ${delta > 0 ? '+' : '−'}${i === 2 ? `${number(Math.abs(delta))} п. п.` : format(Math.abs(delta), i)}`}</div></div></div>`
  }).join('')}</div><div class="saved-note">Данные: ${a.asOf} → ${b.asOf}. Расчёты v${a.version} → v${b.version}. Разница отражает введённые данные; она сама по себе не объясняет причины изменений.</div></div></section>`
}
function summary(a, b) {
  const cash = b.values[0] - a.values[0]
  const reserve = b.values[1] - a.values[1]
  const headline = cash === 0 ? 'Свободный остаток без изменений.' : `Свободного остатка ${cash > 0 ? 'больше' : 'меньше'}.`
  return `<section class="change-story" aria-label="Главное в сравнении"><p class="eyebrow">МЕЖДУ ЭТИМИ ЧЕКАПАМИ</p><div class="story-main"><h4>${headline}</h4><strong>${cash > 0 ? '+' : cash < 0 ? '−' : ''}${format(Math.abs(cash), 0)}<small> в месяц</small></strong></div><p>Подушка: <b>${format(a.values[1], 1)} → ${format(b.values[1], 1)}</b>${reserve === 0 ? ' · без изменений' : ''}. Это разница двух снимков, а не прогноз.</p></section>`
}
function render() {
  const list = currentReports()
  const heading = `<div class="workspace-head"><div><p class="eyebrow">Профиль / История разборов</p><h2>${variant === 'A' ? 'Всё важное — рядом.' : variant === 'C' ? 'Ваша история. Новый разворот.' : 'Ваш финансовый журнал.'}</h2><p class="summary-note muted">Возвращайтесь к прежним ответам и смотрите, как меняется положение семьи.</p></div><button class="primary" data-new>Новый чекап</button></div>`
  let content
  if (state === 'loading') content = '<div class="loading" role="status" aria-label="Загружаем историю"><div class="skeleton"></div><div class="skeleton"></div><p>Собираем сохранённые отчёты…</p></div>'
  else if (['empty', 'error', 'offline'].includes(state)) {
    const copy = state === 'empty' ? ['Здесь появится ваша история.', 'Завершите первый чекап — его результат останется в истории.'] : state === 'offline' ? ['Для истории нужна сеть.', 'Сравнение и загрузка прошлых отчётов доступны после подключения.'] : ['История пока недоступна.', 'Не удалось загрузить отчёты. Сохранённые результаты не изменились.']
    content = `<div class="empty-state" role="status"><h3>${copy[0]}</h3><p>${copy[1]}</p><button ${state === 'offline' ? 'disabled' : ''} data-retry>${state === 'empty' ? 'Начать первый чекап' : 'Повторить загрузку'}</button></div>`
  } else if (opened) {
    const r = list.find(r => r.id === opened)
    content = `<section class="report-preview"><button data-back>← К истории</button><p class="eyebrow report-kicker">Сохранённый итоговый отчёт · ${r.date}</p><h3>${r.question}</h3>${signals(r)}<dl>${metrics.map((name, i) => `<dt>${name}</dt><dd>${format(r.values[i], i)}</dd>`).join('')}</dl><p class="muted">Данные на ${r.asOf}, версия расчёта ${r.version}. Это демонстрационное превью старого отчёта; в приложении откроется его полный сохранённый результат.</p></section>`
  } else {
    const draft = '<aside class="draft"><div><b>Есть незавершённый чекап</b><small>Черновик за ноябрь · в сравнение не входит</small></div><button data-draft>Продолжить</button></aside>'
    content = hybridLayout(list, variant)
  }
  if (!opened && !['loading', 'empty', 'error', 'offline'].includes(state)) content += '<aside class="draft journal-draft"><div><b>Продолжим, когда будете готовы.</b><small>Ноябрьский черновик сохранён отдельно от итоговых отчётов.</small></div><button data-draft>К черновику →</button></aside>'
  root.innerHTML = `<div class="workspace hybrid hybrid-${variant}">${heading}${content}<p id="demo-status" role="status" aria-live="polite"></p></div>`
}
document.querySelector('.variant-tabs').addEventListener('click', e => {
  if (!e.target.dataset.variant) return
  variant = e.target.dataset.variant; opened = null
  document.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === variant)))
  render()
})
document.querySelector('#state').addEventListener('change', e => { state = e.target.value; opened = null; before = 'oct'; after = 'nov'; render() })
root.addEventListener('change', e => {
  if (e.target.id === 'before') before = e.target.value
  else if (e.target.id === 'after') after = e.target.value
  else return
  const datesOpen = root.querySelector('.book-dates')?.open
  render()
  if (datesOpen && root.querySelector('.book-dates')) root.querySelector('.book-dates').open = true
  document.querySelector(`#${e.target.id}`)?.focus()
})
root.addEventListener('click', e => {
  const d = e.target.closest('button')?.dataset || {}
  if (d.month) { const i = reports.findIndex(r => r.id === d.month); after = reports[Math.min(i, reports.length - 2)].id; before = reports[Math.min(i + 1, reports.length - 1)].id; render(); root.querySelector(`[data-month="${d.month}"]`).focus(); return }
  if (d.preset) { before = d.preset === 'first' ? 'sep' : 'oct'; after = 'nov'; render(); root.querySelector(`[data-preset="${d.preset}"]`).focus(); return }
  if ('archive' in d) { archiveExpanded = !archiveExpanded; render(); root.querySelector('[data-archive]').focus(); return }
  if (d.open) { returnArchiveOpen = !!root.querySelector('.h-mobile-archive')?.open; opened = d.open; render(); root.querySelector('[data-back]').focus() }
  else if ('back' in d) { const id = opened; opened = null; render(); if (returnArchiveOpen && root.querySelector('.h-mobile-archive')) root.querySelector('.h-mobile-archive').open = true; [...root.querySelectorAll(`[data-month="${id}"], [data-open="${id}"]`)].find(el => el.getClientRects().length)?.focus() }
  else if (d.compare) { const index = reports.findIndex(r => r.id === d.compare); after = reports[Math.min(index, reports.length - 2)].id; before = reports[Math.min(index + 1, reports.length - 1)].id; archiveExpanded = window.matchMedia('(min-width:951px)').matches; render(); root.querySelector('.hybrid-panel, .book-spread, .comparison').focus(); root.querySelector('.hybrid-panel, .book-spread, .comparison').scrollIntoView({ block: 'start', behavior: 'instant' }) }
  else if ('retry' in d && state === 'error') { state = 'ready'; document.querySelector('#state').value = state; render() }
  else if ('new' in d || 'draft' in d || 'retry' in d) document.querySelector('#demo-status').textContent = 'В приложении откроется чекап. В lab показана только история и сравнение.'
})
render()

window.matchMedia('(min-width:951px)').addEventListener('change', e => { archiveExpanded = e.matches; render() })
