(() => {
  const people = {
    student: { name:'Студент', mate:'Студбилет', mateLower:'твой студбилет', color:'#047857', line:'Чистый старт — без долгов и активов', intro:'Первые шаги пройдём вместе. Начнём спокойно, по одному ходу.' },
    pro: { name:'Профессионал', mate:'Зарплатная карта', mateLower:'твоя зарплатная карта', color:'#6d28d9', line:'Аренда, авто и автокредит с первого периода', intro:'Я помогу освоиться с первыми шагами и привычным ритмом зарплаты.' },
    boss: { name:'Руководитель', mate:'Портфель', mateLower:'твой портфель', color:'#7a4a2a', line:'Своё жильё, ипотека и два автомобиля', intro:'Дел много, но начнём с простого. Первые шаги пройдём вместе.' },
    biz: { name:'Предприниматель', mate:'Смартфон', mateLower:'твой смартфон', color:'#eab308', line:'Ипотека, два авто и кредитная карта', intro:'Я на связи. Давай разберём первые шаги без лишней суеты.' },
  }
  const query = new URLSearchParams(location.search)
  let persona = people[query.get('persona')] ? query.get('persona') : 'student'
  let variant = query.get('variant') === 'a' ? 'a' : 'b'
  const image = (id, src, alt) => { const el = document.getElementById(id); el.src = src; el.alt = alt }
  function render() {
    const p = people[persona], base = `./assets/${persona}-${variant}`
    document.querySelectorAll('[data-persona]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.persona === persona)))
    document.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === variant)))
    document.querySelectorAll('[data-bind]').forEach(el => { el.textContent = p[el.dataset.bind] })
    document.getElementById('pair-description').textContent = `${p.name} + ${p.mate} · ${p.line}`
    document.getElementById('context-variant').textContent = `Вариант ${variant.toUpperCase()} · ${p.name}`
    image('current-art', `./assets/${persona}-before.webp`, `Исходная пара: ${p.name} и ${p.mate}`)
    image('art-a', `./assets/${persona}-a.webp`, `${p.name} и ${p.mate} — вариант A`)
    image('art-b', `./assets/${persona}-b.webp`, `${p.name} и ${p.mate} — вариант B`)
    image('pick-art', `${base}-person.webp`, `${p.name} на карточке выбора жизни`)
    image('meet-art', `${base}.webp`, `Знакомство: ${p.name} и ${p.mate}`)
    image('avatar-art', `${base}-avatar.webp`, `Аватар: ${p.name}, 40 пикселей`)
    image('mate-small', `${base}-mate.webp`, `${p.mate}, 56 пикселей`)
    image('person-small', `${base}-person.webp`, `${p.name}, 108 пикселей`)
    image('guide-art', `${base}-mate.webp`, '')
    const grid = document.getElementById('family-grid')
    grid.replaceChildren(...Object.entries(people).map(([key, p]) => {
      const card = document.createElement('article'); card.className = 'family-card'; card.style.setProperty('--pair-color', p.color)
      const art = document.createElement('img'); art.src = `./assets/${key}-${variant}.webp`; art.alt = `${p.name} и ${p.mate}`; art.loading = 'lazy'
      const marker = document.createElement('span'); marker.className = 'family-card__line'; marker.setAttribute('aria-hidden', 'true')
      const title = document.createElement('h3'); title.textContent = p.name
      const mate = document.createElement('p'); mate.textContent = `Напарник — ${p.mate.toLowerCase()}`
      card.append(art, marker, title, mate); return card
    }))
    const next = new URL(location.href); next.searchParams.set('persona', persona); next.searchParams.set('variant', variant)
    history.replaceState(null, '', next)
  }
  document.querySelectorAll('[data-persona]').forEach(b => b.addEventListener('click', () => { persona = b.dataset.persona; render() }))
  document.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => { variant = b.dataset.variant; render() }))
  document.getElementById('theme-toggle').addEventListener('click', e => {
    const dark = document.documentElement.dataset.theme !== 'dark'
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    e.currentTarget.setAttribute('aria-pressed', String(dark)); e.currentTarget.textContent = dark ? 'Светлая тема' : 'Тёмная тема'
  })
  render()
})()
