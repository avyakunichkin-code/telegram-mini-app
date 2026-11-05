import { Light, Money } from '../components.jsx'
import { monthLabel, rub } from '../format.js'

/** M1: target comes from this report's rules, never from the lab example. */
export function ReserveVessel({ area, outflow, draft }) {
  const { cushion, months, target_months: targetMonths } = area.metrics
  const target = outflow * targetMonths
  const share = target > 0 ? Math.min(100, Math.max(0, cushion / target * 100)) : 0
  return <section className={`card reserve-card area-${area.light} t-area`}>
    <header className="card-head"><h3>{area.title}</h3><Light value={area.light} /></header>
    <div className="reserve-layout">
      <div>
        <p className="reserve-heading">{outflow > 0 ? <>Запас на {months.toFixed(1).replace('.', ',')} мес.</> : 'Уточните расходы'}</p>
        <p className="reserve-amount"><Money value={cushion} draft={draft} /></p>
        <p>{target > 0 ? <>из <Money value={target} draft={draft} /></> : 'Цель в рублях появится после ввода расходов'}</p>
      </div>
      <div className="reserve-vessel" aria-hidden="true">
        <span className="reserve-goal">Цель</span>
        <div className="reserve-liquid" style={{ height: `${share}%` }} />
        <b>{target > 0 ? `${Math.round(share)} %` : '—'}</b>
      </div>
    </div>
    <div className="reserve-foot"><span>Цель — {targetMonths} мес. расходов</span><span>{area.metrics.goals_realistic ? 'Цели реалистичны' : 'Есть нереалистичные цели'}</span></div>
  </section>
}

/** F2: endpoints are the API forecasts; lower/upper input bounds define pessimism. */
export function ForecastTracks({ forecast, starting, draft }) {
  const base = forecast.base
  const pess = forecast.pessimistic
  const negative = pess.find(p => p.liquid < 0)
  return <section className="card t-full forecast forecast-tracks">
    <p className="eyebrow">Деньги на счетах · {base.length} мес.</p>
    <h2>Не один прогноз.<br />Два ориентира.</h2>
    <p className="forecast-start">Сейчас <b><Money value={starting} draft={draft} /></b></p>
    <div className="forecast-paths">
      <div className="forecast-path"><span>Как сейчас</span><strong><Money value={base.at(-1)?.liquid} draft={draft} /></strong><span>{monthLabel(base.at(-1)?.month)}</span></div>
      <div className="forecast-path forecast-path-pess"><span>Если хуже</span><strong><Money value={pess.at(-1)?.liquid} draft={draft} /></strong><span>{monthLabel(pess.at(-1)?.month)}</span></div>
    </div>
    <p className="forecast-assumption">«Как сейчас» — середины введённых диапазонов. «Если хуже» — доходы и накопления по нижней границе, расходы по верхней. При точных суммах прогнозы совпадают. Это расчёт по введённым данным, а не обещание результата.</p>
    {negative && <p className="bars-warn">Если доходы окажутся по нижней границе, а расходы — по верхней, деньги кончатся в {monthLabel(negative.month)}.</p>}
  </section>
}

export function StepResult({ step, cushion }) {
  const n = step.numbers || {}
  const amount = step.rule_key === 'first_cushion' ? n.need : step.rule_key === 'cushion_target' ? n.monthly : null
  if (amount > 0) return <p className="ticket-result">После {step.rule_key === 'cushion_target' ? 'месячного взноса' : 'пополнения'}: <b>{rub(cushion)} → {rub(cushion + amount)}</b></p>
  return <p className="ticket-result">Результат шага можно оценить в следующем чекапе.</p>
}
