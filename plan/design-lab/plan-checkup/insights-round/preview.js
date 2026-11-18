const $ = id => document.getElementById(id)
const NB = String.fromCharCode(160)
const rub = x => `${x < 0 ? '−' : ''}${Math.round(Math.abs(x)).toLocaleString('ru-RU').replace(/\s/g, NB)}${NB}₽`
const esc = s => { const el = document.createElement('i'); el.textContent = String(s); return el.innerHTML }
const span = v => (v.capped ? `${v.months}+${NB}мес.` : `${v.months}${NB}мес.`)
const pct = x => (x == null ? '—' : `${Math.round(x * 100)}${NB}%`)
const SECTION = { incomes: 'Доходы', expenses: 'Расходы', liabilities: 'Кредиты и долги', savings: 'Накопления', goals: 'Цели', decision: 'Ваше решение' }
const STATUS = { comfortable: ['В комфортной зоне', ''], stretch: ['Выше комфорта, в пределах порога', 'warn'], over: ['Выше расчётного предела', 'bad'] }
const row = (a, b) => `<li><span>${a}</span><b>${b}</b></li>`

function checks(list) {
  if (!list.length) return '<h2>Данные выглядят полными</h2><p class="muted">Явных противоречий в анкете нет.</p>'
  const fix = list.filter(c => c.severity === 'fix').length
  return `<h2>${fix ? `Исправьте перед выводами: ${fix}` : 'Стоит перепроверить'}</h2><ul class="checks">${list.map(c => `<li class="${c.severity}">${esc(c.text)} <small>Раздел: ${SECTION[c.section]}</small></li>`).join('')}</ul>`
}

function plan(p) {
  if (p.mode === 'deficit') {
    const hard = p.remaining_gap > 0
    return `<p class="eyebrow">Этот месяц</p><h2>Не хватает ${rub(p.gap)} в месяц</h2><ul class="rows">${row('Можно закрыть статьями «по желанию»', rub(p.covered_by_wants))}${row('Останется закрыть другим способом', `<span class="${hard ? 'negative' : ''}">${rub(p.remaining_gap)}</span>`)}${row('Платежи по долгам в месяц', rub(p.debt_payments))}</ul><p>${hard ? 'Только сокращением необязательных трат разрыв не закрыть: нужен пересмотр обязательных статей, дохода или условий долга.' : 'Разрыв закрывается сокращением необязательных трат.'}</p>`
  }
  const total = p.free_cashflow || 1
  const risk = p.range_risk ? `<p class="negative">На нижней границе ваших диапазонов остаток ${rub(p.pessimistic_free_cashflow)}. Регулярные переводы пока рискованны.</p>` : ''
  const short = p.goals.filter(g => g.shortfall > 0).map(g => `<p class="muted">«${esc(g.title)}»: нужно ${rub(g.needed)}/мес, в этом плане ${rub(g.funded)}.</p>`).join('')
  const overlap = p.overlap > 0 ? `<p class="muted">Раньше отдельные блоки отчёта обещали на ${rub(p.overlap)} больше, чем остаётся.</p>` : ''
  return `<p class="eyebrow">Этот месяц</p><h2>Куда направить ${rub(p.free_cashflow)}</h2><div class="bar" aria-hidden="true">${p.allocations.map(a => `<i class="c-${a.key}" style="width:${a.amount / total * 100}%"></i>`).join('')}</div><ul class="rows">${p.allocations.map(a => row(`<i class="dot c-${a.key}"></i>${esc(a.title)}${a.target ? ` <small>${esc(a.target)}</small>` : ''}`, rub(a.amount))).join('')}</ul>${short}${overlap}${risk}`
}

function runway(r) {
  if (!r) return '<h2>Запас хода</h2><p class="muted">Нет ежемесячных расходов для расчёта.</p>'
  const n = r.no_income, l = r.layers
  return `<p class="eyebrow">Если доход пропадёт</p><h2>Запас ${rub(r.available)}</h2><div class="big"><div><small>Как сейчас</small><strong>${span(n.full)}</strong></div><div><small>Только обязательное</small><strong>${span(n.essential)}</strong></div></div><ul class="rows">${row('На нижней границе диапазонов', `${span(n.full_pessimistic)} / ${span(n.essential_pessimistic)}`)}${r.main_earner_lost ? row('Без крупнейшего дохода', `${span(r.main_earner_lost.full)} / ${span(r.main_earner_lost.essential)}`) : ''}${row('Счета и подушка', rub(l.accounts))}${l.deposits ? row('Вклады', rub(l.deposits)) : ''}${l.liquid_investments ? row('Вложения, доступные за дни', rub(l.liquid_investments)) : ''}${l.slow_investments ? row('Не входит: забрать долго', rub(l.slow_investments)) : ''}</ul><p class="muted">${esc(r.assumptions)}</p>`
}

