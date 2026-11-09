import { monthLabel, plural, rub } from '../format.js'
import './goal-routes.css'

function Medal() {
  return <div className="gr-art" aria-hidden="true"><span className="gr-spark">✦</span><svg viewBox="0 0 80 80" fill="none"><path d="M24 50 18 76 39 65 60 76 55 50" fill="#45694f"/><circle cx="40" cy="32" r="28" fill="#f9db78" stroke="#b58c35" strokeWidth="2"/><circle cx="40" cy="32" r="22" stroke="#b58c35" strokeDasharray="2 4"/><path d="m28 32 8 8 16-17" stroke="#273d36" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="gr-spark gr-spark-end">✧</span><b>ВАША ЦЕЛЬ · 100%</b></div>
}
function Change({ goal }) {
  const p = goal.progress
  return <>{p.delta == null ? 'Пока нет сравнения с прошлым чекапом' : `${rub(p.delta, { sign: true })} ${p.months > 0 ? `за ${p.months} ${plural(p.months, 'месяц', 'месяца', 'месяцев')}` : 'между чекапами'}`}</>
}
function Route({ goal: g, asOf, available }) {
  const p = g.progress, done = p.achieved
  const wide = [g.saved_amount, g.target_amount, p.before, p.observed_monthly, g.monthly_needed].some(n => rub(n).length > 13)
  const percent = g.target_amount > 0 ? Math.min(100, Math.floor(g.saved_amount / g.target_amount * 100)) : 100
  if (done) return <div className={`gr-achievement ${wide ? 'gr-wide' : ''}`}>
    <Medal/><div className="gr-congratulation"><span className="gr-kicker">МАРШРУТ ПРОЙДЕН</span><h3>Получилось.<br/><em>Вы это сделали!</em></h3><p>«{g.title}» — нужная сумма собрана.<br/>За этим результатом ваши решения. Есть повод порадоваться собой.</p><div className="gr-total"><strong>{rub(g.saved_amount)}</strong><small>из запланированных {rub(g.target_amount)}</small></div></div>
    <div className="gr-finish"><span>{p.before == null ? 'Первая точка' : `${monthLabel(p.before_as_of)} · ${rub(p.before)}`}</span><i aria-hidden="true"/><b>{monthLabel(asOf)} · {rub(g.saved_amount)} ✓</b></div><p className="gr-footnote">По данным вашего чекапа · {monthLabel(asOf)}. Сохраните этот момент в своей истории.</p>
  </div>
  const pace = p.observed_monthly
  const badge = pace == null ? p.before == null ? 'Первая точка' : 'Темп пока неизвестен' : pace <= 0 ? 'Нужен новый план' : g.monthly_needed != null && pace < g.monthly_needed ? 'Темп ниже нужного' : 'Есть движение'
  return <div className={`gr-route ${wide ? 'gr-wide' : ''}`}><div className="gr-main"><span className="gr-kicker">МАРШРУТ ЦЕЛИ</span><h3>{g.title}</h3><span className="gr-badge">{badge}</span><div className="gr-milestones"><div><small>{p.before_as_of ? monthLabel(p.before_as_of) : 'Раньше'} · было</small><b>{rub(p.before)}</b></div><div><small>{monthLabel(asOf)} · сейчас</small><b>{rub(g.saved_amount)}</b></div><div><small>Ваша цель</small><b>{rub(g.target_amount)}</b></div></div><div className="gr-meter" role="img" aria-label={`Накоплено ${percent}%`}><i style={{ width: `${percent}%` }}/></div><p className="gr-change"><Change goal={g}/> · {percent}% пути</p></div>
    <div className="gr-side"><div className="gr-fields"><div><small>Ваш срок</small><b>{g.target_month ? monthLabel(g.target_month) : 'Добавьте срок'}</b><small>{g.monthly_needed == null ? 'Тогда рассчитаем нужный взнос.' : `Нужно ${rub(g.monthly_needed)}/мес.`}</small></div><div><small>Наблюдаемый темп</small><b>{pace == null ? 'Пока неизвестен' : pace <= 0 ? 'Нет положительного темпа' : `${rub(pace)}/мес.`}</b></div></div><div className="gr-estimate"><small>При наблюдаемом темпе</small><b>{p.estimated_month ? monthLabel(p.estimated_month) : 'Пока нельзя оценить'}</b><small>{p.previous_estimated_month ? `В прошлом отчёте: ${monthLabel(p.previous_estimated_month)}.` : 'Предыдущей оценки нет.'}</small></div><p className="gr-footnote">Свободный остаток семьи сейчас: {rub(available)}/мес. Он ещё не распределён по целям.</p></div>
  </div>
}
export default function GoalRoutes({ goals, asOf, available }) {
  if (!goals?.length) return null
  function goal(g) {
    return <><Route goal={g} asOf={asOf} available={available}/><p className="gr-note">{g.progress.achieved ? 'Сумма подтверждена вашими данными в чекапе. Покупка или перевод не проверяются приложением.' : <>Темп — изменение накоплений между чекапами, делённое на число месяцев. Это может включать разовое пополнение. Оценка срока предполагает сохранение темпа и не учитывает доходность.{g.progress.months != null && g.progress.months <= 0 && ' Между чекапами не прошёл месяц — темп пока не оцениваем.'}</>}{g.progress.target_changed && ` Сумма цели изменилась: было ${rub(g.progress.previous_target_amount)}, стало ${rub(g.target_amount)}. Старую оценку не пересчитываем.`}</p></>
  }
  return <section className="goal-routes t-full" aria-label="Прогресс целей"><h2>Цели в движении</h2><div className="gr-surface">{goal(goals[0])}{goals.slice(1).map(g => <details className="gr-other" key={g.id || g.title}><summary>{g.progress.achieved ? '✓ ' : ''}{g.title} · {rub(g.saved_amount)} из {rub(g.target_amount)}</summary>{goal(g)}</details>)}</div></section>
}
