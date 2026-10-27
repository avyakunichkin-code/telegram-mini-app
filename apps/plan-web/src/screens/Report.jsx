import { useState } from 'react'
import { api } from '../api.js'
import { Button, Card, ErrorNote, Light, LineChart, Verdict } from '../components.jsx'
import { monthLabel, pct, plural, rub } from '../format.js'

const PRECISION = {
  draft: ['Черновая точность', 'Много ответов диапазонами или оценок — уточните разделы, и разбор станет точнее.'],
  approximate: ['Приблизительная точность', 'Часть цифр примерная. Для итогового разбора стоит уточнить крупные суммы.'],
  refined: ['Уточнённые данные', 'Почти все суммы введены точно.'],
}

function AreaMetrics({ area }) {
  const m = area.metrics
  switch (area.key) {
    case 'budget':
      return (
        <dl className="kv">
          <dt>Доход</dt><dd>{rub(m.income)}</dd>
          <dt>Расходы и платежи</dt><dd>{rub(m.outflow)}</dd>
          <dt>Остаётся</dt><dd className={m.free_cashflow < 0 ? 'neg' : ''}>{rub(m.free_cashflow)}</dd>
          <dt>Норма сбережений</dt><dd>{m.savings_rate === null ? '—' : pct(m.savings_rate)}</dd>
        </dl>
      )
    case 'debts':
      return (
        <dl className="kv">
          <dt>Платежи / доход</dt><dd>{m.dti_percent.toFixed(0)} %</dd>
          <dt>Всего долга</dt><dd>{rub(m.total_debt)}</dd>
          <dt>Просрочка</dt><dd className={m.overdue > 0 ? 'neg' : ''}>{rub(m.overdue)}</dd>
        </dl>
      )
    case 'cushion':
      return (
        <dl className="kv">
          <dt>Подушка</dt><dd>{rub(m.cushion)}</dd>
          <dt>Хватит на</dt><dd>{m.months.toFixed(1)} мес. из {m.target_months}</dd>
          <dt>Цели</dt><dd>{m.goals_realistic ? 'реалистичны' : 'есть нереалистичные'}</dd>
        </dl>
      )
    default:
      return (
        <>
          <dl className="kv"><dt>Вложения</dt><dd>{rub(m.investments)}</dd></dl>
          {area.flags?.length ? (
            <ul className="flags">{area.flags.map((f) => <li key={f.key + f.text}>{f.text}</li>)}</ul>
          ) : (
            <p className="muted">Явных пробелов в защите не видно.</p>
          )}
        </>
      )
  }
}