function debts(d) {
  if (!d) return '<h2>Цена долгов</h2><p class="muted">Долгов нет.</p>'
  const items = d.items.map(i => row(`${esc(i.title)} <small>${i.annual_rate}${NB}%</small>${i.not_amortizing ? ' <span class="tag bad">не гасится</span>' : ''}`, i.not_amortizing ? `не хватает ${rub(i.payment_gap)}/мес` : `${rub(i.remaining_interest)} · ${i.months}${NB}мес.`)).join('')
  return `<p class="eyebrow">Цена долгов</p><h2>${pct(d.totals.interest_share)} платежей уходит на проценты</h2><p class="muted">За месяц: проценты ${rub(d.totals.monthly_interest)}, платежи ${rub(d.totals.monthly_payments)}. Справа — переплата и срок при текущем платеже.</p><ul class="rows">${items}</ul>`
}

function limits(l) {
  const [text, tone] = STATUS[l.status]
  const stress = l.income_loss.months_until_negative ? `кончатся через ${l.income_loss.months_until_negative}${NB}мес.` : 'держатся весь год'
  return `<p class="eyebrow">Ваше решение</p><h2>Платёж ${rub(l.payment)} <span class="tag ${tone}">${text}</span></h2><ul class="rows">${row('Комфортный платёж', rub(l.comfortable.payment))}${row('Расчётный предел платежа', rub(l.ceiling.payment))}${row('Посильная цена при вашем взносе', rub(l.ceiling.price))}${row('Останется после взноса', `<span class="${l.cash_after_down_payment < 0 ? 'negative' : ''}">${rub(l.cash_after_down_payment)}</span>`)}${row('Запас после взноса', `${l.reserve_months_after == null ? '—' : String(l.reserve_months_after).replace('.', ',')} из ${l.reserve_target_months}${NB}мес.`)}${row('Если пропадёт крупнейший доход, деньги', stress)}</ul><p class="muted">${esc(l.assumptions)}</p>`
}

let tab = 'money'
function render() {
  const variant = $('variant').value, state = $('state').value, data = window.FIXTURE[$('case').value].insights
  $('variant-title').textContent = $('variant').selectedOptions[0].text
  $('notice').textContent = { ready: '', loading: 'Считаем…', legacy: 'Этот итоговый отчёт сохранён раньше: дополнительных расчётов в нём нет, задним числом он не пересчитывается.', error: 'Не удалось загрузить отчёт. Попробуйте ещё раз.', offline: 'Нет сети · только чтение сохранённого отчёта.' }[state]
  const content = $('content')
  content.hidden = ['loading', 'legacy', 'error'].includes(state)
  if (content.hidden) return
  const blocks = { checks: checks(data.data_checks), money: plan(data.cash_plan), reserve: runway(data.runway), debts: debts(data.debt_costs), decision: data.decision_limits ? limits(data.decision_limits) : null }
  if (variant === 'A') {
    content.innerHTML = `<div class="grid"><section class="card wide" id="block-checks">${blocks.checks}</section><section class="card dark wide" id="block-money">${blocks.money}</section><section class="card" id="block-reserve">${blocks.reserve}</section><section class="card" id="block-debts">${blocks.debts}</section>${blocks.decision ? `<section class="card wide" id="block-decision">${blocks.decision}</section>` : ''}</div>`
    return
  }
  const tabs = [['money', 'Деньги'], ['reserve', 'Запас'], ['debts', 'Долги'], ...(blocks.decision ? [['decision', 'Решение']] : [])]
  if (!tabs.some(t => t[0] === tab)) tab = 'money'
  content.innerHTML = `<div class="sheet"><section class="card" id="block-checks">${blocks.checks}</section><nav class="tabs" aria-label="Темы">${tabs.map(([k, t]) => `<button data-tab="${k}" aria-current="${k === tab}">${t}</button>`).join('')}</nav><section class="card" id="block-${tab}">${blocks[tab]}</section></div>`
  content.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render() }))
}
;['variant', 'case', 'state'].forEach(id => $(id).addEventListener('change', render))
render()
