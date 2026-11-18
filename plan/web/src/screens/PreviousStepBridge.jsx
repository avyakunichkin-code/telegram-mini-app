import { useState } from 'react'
import { Button, ErrorNote } from '../components.jsx'
import { historyDelta, historyValue, wideValues, monthLabel, reportDate } from './history-format.js'
import './previous-step.css'

function status(step) {
  if (step.status === 'dismissed') return 'Шаг отложен'
  if (step.status === 'done') return step.actions_total && step.actions_done < step.actions_total ? 'Завершён вручную' : 'Шаг отмечен завершённым'
  return step.actions_done ? 'В процессе' : 'Без отметок'
}
function Progress({ step }) {
  return <p className="previous-progress">{step.actions_total == null ? 'В этом старом отчёте нет списка отдельных действий.' : `Отмечено ${step.actions_done} из ${step.actions_total} действий. История отметок сохранена.`}</p>
}
function Metric({ metric }) {
  if (!metric) return <p className="previous-progress">Для этого шага нет отдельной сравниваемой метрики.</p>
  return <div className={`previous-metric ${wideValues(metric) ? 'previous-metric-wide' : ''}`}><p>{metric.title}</p><div className="previous-values"><span><small>Было</small><b>{historyValue(metric.before, metric.unit)}</b></span><span aria-hidden="true">→</span><span><small>Стало</small><b>{historyValue(metric.after, metric.unit)}</b></span></div><p className="previous-delta">{historyDelta(metric)}</p></div>
}
export default function PreviousStepBridge({ context, children, onOpen, readOnly }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(null)
  const [step, ...others] = context.steps || []
  async function open() {
    if (busy || readOnly) return
    setBusy(true); setError(null)
    try { await onOpen(context.parent_checkup_id) } catch (err) { setError(err) }
    finally { setBusy(false) }
  }
  const framing = step?.status === 'dismissed' ? 'В прошлом отчёте вы отложили шаг' : step?.status === 'done' || step?.actions_done ? 'В прошлом отчёте вы отметили' : 'В прошлом отчёте было предложено'
  return <section className="previous-context t-full" aria-label="Прошлый и текущий шаг">
    <div className="previous-bridge"><article className="previous-page">
      {!step ? <><h3>Контекст прошлого чекапа недоступен.</h3><p className="previous-progress">Новый отчёт доступен. Прошлые расчёты не пересоздавались.</p></> : <>
        <div className="previous-header"><p>{framing}</p><span className={`previous-status previous-status-${step.status}`}>{status(step)}</span></div>
        <h3>{step.title}</h3><p className="previous-date">Отчёт от {reportDate(context.completed_at)} · данные за {monthLabel(context.as_of)}</p><Progress step={step} />
        {context.versions_differ && <p className="previous-warning">Версии расчёта различаются. Числа сохранены как есть; смена правил может влиять на сравнение.</p>}
        <Metric metric={step.metric} />
        <div className="previous-open"><Button variant="ghost" busy={busy} disabled={readOnly} onClick={open}>Открыть прошлый отчёт ↗</Button></div>
        <ErrorNote error={error} />
      </>}
    </article><div className="previous-current">{children}</div></div>
    {others.length > 0 && <details className="previous-others"><summary>Ещё {others.length} шага из прошлого отчёта</summary>{others.map(s => <article key={s.id || s.rule_key}><div className="previous-other-heading"><b>{s.title}</b><span className={`previous-status previous-status-${s.status}`}>{status(s)}</span></div><Progress step={s} />{s.metric && <p className="previous-other-metric">{s.metric.title}: {historyValue(s.metric.before, s.metric.unit)} → {historyValue(s.metric.after, s.metric.unit)} · {historyDelta(s.metric)}</p>}</article>)}</details>}
    <p className="previous-note">Отметка шага и изменение данных показаны отдельно. Разница между чекапами не подтверждает, что изменение вызвано этим действием.</p>
  </section>
}
