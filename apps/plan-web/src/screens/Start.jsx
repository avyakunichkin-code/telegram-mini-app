import { useState } from 'react'
import { api } from '../api.js'
import { Button, Card, ErrorNote, Presets, RangeInput } from '../components.jsx'

const QUESTIONS = [
  ['mortgage', 'Потянем ли ипотеку или крупный кредит?', 'Платёж, нагрузка и запас после взноса'],
  ['debts', 'Когда закроем кредиты?', 'Сроки, переплата и как гасить быстрее'],
  ['resilience', 'Выдержим ли, если что-то случится?', 'Потеря дохода, ребёнок, рост цен'],
  ['goal', 'Успеем ли накопить на цель?', 'Сколько откладывать и реален ли срок'],
  ['overview', 'Как у нас дела в целом?', 'Полный разбор по четырём областям'],
]

export function Question({ onPick, busy }) {
  return (
    <div className="stack">
      <h1>С какого вопроса начнём?</h1>
      <p className="lead">От ответа зависит, что спросим первым и что покажем в начале разбора.</p>
      <div className="questions">
        {QUESTIONS.map(([key, title, sub]) => (
          <button key={key} className="question" disabled={busy} onClick={() => onPick(key)}>
            <b>{title}</b>
            <span>{sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Family({ members, onSave, onBack }) {
  const [rows, setRows] = useState(members.length ? members : [{ label: 'Я', role: 'adult' }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const update = (i, patch) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await onSave(rows)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack narrow">
      <h1>Кто в семье</h1>
      <p className="lead">Без имён — достаточно метки. У каждого взрослого могут быть свои доходы и долги.</p>
      <Card>
        {rows.map((m, i) => (
          <div className="row member" key={m.id || i}>
            <input aria-label="Метка" value={m.label} maxLength={40} onChange={(e) => update(i, { label: e.target.value })} />
            <select aria-label="Роль" value={m.role} onChange={(e) => update(i, { role: e.target.value })}>
              <option value="adult">Взрослый</option>
              <option value="child">Ребёнок</option>
            </select>
            <input aria-label="Год рождения" placeholder="Год рождения" inputMode="numeric" value={m.birth_year || ''}
              onChange={(e) => update(i, { birth_year: e.target.value ? Number(e.target.value) : null })} />
            {rows.length > 1 && (
              <button type="button" className="link danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Убрать</button>
            )}
          </div>
        ))}
        {rows.length < 8 && (
          <div className="row gap">
            <button type="button" className="chip" onClick={() => setRows([...rows, { label: 'Партнёр', role: 'adult' }])}>+ Взрослый</button>
            <button type="button" className="chip" onClick={() => setRows([...rows, { label: `Ребёнок ${rows.filter((r) => r.role === 'child').length + 1}`, role: 'child' }])}>+ Ребёнок</button>
          </div>
        )}
      </Card>
      <ErrorNote error={error} />
      <div className="actions">
        <Button variant="ghost" onClick={onBack}>Назад</Button>
        <Button busy={busy} onClick={save}>Дальше</Button>
      </div>
    </div>
  )
}

const zero = { min: 0, max: 0 }

export function Quick({ checkup, onDone, onDemo, onSkip }) {
  const kids = checkup.members.filter((m) => m.role === 'child').length
  const [a, setA] = useState({ income: zero, must_expenses: zero, debt_payments: zero, savings: zero, children: kids })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = (k) => (v) => setA({ ...a, [k]: v })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const clean = Object.fromEntries(
        Object.entries(a).map(([k, v]) => [k, typeof v === 'object' ? { min: Number(v.min) || 0, max: Number(v.max) || 0 } : v]),
      )
      await onDone(clean)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack narrow" onSubmit={submit}>
      <p className="eyebrow">Быстрый старт · 5 вопросов</p>
      <h1>Примерно — уже достаточно</h1>
      <p className="lead">Отвечайте диапазоном, если не помните точно. Черновой разбор появится сразу, точность вырастет при уточнении.</p>
      <Card>
        <RangeInput label="1. Доход семьи в месяц, на руки" value={a.income} onChange={set('income')} />
        <Presets values={[[50_000, 100_000], [100_000, 150_000], [150_000, 250_000], [250_000, 400_000]]} onPick={set('income')} />
        <RangeInput label="2. Обязательные расходы в месяц" value={a.must_expenses} onChange={set('must_expenses')}
          hint="Еда, жильё, коммуналка, транспорт, дети — без платежей по кредитам" />
        <Presets values={[[30_000, 60_000], [60_000, 100_000], [100_000, 150_000]]} onPick={set('must_expenses')} />
        <RangeInput label="3. Платежи по всем кредитам в месяц" value={a.debt_payments} onChange={set('debt_payments')} />
        <RangeInput label="4. Сколько отложено на чёрный день" value={a.savings} onChange={set('savings')} />
        <label className="field">
          <span className="field-label">5. Сколько детей</span>
          <span className="row gap">
            {[0, 1, 2, 3].map((n) => (
              <button type="button" key={n} className={`chip ${a.children === n ? 'on' : ''}`} onClick={() => setA({ ...a, children: n })}>
                {n === 3 ? '3+' : n}
              </button>
            ))}
          </span>
        </label>
      </Card>
      <ErrorNote error={error} />
      <div className="actions">
        <Button type="button" variant="ghost" onClick={onSkip}>Сразу к подробному вводу</Button>
        <Button type="submit" busy={busy}>Показать черновой разбор</Button>
      </div>
      <p className="stub">
        Прототип: <button type="button" className="link" onClick={onDemo}>заполнить демо-семьёй</button> — двое взрослых, ребёнок, ипотека, карта и автокредит.
      </p>
    </form>
  )
}
