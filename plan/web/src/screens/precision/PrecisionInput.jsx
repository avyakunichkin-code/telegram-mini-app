import { useId, useState } from 'react'
import { toNum } from '../../components.jsx'
import { rangeState } from '../../precision.js'

export default function PrecisionInput({ label, value, onChange, hint, priority = false }) {
  const id = useId()
  const [mode, setMode] = useState(null)
  const v = value || { min: '', max: '' }
  const state = rangeState(v)
  const ranged = mode === 'range' || mode !== 'exact' && Number(v.min) !== Number(v.max)
  const change = (field, text) => onChange({ ...v, [field]: toNum(text) })
  const describedBy = [`${id}-hint`, !state.valid && `${id}-invalid`, state.broad && `${id}-warning`, priority && `${id}-priority`].filter(Boolean).join(' ')
  return <div className="precision-input">
    <div className="precision-field-heading"><label htmlFor={`${id}-min`}>{label}</label><div className="precision-modes" role="group" aria-label={`Способ ввода: ${label}`}>
      <button type="button" aria-label={`Диапазон: ${label}`} aria-pressed={ranged} onClick={() => { setMode('range'); onChange({ ...v, max: v.max ?? v.min }) }}>Диапазон</button>
      <button type="button" aria-label={`Точно: ${label}`} aria-pressed={!ranged} onClick={() => { setMode('exact'); onChange({ min: v.min, max: v.min }) }}>Точно</button>
    </div></div>
    <div className="precision-range"><label><span>{ranged ? 'От' : 'Сумма'}</span><div><input id={`${id}-min`} inputMode="decimal" autoComplete="off" value={v.min ?? ''} aria-label={ranged ? `${label}: от` : label} aria-invalid={!state.valid} aria-describedby={describedBy}
      onChange={e => ranged ? change('min', e.target.value) : onChange({ min: toNum(e.target.value), max: toNum(e.target.value) })} /><span aria-hidden="true">₽</span></div></label>
      {ranged && <><span className="precision-dash" aria-hidden="true">—</span><label><span>До</span><div><input inputMode="decimal" autoComplete="off" value={v.max ?? ''} aria-label={`${label}: до`} aria-invalid={!state.valid} aria-describedby={describedBy} onChange={e => change('max', e.target.value)} /><span aria-hidden="true">₽</span></div></label></>}
    </div>
    {!state.valid && <p id={`${id}-invalid`} className="precision-invalid" role="alert">Проверьте границы: нужны неотрицательные суммы, «до» не меньше «от».</p>}
    {state.broad && <p id={`${id}-warning`} className="precision-warning" role="status">{state.min === 0 ? 'От нуля — широкий разброс. Сохранить можно.' : 'Широкий диапазон. Сохранить можно.'}</p>}
    <p className="precision-field-hint" id={`${id}-hint`}>{hint || 'Можно оставить примерно. Сумму уточните позже.'}</p>
    {priority && <p id={`${id}-priority`} className="precision-priority">↗ Начните с этого раздела — здесь наибольший вклад неточных сумм.</p>}
  </div>
}
