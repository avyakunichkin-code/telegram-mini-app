import { pct, rub } from '../../format.js'
import './insights.css'

const NB = ' '
const SECTION = { incomes: 'Доходы', expenses: 'Расходы', liabilities: 'Кредиты и долги', savings: 'Накопления', goals: 'Цели', decision: 'Ваше решение' }
const STATUS = { comfortable: ['В комфортной зоне', ''], stretch: ['Выше комфорта, в пределах порога', 'warn'], over: ['Выше расчётного предела', 'bad'] }
const span = v => `${v.months}${v.capped ? '+' : ''}${NB}мес.`

function Row({ label, children }) {
  return <li><span>{label}</span><b>{children}</b></li>
}

function Checks({ list }) {
  if (!list.length) return <section className="insight-card insight-wide" aria-label="Проверка данных"><h2>Данные выглядят полными</h2><p className="insight-note">Явных противоречий в анкете нет.</p></section>
  const fix = list.filter(c => c.severity === 'fix').length
  return <section className="insight-card insight-wide" aria-label="Проверка данных">
    <h2>{fix ? `Исправьте перед выводами: ${fix}` : 'Стоит перепроверить'}</h2>
    <ul className="insight-checks">{list.map((c, i) => <li key={`${c.key}-${i}`} className={c.severity}>{c.text} <small>Раздел: {SECTION[c.section]}</small></li>)}</ul>
  </section>
}

function CashPlan({ plan }) {
  if (plan.mode === 'deficit') {
    const hard = plan.remaining_gap > 0
    return <section className="insight-card insight-dark insight-wide" aria-label="План остатка">
      <p className="eyebrow">Этот месяц</p><h2>Не хватает {rub(plan.gap)} в месяц</h2>
      <ul className="insight-rows">
        <Row label="Можно закрыть статьями «по желанию»">{rub(plan.covered_by_wants)}</Row>
        <Row label="Останется закрыть другим способом">{rub(plan.remaining_gap)}</Row>
        <Row label="Платежи по долгам в месяц">{rub(plan.debt_payments)}</Row>
      </ul>
      <p>{hard ? 'Только сокращением необязательных трат разрыв не закрыть: нужен пересмотр обязательных статей, дохода или условий долга.' : 'Разрыв закрывается сокращением необязательных трат.'}</p>
    </section>
  }
  const total = plan.free_cashflow || 1
  return <section className="insight-card insight-dark insight-wide" aria-label="План остатка">
    <p className="eyebrow">Этот месяц</p><h2>Куда направить {rub(plan.free_cashflow)}</h2>
    {plan.allocations.length > 0 && <div className="insight-bar" aria-hidden="true">{plan.allocations.map(a => <i key={a.key} className={`c-${a.key}`} style={{ width: `${a.amount / total * 100}%` }} />)}</div>}
    <ul className="insight-rows">{plan.allocations.map(a => <Row key={a.key} label={<><i className={`insight-dot c-${a.key}`} />{a.title}{a.target && <small> {a.target}</small>}</>}>{rub(a.amount)}</Row>)}</ul>
    {plan.goals.filter(g => g.shortfall > 0).map(g => <p className="insight-note" key={g.id || g.title}>«{g.title}»: нужно {rub(g.needed)}/мес, в этом плане {rub(g.funded)}.</p>)}
    {plan.overlap > 0 && <p className="insight-note">Отдельные блоки отчёта вместе обещают на {rub(plan.overlap)} больше, чем остаётся.</p>}
    {plan.range_risk && <p className="insight-risk">На нижней границе ваших диапазонов остаток {rub(plan.pessimistic_free_cashflow)}. Регулярные переводы пока рискованны.</p>}
  </section>
}

function Runway({ runway }) {
  const n = runway.no_income, l = runway.layers, lost = runway.main_earner_lost
  return <section className="insight-card" aria-label="Запас хода">
    <p className="eyebrow">Если доход пропадёт</p><h2>Запас {rub(runway.available)}</h2>
    <div className="insight-big"><div><small>Как сейчас</small><strong>{span(n.full)}</strong></div><div><small>Только обязательное</small><strong>{span(n.essential)}</strong></div></div>
    <ul className="insight-rows">
      <Row label="На нижней границе диапазонов">{span(n.full_pessimistic)} / {span(n.essential_pessimistic)}</Row>
      {lost && <Row label="Без крупнейшего дохода">{span(lost.full)} / {span(lost.essential)}</Row>}
      <Row label="Счета и подушка">{rub(l.accounts)}</Row>
      {l.deposits > 0 && <Row label="Вклады">{rub(l.deposits)}</Row>}
      {l.liquid_investments > 0 && <Row label="Вложения, доступные за дни">{rub(l.liquid_investments)}</Row>}
      {l.slow_investments > 0 && <Row label="Не входит: забрать долго">{rub(l.slow_investments)}</Row>}
    </ul>
    <p className="insight-note">{runway.assumptions}</p>
  </section>
}

function DebtCosts({ debts }) {
  return <section className="insight-card" aria-label="Цена долгов">
    <p className="eyebrow">Цена долгов</p><h2>{pct(debts.totals.interest_share)} платежей уходит на проценты</h2>
    <p className="insight-note">За месяц: проценты {rub(debts.totals.monthly_interest)}, платежи {rub(debts.totals.monthly_payments)}. Справа — переплата и срок при текущем платеже.</p>
    <ul className="insight-rows">{debts.items.map(i => <Row key={i.id} label={<>{i.title} <small>{i.annual_rate}{NB}%</small>{i.not_amortizing && <> <span className="insight-tag bad">не гасится</span></>}</>}>{i.not_amortizing ? `не хватает ${rub(i.payment_gap)}/мес` : `${rub(i.remaining_interest)} · ${i.months}${NB}мес.`}</Row>)}</ul>
  </section>
}

function DecisionLimits({ limits }) {
  const [text, tone] = STATUS[limits.status]
  const months = limits.income_loss.months_until_negative
  const reserve = limits.reserve_months_after == null ? '—' : String(limits.reserve_months_after).replace('.', ',')
  return <section className="insight-card insight-wide" aria-label="Пределы решения">
    <p className="eyebrow">Ваше решение</p><h2>Платёж {rub(limits.payment)} <span className={`insight-tag ${tone}`}>{text}</span></h2>
    <ul className="insight-rows">
      <Row label="Комфортный платёж">{rub(limits.comfortable.payment)}</Row>
      <Row label="Расчётный предел платежа">{rub(limits.ceiling.payment)}</Row>
      <Row label="Посильная цена при вашем взносе">{rub(limits.ceiling.price)}</Row>
      <Row label="Останется после взноса">{rub(limits.cash_after_down_payment)}</Row>
      <Row label="Запас после взноса">{reserve} из {limits.reserve_target_months}{NB}мес.</Row>
      <Row label="Если пропадёт крупнейший доход, деньги">{months ? `кончатся через ${months}${NB}мес.` : 'держатся весь год'}</Row>
    </ul>
    <p className="insight-note">{limits.assumptions}</p>
  </section>
}

export default function Insights({ insights }) {
  if (!insights) return <p className="insight-legacy" role="status">Этот итоговый отчёт сохранён раньше: дополнительных расчётов в нём нет, задним числом он не пересчитывается.</p>
  return <div className="insights">
    <Checks list={insights.data_checks} />
    <CashPlan plan={insights.cash_plan} />
    {insights.runway && <Runway runway={insights.runway} />}
    {insights.debt_costs && <DebtCosts debts={insights.debt_costs} />}
    {insights.decision_limits && <DecisionLimits limits={insights.decision_limits} />}
  </div>
}
