const params = new URLSearchParams(location.search)
let variant = ['A','B','C'].includes(params.get('variant')) ? params.get('variant') : 'B'
const state = document.querySelector('#state'), preview = document.querySelector('#preview')
const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽'
function data() {
  const s = state.value
  const g = { title: 'Первый взнос на квартиру', target: 1200000, before: 240000, saved: 300000, months: 3, deadline: 'ноябрь 2029', oldDate: 'ноябрь 2029', estimate: 'август 2030', need: 25000, observed: 20000, available: 28000 }
  if (s === 'slow') Object.assign(g, { saved: 264000, observed: 8000, estimate: 'август 2036' })
  if (s === 'decline') Object.assign(g, { saved: 210000, observed: -10000, estimate: null })
  if (s === 'same') Object.assign(g, { saved: 240000, observed: 0, estimate: null })
  if (s === 'done') Object.assign(g, { saved: 1200000, observed: 320000, need: 0, estimate: 'цель достигнута' })
  if (s === 'new') Object.assign(g, { before: null, observed: null, oldDate: null, estimate: null })
  if (s === 'nodate') Object.assign(g, { deadline: null, need: null })
  if (s === 'noincome') Object.assign(g, { available: 0 })
  if (s === 'large') Object.assign(g, { target: 1200000000, before: 240000000, saved: 300000000, need: 25000000, observed: 20000000, available: 28000000 })
  return g
}
const delta = g => g.before == null ? 'Сравним после следующего чекапа' : `${g.saved-g.before > 0 ? '+' : ''}${money(g.saved-g.before)} за 3 месяца`
const pace = g => g.observed == null ? 'Пока неизвестен' : g.observed <= 0 ? 'Нет положительного темпа' : money(g.observed) + '/мес.'
const estimate = g => g.estimate || 'Пока нельзя оценить'
const meter = g => `<div class="meter" role="img" aria-label="Накоплено ${Math.min(100,Math.round(g.saved/g.target*100))}%"><i style="width:${Math.min(100,g.saved/g.target*100)}%"></i></div>`
const current = g => `<span class="small">Накоплено сейчас · из ${money(g.target)}</span><strong class="number">${money(g.saved)}</strong><span class="delta">${delta(g)}</span>${meter(g)}`
const timing = g => `<small>Ваш срок</small><b class="number">${g.deadline || 'Добавьте срок'}</b><small>${g.need == null ? 'Тогда рассчитаем нужный взнос.' : `Нужно ${money(g.need)}/мес.`}</small>`
const forecast = g => `<small>При наблюдаемом темпе</small><b class="number">${estimate(g)}</b><small>${g.oldDate ? `В прошлом отчёте: ${g.oldDate}.` : 'Предыдущей оценки нет.'}</small>`
function render() {
  const s = state.value, g = data(), pct = Math.min(100, Math.round(g.saved/g.target*100))
  const descriptions = { A: '1 · Журнал целей — знакомая таблица с ясными полями; на телефоне каждая строка становится карточкой.', B: '2 · Маршрут цели — три точки пути и спокойный расчёт справа. Остальные цели раскрываются по запросу.', C: '3 · Письмо из будущего — цель получает собственную обложку, а расчёт остаётся на соседней странице.' }
  if (['empty','loading','error'].includes(s)) {
    const labels = { empty: ['На что хотите накопить?', 'Добавьте цель в чекапе — покажем нужный взнос и будем сравнивать накопления.'], loading: ['Собираем историю цели…', 'Сопоставляем сохранённые чекапы.'], error: ['Не удалось загрузить сравнение', 'Текущий отчёт сохранён. Попробуйте ещё раз.'] }
    preview.innerHTML = `<div class="surface message"><h2>${labels[s][0]}</h2><p>${labels[s][1]}</p>${s==='loading'?'':`<button id="retry">${s==='error'?'Повторить':'Добавить цель в макете'}</button>`}</div><p class="variant-note">${descriptions[variant]}</p>`
    document.querySelector('#retry')?.addEventListener('click', () => { state.value='normal'; render() }); return
  }
  const badge = `<span class="badge ${g.observed < g.need ? 'warn' : ''}">${g.saved>=g.target?'Цель достигнута':g.before==null?'Первая точка':g.observed<=0?'Нужен новый план':g.observed<g.need?'Темп ниже нужного':'Есть движение'}</span>`
  const extra = `<details class="subgoal"><summary>Ещё одна цель · Отпуск · 90 000 из 180 000 ₽</summary><p>Было 60 000 ₽ → стало 90 000 ₽ · +30 000 ₽ за 3 месяца</p><p class="small">Темп 10 000 ₽/мес. · нужно 15 000 ₽/мес. к маю 2027 · по темпу: август 2027, раньше: ноябрь 2027.</p></details>`
  const note = `<p class="note">Темп — изменение накоплений между августом и ноябрём 2026, делённое на 3 месяца. Это может включать разовое пополнение. Оценка срока предполагает сохранение темпа и не учитывает доходность.${s==='changed'?' Сумма цели изменилась: было 1 000 000 ₽, стало 1 200 000 ₽. Старую оценку не пересчитываем.':''}${s==='new'?' Сопоставление только по сохранённому ID: похожее название не доказывает, что это та же цель.':''}</p>`
  let body
  if (variant==='A') body=`<div class="heading"><h2>Ваши цели в движении</h2>${badge}</div><div class="goal-row"><div><p class="goal-title">${g.title}</p><small>Цель ${money(g.target)}</small></div><div><small>Было ${g.before==null?'—':money(g.before)}</small>${current(g)}</div><div><small>Наблюдаемый темп</small><b class="number">${pace(g)}</b>${timing(g)}</div><div>${forecast(g)}</div></div>${extra}`
  if (variant==='B') body=`<div class="route"><div class="route-main"><span class="kicker">МАРШРУТ / 01</span><h2 class="route-title">${g.title}</h2>${badge}<div class="milestones"><div class="milestone"><small>Август · было</small><b class="number">${g.before==null?'Нет данных':money(g.before)}</b></div><div class="milestone"><small>Ноябрь · сейчас</small><b class="number">${money(g.saved)}</b></div><div class="milestone"><small>Ваша цель</small><b class="number">${money(g.target)}</b></div></div>${meter(g)}<p class="delta">${delta(g)} · ${pct}% пути</p></div><div class="route-side"><div class="fields"><div>${timing(g)}</div><div><small>Наблюдаемый темп</small><b class="number">${pace(g)}</b></div></div><div class="field">${forecast(g)}</div><p class="small">Свободный остаток семьи сейчас: ${money(g.available)}/мес. Он ещё не распределён по целям.</p></div></div>${extra}`
  if (variant==='C') body=`<div class="letter"><div class="letter-cover"><span class="kicker">ВАШ ПЛАН / ЦЕЛЬ 01</span><h2>${g.title}</h2><div class="stamp">Уже<br><b>${pct}%</b><br>пути</div><p class="number">${money(g.saved)}</p><small>из ${money(g.target)}</small>${meter(g)}</div><div class="letter-body">${badge}<h2 class="route-title">${g.before==null?'Начинаем историю.':g.saved>g.before?'Вы стали ближе.':g.saved===g.before?'Пауза — тоже точка на карте.':'План можно скорректировать.'}</h2><p>${g.before==null?'Сейчас фиксируем первую точку.':`Было ${money(g.before)} → стало ${money(g.saved)}.`}<br><b>${delta(g)}</b></p><div class="fields"><div class="field"><small>Наблюдаемый темп</small><b class="number">${pace(g)}</b></div><div class="field">${timing(g)}</div></div><div class="field">${forecast(g)}</div></div></div>${extra}`
  if (variant === 'B' && g.saved >= g.target) {
    body = `<div class="achievement"><div class="achievement-art" aria-hidden="true"><span class="spark s1">✦</span><span class="spark s2">✧</span><span class="spark s3">✦</span><span class="spark s4">✧</span><div class="medal"><svg viewBox="0 0 80 80" fill="none"><path d="M24 50 18 76 39 65 60 76 55 50" fill="#45694f"/><circle cx="40" cy="32" r="28" fill="#f9db78" stroke="#b58c35" stroke-width="2"/><circle cx="40" cy="32" r="22" stroke="#b58c35" stroke-dasharray="2 4"/><path d="m28 32 8 8 16-17" stroke="#273d36" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="award-seal">ВАША ЦЕЛЬ · 100%</span></div><div class="achievement-copy"><span class="kicker">МАРШРУТ ПРОЙДЕН</span><h2>Получилось.<br><em>Вы это сделали!</em></h2><p>«${g.title}» — нужная сумма собрана.<br>За этим результатом ваши решения. Есть повод порадоваться собой.</p><div class="achievement-total"><strong>${money(g.saved)}</strong><span>из запланированных ${money(g.target)}</span></div></div><div class="finish-route"><span>Август · ${money(g.before)}</span><span class="finish-line" aria-hidden="true"></span><b>Ноябрь · ${money(g.saved)} ✓</b></div><p class="achievement-footnote">По данным вашего чекапа · ноябрь 2026. Сохраните этот момент в своей истории.</p></div>${extra}`
  }
  preview.innerHTML=`<div class="surface">${s==='offline'?'<div class="offline">Офлайн · сохранённый отчёт от 6 ноября · только чтение</div>':''}${body}${variant === 'B' && g.saved >= g.target ? '<p class="note">Сумма подтверждена вашими данными в чекапе. Покупка или перевод не проверяются приложением.</p>' : note}</div><p class="variant-note">${descriptions[variant]}</p>`
}
document.querySelectorAll('[data-variant]').forEach(button=>button.addEventListener('click',()=>{variant=button.dataset.variant;document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render()}))
state.addEventListener('change',render)
if ([...state.options].some(o => o.value === params.get('state'))) state.value = params.get('state')
document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variant===variant)))
render()

