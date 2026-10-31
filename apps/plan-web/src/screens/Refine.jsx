import { useState } from 'react'
import { api } from '../api.js'
import { Button, Card, ErrorNote, RangeInput, toNum } from '../components.jsx'
import { SECTIONS, sectionOrder } from '../sections.js'

function FieldInput({ field, value, onChange, members }) {
  switch (field.type) {
    case 'range':
      return <RangeInput label={field.label} value={value} onChange={onChange} hint={field.hint} />
    case 'bool':
      return (
        <label className="check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{field.label}</span>
        </label>
      )
    case 'select':
      return (
        <label className="field">
          <span className="field-label">{field.label}</span>
          <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      )
    case 'member': {
      const list = members.filter((m) => !field.adultsOnly || m.role === 'adult')
      return (
        <label className="field">
          <span className="field-label">{field.label}</span>
          <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
            {field.allowShared && <option value="">Общий</option>}
            {list.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      )
    }
    case 'month':
      return (
        <label className="field">
          <span className="field-label">{field.label}</span>
          <input type="month" value={value || ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      )
    case 'text':
      return (
        <label className="field">
          <span className="field-label">{field.label}</span>
          <input value={value || ''} placeholder={field.placeholder} maxLength={60} onChange={(e) => onChange(e.target.value)} />
        </label>
      )
    default:
      return (
        <label className="field">
          <span className="field-label">{field.label}</span>
          <input inputMode="decimal" aria-label={field.label} value={value ?? ''} placeholder={field.optional ? '—' : '0'}
            onChange={(e) => {
              const n = toNum(e.target.value)
              onChange(n === '' ? (field.optional ? null : '') : n)
            }} />
          {field.hint && <span className="hint">{field.hint}</span>}
        </label>
      )
  }
}

function normalize(section, row) {
  const out = { ...row }
  for (const f of SECTIONS[section].fields) {
    const v = out[f.key]
    if (f.type === 'range') out[f.key] = { min: Number(v?.min) || 0, max: Number(v?.max) || 0 }
    else if (['money', 'number', 'int'].includes(f.type)) out[f.key] = v === null || v === '' ? (f.optional ? null : 0) : Number(v)
  }
  if (section === 'expenses' && !out.category_key) out.category_key = 'other'
  return out
}

export default function Refine({ checkup, onChange, onShowReport }) {
  const order = sectionOrder(checkup.entry_question)
  const [active, setActive] = useState(order[0])
  const [rows, setRows] = useState(checkup.data[order[0]] || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState({})
  const meta = SECTIONS[active]

  function open(section) {
    setActive(section)
    setRows(checkup.data[section] || [])
    setError(null)
  }

  async function save(next) {
    setBusy(true)
    setError(null)
    try {
      const body = rows.map((r) => normalize(active, r))
      await api.putSection(checkup.id, active, body)
      const fresh = await api.getCheckup(checkup.id)
      onChange(fresh)
      setSaved({ ...saved, [active]: true })
      if (next === 'report') onShowReport()
      else if (next) {
        setActive(next)
        setRows(fresh.data[next] || [])
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const idx = order.indexOf(active)
  const next = order[idx + 1]
  const update = (i, patch) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="refine">
      <nav className="tabs" aria-label="Разделы">
        {order.map((s) => (
          <button key={s} className={`tab ${s === active ? 'on' : ''}`} onClick={() => open(s)}>
            {SECTIONS[s].title}
            {(checkup.data[s] || []).length > 0 && <span className="dot" aria-label="заполнено" />}
          </button>
        ))}
      </nav>
      <div className="stack">
        <div>
          <p className="eyebrow">Раздел {idx + 1} из {order.length}</p>
          <h1>{meta.title}</h1>
          <p className="lead">{meta.lead}</p>
        </div>
        {rows.length === 0 && <p className="muted">Пока пусто. Если такого нет — просто идите дальше.</p>}
        {rows.map((row, i) => (
          <Card key={i} className="row-card" aside={!meta.single && (
            <button className="link danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Убрать</button>
          )}>
            {row.estimated && <p className="stub">Оценка из быстрого старта: остаток посчитан по платежу. Уточните реальные цифры.</p>}
            <div className="grid-fields">
              {meta.fields.map((f) => (
                <FieldInput key={f.key} field={f} value={row[f.key]} members={checkup.members}
                  onChange={(v) => update(i, { [f.key]: v, ...(f.key !== 'estimated' ? { estimated: false } : {}) })} />
              ))}
            </div>
          </Card>
        ))}
        {(!meta.single || rows.length === 0) && (
          <button className="chip add" onClick={() => setRows([...rows, meta.empty(checkup.members)])}>+ Добавить</button>
        )}
        <ErrorNote error={error} />
        <div className="actions">
          <Button variant="ghost" busy={busy} onClick={() => save('report')}>Сохранить и к разбору</Button>
          {next ? (
            <Button busy={busy} onClick={() => save(next)}>Дальше: {SECTIONS[next].title}</Button>
          ) : (
            <Button busy={busy} onClick={() => save('report')}>Готово — к разбору</Button>
          )}
        </div>
      </div>
    </div>
  )
}