function Steps({ steps, final, onPatch }) {
  return (
    <ol className="steps">
      {steps.map((s) => (
        <li key={s.rule_key} className={`step step-${s.status}`}>
          <span className="step-rank">{s.rank}</span>
          <div>
            <b>{s.title}</b>
            <p>{s.why}</p>
            {final && s.id && (
              <div className="row gap">
                {s.status !== 'done' ? (
                  <button className="chip" onClick={() => onPatch(s, 'done')}>✓ Сделано</button>
                ) : (
                  <span className="done-note">Сделано</span>
                )}
                {s.status === 'suggested' && <button className="link" onClick={() => onPatch(s, 'dismissed')}>Не подходит</button>}
                {s.status !== 'suggested' && <button className="link" onClick={() => onPatch(s, 'suggested')}>Вернуть</button>}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function DebtStrategy({ d }) {
  if (!d.current || d.current.months === 0) return <p className="muted">Кредитов нет.</p>
  const rows = [
    ['Как сейчас', d.current],
    [`Лавина (+${rub(d.extra)}/мес на самый дорогой)`, d.avalanche],
    [`Снежный ком (+${rub(d.extra)}/мес на самый маленький)`, d.snowball],
  ]
  return (
    <table className="table">
      <thead><tr><th>Стратегия</th><th>Все кредиты закрыты</th><th>Переплата</th></tr></thead>
      <tbody>
        {rows.map(([name, p]) => (
          <tr key={name}>
            <td>{name}</td>
            <td>{p.months ? `${monthLabel(p.payoff_month)} · ${p.months} ${plural(p.months, 'мес.', 'мес.', 'мес.')}` : 'не гасится'}</td>
            <td>{rub(p.total_interest)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function Report({ checkup, report, onRefine, onComplete, onNew, onReport }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [p1, p2] = PRECISION[report.precision]
  const ea = report.entry_answer

  async function complete() {
    setBusy(true)
    setError(null)
    try {
      await onComplete()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function patch(step, status) {
    try {
      const fresh = await api.patchStep(step.id, status)
      onReport({ ...report, steps: report.steps.map((s) => (s.id === step.id ? { ...s, ...fresh } : s)) })
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="stack report">
      <div className="report-head">
        <div>
          <p className="eyebrow">{report.final ? 'Итоговый разбор' : 'Черновой разбор'} · на {monthLabel(report.as_of)}</p>
          <h1>{ea.question}</h1>
        </div>
        <span className={`precision precision-${report.precision}`} title={p2}>{p1}</span>
      </div>

      <Card className={`answer answer-${ea.verdict}`} aside={<Verdict value={ea.verdict} />}>
        <p className="answer-text">{ea.text}</p>
      </Card>

      <Card title="С чего начать">
        <Steps steps={report.steps} final={report.final} onPatch={patch} />
      </Card>

      <div className="areas">
        {report.areas.map((a) => (
          <Card key={a.key} title={a.title} aside={<Light value={a.light} />} className={`area area-${a.light}`}>
            <AreaMetrics area={a} />
          </Card>
        ))}
      </div>

      <Card title="Прогноз на 12 месяцев" aside={<span className="muted">если ничего не менять</span>}>
        <LineChart series={[
          { name: 'Обычный сценарий', tone: 'base', points: report.forecast.base },
          { name: 'Пессимистичный', tone: 'pess', points: report.forecast.pessimistic },
        ]} />
        <p className="legend"><span className="sw tone-base" /> по серединам диапазонов <span className="sw tone-pess" /> худший край диапазонов</p>
        <p className="muted">Свободный остаток — {rub(report.free_cashflow, { sign: true })} в месяц. Капитал семьи — {rub(report.net_worth)}.</p>
      </Card>

      <h2>Стресс-тест</h2>
      <div className="scenarios">
        {report.scenarios.map((s) => (
          <Card key={s.id} title={s.title} aside={<Verdict value={s.verdict} />} className={`scenario scenario-${s.verdict}`}>
            <p className="muted">{s.description}</p>
            <LineChart compact height={70} series={[{ name: s.title, tone: s.verdict, points: s.series }]} />
            <p>
              {s.months_until_negative
                ? `Деньги кончатся через ${s.months_until_negative} ${plural(s.months_until_negative, 'месяц', 'месяца', 'месяцев')}.`
                : 'Бюджет выдерживает все 12 месяцев.'}
              {' '}Минимум на счёте — {rub(s.min_liquid)}.
            </p>
          </Card>
        ))}
      </div>

      <Card title="Кредиты: как закрыть быстрее">
        <DebtStrategy d={report.debt_strategy} />
      </Card>

      {report.goals.length > 0 && (
        <Card title="Цели">
          <table className="table">
            <thead><tr><th>Цель</th><th>Нужно в месяц</th><th>Срок</th></tr></thead>
            <tbody>
              {report.goals.map((g) => (
                <tr key={g.title}>
                  <td>{g.title} · {rub(g.target_amount)}</td>
                  <td>{rub(g.monthly_needed)}</td>
                  <td>{g.realistic ? `${monthLabel(g.target_month)} ✓` : `реально: ${g.realistic_month ? monthLabel(g.realistic_month) : '—'}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ErrorNote error={error} />
      {!report.final ? (
        <div className="actions sticky">
          <Button variant="ghost" onClick={onRefine}>Уточнить данные</Button>
          <Button busy={busy} onClick={complete}>Получить итоговый разбор</Button>
        </div>
      ) : (
        <div className="actions">
          <Button variant="ghost" onClick={onNew}>Пересчитать позже — новый чекап</Button>
        </div>
      )}
      <p className="disclaimer">{report.disclaimer} Правила v{report.rules_version} · ядро {report.fincore_version} · чекап {checkup.id}</p>
    </div>
  )
}
