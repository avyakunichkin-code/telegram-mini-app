import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { AreaMeter, Button, Card, ErrorNote, Light, LineChart, Money, Precision, Ruler, Verdict } from '../components.jsx'
import { monthLabel, pct, plural, rub } from '../format.js'

const PRECISION = {
  draft: ['Черновик', 'Много ответов диапазонами или оценок — уточните разделы, и разбор станет точнее.', 'карандашом — это прикидка, уточните крупные суммы'],
  approximate: ['Приблизительно', 'Часть цифр примерная. Для итогового разбора стоит уточнить крупные суммы.', 'часть цифр ещё карандашом'],
  refined: ['Уточнено', 'Почти все суммы введены точно.', 'почти всё обведено ручкой'],
}

// Точность прошлого показа отчёта: если она выросла, цифры «обводятся ручкой» поверх карандаша
let lastPrecision = null

function AreaMetrics({ area, draft, inking }) {
  const m = area.metrics
  const $ = (v) => <Money value={v} draft={draft} inking={inking} />
  switch (area.key) {
    case 'budget':
      return (
        <dl className="kv">
          <dt>Доход</dt><dd>{$(m.income)}</dd>
          <dt>Расходы и платежи</dt><dd>{$(m.outflow)}</dd>
          <dt>Остаётся</dt><dd className={m.free_cashflow < 0 ? 'neg' : ''}>{$(m.free_cashflow)}</dd>
          <dt>Норма сбережений</dt><dd>{m.savings_rate === null ? '—' : pct(m.savings_rate)}</dd>
        </dl>
      )
    case 'debts':
      return (
        <dl className="kv">
          <dt>Платежи от дохода</dt><dd>{m.dti_percent.toFixed(0)} %</dd>
          <dt>Всего долга</dt><dd>{$(m.total_debt)}</dd>
          <dt>Просрочка</dt><dd className={m.overdue > 0 ? 'neg' : ''}>{$(m.overdue)}</dd>
        </dl>
      )
    case 'cushion':
      return (
        <>
          <Ruler months={m.months} target={m.target_months} draft={draft} />
          <dl className="kv">
            <dt>Подушка</dt><dd>{$(m.cushion)}</dd>
            <dt>Хватит на</dt><dd>{m.months.toFixed(1)} мес. из {m.target_months}</dd>
            <dt>Цели</dt><dd>{m.goals_realistic ? 'реалистичны' : 'есть нереалистичные'}</dd>
          </dl>
        </>
      )
    default:
      return (
        <>
          <dl className="kv"><dt>Вложения</dt><dd>{$(m.investments)}</dd></dl>
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
  // Маркер — одна пометка на экран: на первом ещё не сделанном шаге
  const next = steps.find((s) => s.status === 'suggested')
  return (
    <ol className="steps">
      {steps.map((s) => (
        <li key={s.rule_key} className={`step step-${s.status}`}>
          <span className="step-rank">{s.rank}</span>
          <div>
            <b>{s === next ? <mark className="mark swipe">{s.title}</mark> : s.title}</b>
            <p>{s.why}</p>
            {final && s.id && (
              <div className="row gap">
                {s.status !== 'done' ? (
                  <button className="chip" onClick={() => onPatch(s, 'done')}>Сделано</button>
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
    ['current', 'Как сейчас', d.current],
    ['avalanche', `Лавина: +${rub(d.extra)} в месяц на самый дорогой`, d.avalanche],
    ['snowball', `Снежный ком: +${rub(d.extra)} в месяц на самый маленький`, d.snowball],
  ]
  const best = d.avalanche.total_interest <= d.snowball.total_interest ? 'avalanche' : 'snowball'
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Стратегия</th><th>Все кредиты закрыты</th><th className="num">Переплата</th></tr></thead>
        <tbody>
          {rows.map(([key, name, p]) => (
            <tr key={key} className={key === best && p.months ? 'best' : ''}>
              <td>{name}</td>
              <td>{p.months ? `${monthLabel(p.payoff_month)}, через ${p.months} ${plural(p.months, 'месяц', 'месяца', 'месяцев')}` : 'не гасится'}</td>
              <td className="num">{rub(p.total_interest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Report({ checkup, report, onRefine, onComplete, onNew, onReport }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [inking] = useState(() => lastPrecision === 'draft' && report.precision !== 'draft')
  useEffect(() => { lastPrecision = report.precision }, [report.precision])
  const [p1, p2, note] = PRECISION[report.precision]
  const draft = report.precision === 'draft'
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
      <section className={`report-head answer answer-${ea.verdict}`}>
        <div className="stack" style={{ gap: 12 }}>
          <p className="eyebrow">{report.final ? 'Итоговый разбор' : 'Черновой разбор'} на {monthLabel(report.as_of)}</p>
          <h1>{ea.question}</h1>
          <div><Verdict value={ea.verdict} /></div>
          <p className="answer-text">{ea.text}</p>
        </div>
        <div className="aside">
          <Precision label={p1} share={report.precision_share} hint={p2} />
          <p className={`note ${draft ? 'warn' : ''}`}>{note}</p>
        </div>
      </section>

      <Card title="С чего начать">
        <Steps steps={report.steps} final={report.final} onPatch={patch} />
      </Card>

      <div className="areas">
        {report.areas.map((a) => (
          <Card key={a.key} title={a.title} aside={<Light value={a.light} />} className={`area area-${a.light}`}>
            <AreaMeter />
            <AreaMetrics area={a} draft={draft} inking={inking} />
          </Card>
        ))}
      </div>

      <Card title="Прогноз на 12 месяцев" aside={<span className="muted">если ничего не менять</span>} className="forecast-card">
        <div className="forecast">
          <LineChart series={[
            { name: 'Обычный сценарий', tone: 'base', points: report.forecast.base },
            { name: 'Пессимистичный', tone: 'pess', points: report.forecast.pessimistic },
          ]} />
        </div>
        <p className="legend">
          <span><i className="sw" />по серединам диапазонов</span>
          <span><i className="sw pess" />худший край диапазонов</span>
          <span><i className="sw zero" />ноль денег</span>
        </p>
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
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Цель</th><th className="num">Нужно в месяц</th><th>Срок</th></tr></thead>
              <tbody>
                {report.goals.map((g) => (
                  <tr key={g.title}>
                    <td>{g.title}, {rub(g.target_amount)}</td>
                    <td className="num">{rub(g.monthly_needed)}</td>
                    <td>{g.realistic ? `${monthLabel(g.target_month)}, успеваете` : `реально: ${g.realistic_month ? monthLabel(g.realistic_month) : '—'}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <p className="disclaimer">{report.disclaimer} Правила v{report.rules_version}, ядро {report.fincore_version}, чекап {checkup.id}.</p>
    </div>
  )
}
