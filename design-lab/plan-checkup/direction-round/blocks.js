const money = n => new Intl.NumberFormat('ru-RU').format(n).replaceAll(' ', '\u00a0') + '\u00a0₽'
const data = { reserve:240000, target:492000, transfer:15000, income:200000, expense:124000, debt:40000 }
const arrow = '<span aria-hidden="true">↗</span>'
const button = (text, action='why') => `<button class="block-button" data-action="${action}">${text}${arrow}</button>`
const eyebrow = text => `<div class="eyebrow">${text}</div>`
const fraction = '<span class="fraction">240<span>/ 492 тыс. ₽</span></span>'
const statFoot = '<div class="block-foot"><span>Условная цель · 3 месяца</span><b>49 % собрано</b></div>'
const lines = `<svg class="chart" viewBox="0 0 320 150" role="img" aria-label="Прогноз: как сейчас 672 000 рублей, если хуже 283 200 рублей через 12 месяцев"><defs><linearGradient id="wash" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5a8f5b" stop-opacity=".35"/><stop offset="1" stop-color="#5a8f5b" stop-opacity="0"/></linearGradient></defs><path d="M10 30H310M10 80H310M10 130H310" class="grid"/><path d="M10 120L60 102L110 85L160 66L210 48L260 30L310 12L310 108L260 110L210 112L160 114L110 116L60 118L10 120Z" fill="url(#wash)"/><path d="M10 120L60 102L110 85L160 66L210 48L260 30L310 12" class="line"/><path d="M10 120L60 118L110 116L160 114L210 112L260 110L310 108" class="worse"/><circle cx="310" cy="12" r="5" fill="currentColor"/></svg>`
const forecasts = '<div class="scenario-values"><span><i></i>Как сейчас<b>672 000 ₽</b></span><span><i class="dash"></i>Если хуже<b>283 200 ₽</b></span></div>'
const sample = '<p class="micro">Доход −10 %, расходы +10 % в сценарии «если хуже». Без доходности. Иллюстративный прогноз на 12 месяцев.</p>'
const answers = '<p class="answer-copy">После расходов и кредитов остаётся 36 000 ₽. Из них 15 000 ₽ — в подушку, 10 000 ₽ — на отпуск, 11 000 ₽ — свободно.</p>'
const sections = [
  { id:'metrics', number:'01', title:'Подушка, которую видно', intro:'Одна и та же метрика. Три способа почувствовать расстояние до цели.', options:[
    {id:'M1', title:'Мерный стакан', idea:'Запас становится осязаемым: заполнение, линия цели, крупная доля.', tone:'lime', html:`${eyebrow('Подушка · внимание')}<div class="vessel-layout"><div><h3>Уже есть<br>на полтора месяца.</h3>${fraction}<p class="micro">≈ 1,5 месяца обязательных расходов</p></div><div class="vessel" aria-hidden="true"><span class="vessel-goal">ЦЕЛЬ</span><div class="liquid"><span>49<span>%</span></span></div><i class="tick t1"></i><i class="tick t2"></i><i class="tick t3"></i></div></div>${statFoot}`},
    {id:'M2', title:'Линейка спокойствия', idea:'Вместо абстрактной полосы — календарная длина запаса.', tone:'cream', html:`${eyebrow('Подушка · внимание')}<h3>Сколько времени<br>у вас в запасе?</h3><div class="giant">1,5<span>мес.</span></div><div class="ruler" aria-label="1,5 месяца из условной цели 3 месяца"><span class="ruler-fill"></span>${Array.from({length:13},(_,i)=>`<i style="--i:${i}"></i>`).join('')}<b>ВЫ ЗДЕСЬ</b></div><div class="ruler-labels"><span>0</span><span>1 мес.</span><span>2 мес.</span><span>Цель · 3</span></div><div class="block-foot"><span>240 000 ₽ из 492 000 ₽</span><b>Ещё 252 000 ₽</b></div>`},
    {id:'M3', title:'Слоёный резерв', idea:'Три месячных слоя. Собранная часть отделена формой, подписью и цветом.', tone:'blue', html:`${eyebrow('Подушка · внимание')}<div class="layer-head"><h3>Фундамент<br>уже есть.</h3><span class="mini-circle">49 %</span></div><div class="reserve-layers"><div class="reserve-layer top">03<span>Следующий слой</span></div><div class="reserve-layer middle">02<span>Часть месяца собрана</span></div><div class="reserve-layer bottom">01<span>Первый месяц закрыт ✓</span></div></div><div class="block-foot"><span>240 000 / 492 000 ₽</span><b>≈ 1,5 из 3 мес.</b></div>`},
  ]},
  { id:'forecast', number:'02', title:'Будущее без хрустального шара', intro:'Разные исходы видны одновременно. Прогноз не выглядит обещанием.', options:[
    {id:'F1',title:'Коридор возможностей',idea:'Разница сценариев превращается в пространство. Подписи держат смысл.',tone:'white',html:`${eyebrow('Деньги на счетах / 12 месяцев')}<h3>Есть запас<br>для манёвра.</h3>${lines}${forecasts}${sample}`},
    {id:'F2',title:'Две дорожки',idea:'Графическая развилка: не одна уверенная стрелка вверх, а два читаемых пути.',tone:'graphite',html:`${eyebrow('Деньги на счетах / 12 месяцев')}<h3>Не один прогноз.<br>Два ориентира.</h3><div class="tracks"><div class="track-start">Сейчас<b>240 000 ₽</b></div><div class="track best"><span>Как сейчас</span><strong>672 000 ₽</strong><span class="track-arrow" aria-hidden="true">↗</span></div><div class="track cautious"><span>Если хуже</span><strong>283 200 ₽</strong><span class="track-arrow" aria-hidden="true">→</span></div></div>${sample}`},
    {id:'F3',title:'Карточка из будущего',idea:'Календарная закладка отделяет дату от результата, два сценария рядом.',tone:'lavender',html:`<div class="future-date"><span>ОКТЯБРЬ</span><strong>2027</strong><span>ЧЕРЕЗ 12 МЕСЯЦЕВ</span></div><h3>Что останется<br>на счетах?</h3><div class="future-values"><div><span>Как сейчас</span><b>672 000<span>₽</span></b></div><div><span>Если хуже</span><b>283 200<span>₽</span></b></div></div>${sample}`},
  ]},
  { id:'answer', number:'03', title:'Ответ с собственным голосом', intro:'Крупная цифра помогает начать. Пояснение сохраняет доверие.', options:[
    {id:'A1',title:'Типографический ответ',idea:'Сильная иерархия и одна контрастная плашка. Минимум декоративных деталей.',tone:'graphite',html:`${eyebrow('Как укрепить подушку?')}<h3>Не всё сразу.<br><span class="highlight">Начните с этого.</span></h3><div class="big-money">15 000<span>₽ / месяц</span></div>${answers}${button('Почему именно столько?')}`},
    {id:'A2',title:'Заметка на полях',idea:'Ответ как короткая личная записка: спокойная композиция с неожиданной разметкой.',tone:'yellow',html:`<span class="note-corner" aria-hidden="true">↘</span>${eyebrow('На вопрос «Как укрепить подушку?»')}<h3 class="note-title">Оставьте себе<br>запас воздуха.</h3><div class="underlined-money">15 000 ₽<span>в месяц в резерв</span></div>${answers}${button('Разобраться в сумме')}`},
    {id:'A3',title:'Распределение остатка',idea:'Совет сразу доказывается бюджетом: каждая часть свободных денег подписана.',tone:'white',html:`${eyebrow('Как укрепить подушку?')}<h3>36 000 ₽ остаётся.<br>Вот один вариант.</h3><div class="allocation"><span class="alloc-reserve">15 000</span><span class="alloc-goal">10 000</span><span class="alloc-free">11 000</span></div><div class="allocation-labels"><p><i class="dot-green"></i>В подушку<b>15 000 ₽</b></p><p><i class="dot-blue"></i>На отпуск<b>10 000 ₽</b></p><p><i class="dot-gray"></i>Свободно<b>11 000 ₽</b></p></div><p class="micro">После расходов 124 000 ₽ и платежей по кредитам 40 000 ₽ из дохода 200 000 ₽.</p>${button('Проверить допущения')}`},
  ]},
  { id:'step', number:'04', title:'Шаг, который хочется закончить', intro:'Не награда за нажатие. Понятное действие и честная отметка о результате.', options:[
    {id:'S1',title:'Отрывной билет',idea:'Один шаг как отдельный предмет. Перфорация отделяет действие от результата.',tone:'lime',html:`<div class="ticket-head"><span>СЛЕДУЮЩИЙ ШАГ</span><b>01 / 03</b></div><h3>Перевести в подушку</h3><div class="ticket-sum">15 000<span>₽</span></div><p class="micro">Самостоятельно в своём банке.<br>Сначала проверьте ближайшие платежи.</p><div class="perforation"></div><div class="ticket-result"><span>После шага</span><b>240 → 255 тыс. ₽</b></div>${button('Я сделал(а) это', 'done')}`},
    {id:'S2',title:'Три простых действия',idea:'Большое намерение разбито на наблюдаемые действия. Нет ложного автоперевода.',tone:'white',html:`${eyebrow('Шаг 01 / Пополнить подушку')}<h3>Пятнадцать тысяч.<br>Три действия.</h3><div class="todo-list"><label><input type="checkbox"><span>Проверить ближайшие платежи</span></label><label><input type="checkbox"><span>Перевести 15 000 ₽ в своём банке</span></label><label><input type="checkbox"><span>Проверить остаток: 255 000 ₽</span></label></div><p class="micro">После перевода: 240 → 255 тыс. ₽. Список помогает организовать шаг; это не проверка банка.</p>${button('Отметить шаг целиком', 'done')}`},
    {id:'S3',title:'Мостик к цели',idea:'Показываем небольшой реальный сдвиг, не притворяясь, что один шаг решает всё.',tone:'blue',html:`${eyebrow('Шаг 01 / Пополнить подушку')}<h3>На 15 000 ₽ ближе.<br>Это уже движение.</h3><div class="bridge"><div><span>СЕЙЧАС</span><b>240</b><small>тыс. ₽</small></div><span class="bridge-plus">+15 ↗</span><div><span>ПОСЛЕ ШАГА</span><b>255</b><small>тыс. ₽</small></div></div><p class="micro">До условной цели 492 000 ₽ после шага останется 237 000 ₽. Перевод выполните самостоятельно в своём банке.</p>${button('Перевёл(а), отметить', 'done')}`},
  ]},
]
const selected = new Set(['M1', 'F2', 'A2', 'S1'])
let filter='report', state='ready'
const done = new Set()
function reportComposition() {
  const option = id => { const node = document.querySelector(`[data-option="${id}"]`).closest('.option'); return node.outerHTML }
  return `<section class="report-page" aria-label="Полный отчёт — предложение композиции">
    <header class="report-title"><div><p class="eyebrow">ТВОЙ ПЛАН · вымышленная семья</p><h2>Разбор на ноябрь 2026</h2></div><span class="tag">Пример · данные уточнены</span></header>
    <section class="report-overview" aria-label="Четыре области">
      <article><h3>Бюджет · хорошо</h3><strong>18 %</strong><p>Дохода остаётся после расходов и платежей</p></article>
      <article><h3>Долги · хорошо</h3><strong>20 %</strong><p>Дохода уходит на платежи</p></article>
      <article><h3>Подушка · внимание</h3><strong>1,5 мес.</strong><p>Условная цель в примере — 3 месяца</p></article>
      <article><h3>Защита · нужны данные</h3><strong>Уточнить</strong><p>Страхование и вложения не разобраны в этом примере</p></article>
    </section>
    <section class="report-forecast" aria-label="Прогноз">${option('F2')}</section>
    <section class="report-answer" aria-label="Ответ и первый шаг">${option('A2')}${option('S1')}</section>
    <section class="report-overview report-pair" aria-label="Остаток и точность"><article><h3>Остаётся в месяц</h3><strong>+36 000 ₽</strong><p>200 000 − 124 000 − 40 000 ₽</p></article><article><h3>Точность ввода</h3><strong>Точные суммы</strong><p>Прогноз всё равно зависит от выбранных допущений</p></article></section>
    <h2>Подробно по областям</h2>
    <section class="report-details">${option('M1')}<div class="report-notes"><article><h3>Бюджет</h3><p>Доход — 200 000 ₽. Обычные расходы — 124 000 ₽. Платежи по долгам — 40 000 ₽.</p></article><article><h3>Долги</h3><p>Для сравнения способов погашения нужны остатки, ставки и сроки. Одного размера платежа недостаточно.</p></article><article><h3>Инвестиции и защита</h3><p>Добавьте сведения, чтобы разобрать эту область. Отсутствие данных не означает отсутствие риска.</p></article></div></section>
    <section class="report-notes report-tail"><article><h2>Остальные шаги</h2><p>После первого взноса пересмотрите бюджет следующего месяца и срок цели. Это демонстрация порядка, а не новые правила рекомендаций.</p></article><article><h2>Стресс-тест</h2><p>Потеря дохода, пополнение семьи, рост цен и сочетание событий остаются отдельными сценариями. Их результаты не выдумываем из кратких данных макета.</p></article><article><h2>Кредиты и цели</h2><p>На отпуск в примере выделено 10 000 ₽ в месяц. Сумма цели и срок не заданы — достижимость пока не оцениваем.</p></article></section>
    <p class="micro">Макет для проверки композиции. Прогноз F2 использует явно заданные изменения доходов и расходов; в приложении сценарии рассчитываются из введённых диапазонов. Условная цель и распределение остатка не меняют финансовые правила продукта.</p>
  </section>`
}
function render() {
  document.querySelector('#experiments').classList.toggle('selected-composition', filter === 'selected')
  document.querySelector('#experiments').innerHTML=sections.filter(s=>filter==='report'||filter==='selected'||filter==='all'||s.id===filter).map(s=>`<section class="experiment-section" id="${s.id}"><header class="section-heading"><span>${s.number}</span><div><h2>${s.title}</h2><p>${s.intro}</p></div></header><div class="options">${s.options.filter(o=>!['selected','report'].includes(filter)||selected.has(o.id)).map(o=>`<article class="option"><div class="option-label"><b>${o.id}</b><h3>${o.title}</h3></div><div class="specimen ${o.tone}" data-option="${o.id}">${state==='loading'?'<div class="state-box" role="status"><span>…</span><h4>Собираем данные</h4><p>Проверяем суммы для этого блока.</p><i></i><i></i></div>':state==='empty'?'<div class="state-box"><span>＋</span><h4>Пока нет данных</h4><p>Добавьте доходы, расходы и накопления.</p><button class="block-button" data-action="reset">Вернуться к примеру</button></div>':state==='error'?'<div class="state-box" role="alert"><span>!</span><h4>Не удалось загрузить</h4><p>Можно повторить запрос.</p><button class="block-button" data-action="reset">Повторить</button></div>':o.html}<div class="interaction-feedback" role="status" hidden></div></div><p class="option-idea">${o.idea}</p></article>`).join('')}</div></section>`).join('')
  if (filter === 'report') document.querySelector('#experiments').innerHTML = reportComposition()
  // Keep each monetary amount together, including explanatory copy on narrow screens.
  const walker = document.createTreeWalker(document.querySelector('#experiments'), NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    const pattern = /[+−-]?\d(?:[\d \u00a0]*\d)?(?:[,.]\d+)?[ \u00a0]*₽/g
    const matches = [...node.textContent.matchAll(pattern)]
    if (!matches.length) continue
    const fragment = document.createDocumentFragment()
    let start = 0
    for (const match of matches) {
      fragment.append(node.textContent.slice(start, match.index))
      const amount = document.createElement('bdi')
      amount.className = 'lab-money'
      amount.textContent = match[0]
      fragment.append(amount)
      start = match.index + match[0].length
    }
    fragment.append(node.textContent.slice(start))
    node.replaceWith(fragment)
  }
  document.querySelectorAll('.block-button').forEach(b=>{ if(state==='disabled') { b.disabled=true; b.insertAdjacentHTML('afterend','<p class="disabled-note">Доступно после завершения разбора</p>') } })
  if(state==='disabled') document.querySelectorAll('.todo-list input').forEach(i=>i.disabled=true)
  done.forEach(id=>{const el=document.querySelector(`[data-option="${id}"] [data-action="done"]`);if(el){el.textContent='Отмечено как сделанное ✓';el.setAttribute('aria-pressed','true')}})
}
document.addEventListener('click',e=>{const tab=e.target.closest('[data-filter]');if(tab){filter=tab.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===tab)));render();return}const button=e.target.closest('[data-action]');if(!button||button.disabled)return;if(button.dataset.action==='reset'){state='ready';document.querySelector('#state').value=state;render();return}const card=button.closest('[data-option]');const status=card.querySelector('.interaction-feedback');status.hidden=false;if(button.dataset.action==='done'){done.add(card.dataset.option);button.textContent='Отмечено как сделанное ✓';button.setAttribute('aria-pressed','true');status.textContent='Отметка в макете. Деньги не переводились, данные не сохранены.'}else{status.textContent='В примере: 200 000 − 124 000 − 40 000 = 36 000 ₽. 15 000 ₽ в резерв оставляют 21 000 ₽ на цель и свободный остаток. Это выбранное допущение, сумму можно пересмотреть.'}})
document.querySelector('#state').addEventListener('change',e=>{state=e.target.value;render()})
render()
