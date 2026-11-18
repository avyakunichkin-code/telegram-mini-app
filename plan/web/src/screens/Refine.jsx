import { useEffect, useRef, useState } from 'react'
import { api, getToken } from '../api.js'
import { Button, Card, ErrorNote, toNum } from '../components.jsx'
import { SECTIONS, sectionOrder } from '../sections.js'
import { analyzePrecision, estimatedAfterEdit, invalidNumericField } from '../precision.js'
import PrecisionInput from './precision/PrecisionInput.jsx'
import PrecisionStatus from './precision/PrecisionStatus.jsx'
import './precision/precision.css'
import { draftCache } from '../draft.js'

function FieldInput({ field, value, onChange, members, priority }) {
  switch (field.type) {
    case 'range':
      return <PrecisionInput label={field.label} value={value} onChange={onChange} hint={field.hint} priority={priority} />
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
  if (section === 'goals' && !out.target_month) out.target_month = null
  return out
}

export default function Refine({ checkup, onChange, onShowReport, onUnauthorized }) {
  const order = sectionOrder(checkup.entry_question)
  const [active, setActive] = useState(order[0])
  const [rows, setRows] = useState(checkup.data[order[0]] || [])
  const [rowKeys, setRowKeys] = useState(() => (checkup.data[order[0]] || []).map((_, i) => `row-${i}`))
  const nextRowKey = useRef(rowKeys.length)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState({})
  const [online, setOnline] = useState(navigator.onLine)
  const [draftReady, setDraftReady] = useState(false)
  const [restored, setRestored] = useState(false)
  const [conflict, setConflict] = useState(null)
  const [storageFailed, setStorageFailed] = useState(false)
  const pending = useRef(false)
  const loanFields = useRef(new Map())
  const nav = useRef(null)
  const heading = useRef(null)
  const movedToSection = useRef(false)
  const mounted = useRef(true)
  const meta = SECTIONS[active]
  const calculated = analyzePrecision({ ...checkup.data, [active]: rows })
  const invalidField = invalidNumericField(meta, rows)
  const estimate = invalidField ? { ...calculated, invalid: true, level: 'invalid', candidate: null } : calculated
  const disabled = busy || !online || !draftReady || !!conflict
  function replaceRows(freshRows) {
    setRows(freshRows)
    setRowKeys(freshRows.map(() => `row-${nextRowKey.current++}`))
  }
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  useEffect(() => { nav.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }, [active])
  useEffect(() => {
    if (!movedToSection.current) return
    movedToSection.current = false
    window.scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
  }, [active])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    let live = true
    const session = getToken()
    draftCache.load(checkup).then(value => {
      if (!live || session !== getToken()) return
      if (value?.conflict) setConflict(value)
      else if (value) {
        setActive(value.active); replaceRows(value.rows)
        loanFields.current = new Map(value.fields.map(([i, keys]) => [i, new Set(keys)]))
        setRestored(true)
      }
      setDraftReady(true)
    })
    return () => { live = false }
  }, [checkup.id])
  useEffect(() => {
    if (!draftReady || conflict || busy) return
    if (JSON.stringify(rows) === JSON.stringify(checkup.data[active] || [])) { draftCache.clear(); return }
    let live = true
    draftCache.save(checkup, active, rows, [...loanFields.current].map(([i, keys]) => [i, [...keys]])).then(ok => { if (live) setStorageFailed(!ok) })
    return () => { live = false }
  }, [rows, active, checkup, draftReady, conflict, busy])

  function chooseDraft(local) {
    const value = conflict
    draftCache.clear(); setConflict(null)
    setActive(value.active)
    replaceRows(local ? value.rows : checkup.data[value.active] || [])
    loanFields.current = local ? new Map(value.fields.map(([i, keys]) => [i, new Set(keys)])) : new Map()
    setRestored(local)
  }

  function open(section) {
    if (section === active || disabled || pending.current) return
    if (JSON.stringify(rows) !== JSON.stringify(checkup.data[active] || [])) {
      save(section)
      return
    }
    movedToSection.current = true
    setActive(section)
    replaceRows(checkup.data[section] || [])
    setError(null)
    loanFields.current.clear()
  }

  async function save(next) {
    if (disabled || pending.current) return
    if (estimate.invalid) {
      setError(new Error('Проверьте суммы: заполните обе границы, «до» не меньше «от».'))
      return
    }
    pending.current = true
    const session = getToken()
    setBusy(true)
    setError(null)
    try {
      const body = rows.map((r) => normalize(active, r))
      await api.putSection(checkup.id, active, body)
      if (!mounted.current || getToken() !== session) return
      const fresh = await api.getCheckup(checkup.id)
      if (!mounted.current || getToken() !== session) return
      onChange(fresh)
      draftCache.clear(); setRestored(false); setStorageFailed(false)
      loanFields.current.clear()
      setSaved({ ...saved, [active]: true })
      if (!next) replaceRows(fresh.data[active] || [])
      if (next === 'report') await onShowReport()
      else if (next) {
        movedToSection.current = true
        setActive(next)
        replaceRows(fresh.data[next] || [])
      }
    } catch (err) {
      if (mounted.current && getToken() === session) {
        if (err.status === 401 && onUnauthorized) onUnauthorized()
        else setError(err)
      }
    } finally {
      setBusy(false)
      pending.current = false
    }
  }

  const idx = order.indexOf(active)
  const next = order[idx + 1]
  const update = (i, patch) => setRows(current => current.map((r, j) => {
    if (j !== i) return r
    if (active !== 'liabilities') return { ...r, ...patch }
    const fields = new Set(loanFields.current.get(i) || [])
    Object.keys(patch).forEach(key => fields.add(key))
    loanFields.current.set(i, fields)
    return { ...r, ...patch, estimated: estimatedAfterEdit(r, patch, fields) }
  }))

  return (
    <div className="refine precision-refine">
      <nav className="tabs" aria-label="Разделы" ref={nav}>
        {order.map((s) => (
          <button key={s} className={`tab ${s === active ? 'on' : ''}`} aria-current={s === active ? 'step' : undefined} disabled={disabled} onClick={() => open(s)}>
            {SECTIONS[s].title}
            {estimate.sections.some(section => section.key === s) && <small>{(() => { const contribution = estimate.sections.find(section => section.key === s); return contribution.weight === 0 ? 'Нет сумм' : contribution.uncertain > 0 ? 'Есть оценки' : 'Уточнено' })()}</small>}
          </button>
        ))}
      </nav>
      <div className="stack">
        {restored && <aside className="precision-warning" role="status"><b>Вы продолжаете с того же места</b><p>Несохранённый ввод восстановлен в этой вкладке. На сервере пока предыдущая версия.</p><Button variant="ghost" disabled={busy} onClick={() => { draftCache.clear(); replaceRows(checkup.data[active] || []); loanFields.current.clear(); setRestored(false) }}>Вернуть сохранённое</Button></aside>}
        {conflict && <aside className="precision-warning" role="alert"><b>Сохранённые данные изменились</b><p>Выберите, с каким вводом продолжить. Локальная копия пока не отправлена.</p><Button onClick={() => chooseDraft(true)}>Продолжить с моим вводом</Button><Button variant="ghost" onClick={() => chooseDraft(false)}>Вернуть сохранённое</Button></aside>}
        {storageFailed && <p className="precision-warning" role="status">Не удалось сохранить копию в этой вкладке. Перезагрузка потеряет несохранённый ввод.</p>}
        <div>
          <p className="eyebrow">Раздел {idx + 1} из {order.length}</p>
          <h1 ref={heading} tabIndex={-1}>{meta.title}</h1>
          <p className="lead">{meta.lead}</p>
          <PrecisionStatus estimate={estimate} />
        </div>
        {!online && <p className="precision-warning" role="status">Офлайн · ввод сохранится на экране. Для отправки нужна сеть.</p>}
        {estimate.candidate && estimate.candidate !== active && <p className="precision-section-hint">Больше всего поможет раздел «{SECTIONS[estimate.candidate].title}». <button type="button" disabled={disabled} onClick={() => open(estimate.candidate)}>Перейти ↗</button></p>}
        {estimate.candidate === 'liabilities' && active === 'liabilities' && <p className="precision-section-hint">Уточните остаток и ставку оценённого кредита по договору.</p>}
        {rows.length === 0 && <p className="muted">Пока пусто. Если такого нет — просто идите дальше.</p>}
        {rows.map((row, i) => (
          <Card key={rowKeys[i]} className="row-card" aside={!meta.single && (
            <button type="button" disabled={disabled} className="link danger" onClick={() => { loanFields.current.clear(); setRows(rows.filter((_, j) => j !== i)); setRowKeys(rowKeys.filter((_, j) => j !== i)) }}>Убрать</button>
          )}>
            {row.estimated && <p className="stub">Оценка из быстрого старта. Для уточнения нужны остаток и ставка по договору.</p>}
            <fieldset className="grid-fields precision-fields" disabled={disabled}><legend className="precision-sr">{meta.title}, строка {i + 1}</legend>
              {meta.fields.map((f) => (
                <FieldInput key={`${active}/${rowKeys[i]}/${f.key}`} field={f} value={row[f.key]} members={checkup.members} priority={estimate.candidate === active && i === 0}
                  onChange={(v) => update(i, { [f.key]: v })} />
              ))}
            </fieldset>
          </Card>
        ))}
        {(!meta.single || rows.length === 0) && (
          <button type="button" disabled={disabled} className="chip add" onClick={() => { setRows([...rows, meta.empty(checkup.members)]); setRowKeys([...rowKeys, `row-${nextRowKey.current++}`]) }}>+ Добавить</button>
        )}
        <ErrorNote error={error} />
        {invalidField && <p className="precision-invalid" role="alert">Проверьте поле «{invalidField}»: заполните корректные неотрицательные значения.</p>}
        <div className="actions">
          <Button variant="ghost" busy={busy} disabled={disabled || estimate.invalid} onClick={() => save('report')}>Сохранить и к разбору</Button>
          {next ? (
            <Button busy={busy} disabled={disabled || estimate.invalid} onClick={() => save(next)}>Дальше: {SECTIONS[next].title}</Button>
          ) : (
            <Button busy={busy} disabled={disabled || estimate.invalid} onClick={() => save('report')}>Готово — к разбору</Button>
          )}
        </div>
      </div>
    </div>
  )
}
