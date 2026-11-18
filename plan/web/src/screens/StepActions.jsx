import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { Button, ErrorNote } from '../components.jsx'
import './step-actions.css'

/** Approved compact B (actions-round, 2026-11-05). Server owns all marks. */
export default function StepActions({ step, final, onUpdate, readOnly = false, expanded = false }) {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const pending = useRef(false)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  const actions = step.actions || []
  const done = actions.filter(a => a.done).length
  const disabled = readOnly || busy || !online || !final || !step.id
  async function save(change) {
    if (pending.current || disabled) return
    pending.current = true; setBusy(true); setFailure(null)
    try {
      const fresh = change.key
        ? await api.patchStepAction(step.id, change.key, change.done)
        : await api.patchStep(step.id, change.status)
      onUpdate(fresh)
    } catch (error) { setFailure({ error, change }) }
    finally { pending.current = false; setBusy(false) }
  }
  return <div className="plan-step-actions" aria-busy={busy}>
    {expanded && actions.length > 0 && <div className="atlas-step-progress" role="status">Выполнено {done} из {actions.length}<progress value={done} max={actions.length} aria-label="Прогресс действий" /></div>}
    {actions.length > 0 && !expanded && <details>
      <summary><span className="plan-step-summary"><span>Выполнено {done} из {actions.length}</span><span className="plan-step-chevron" aria-hidden="true" /></span><progress value={done} max={actions.length} aria-label="Прогресс действий" /></summary>
      <ul className="plan-step-list">{actions.map(action => <li key={action.key}><label>
        <input type="checkbox" checked={action.done} disabled={disabled || step.status !== 'suggested'} onChange={e => save({ key: action.key, done: e.target.checked })} />
        <span>{action.title}</span>
      </label></li>)}</ul>
    </details>}
    {expanded && actions.length > 0 && <ul className="plan-step-list">{actions.map(action => <li key={action.key}><label>
      <input type="checkbox" checked={action.done} disabled={disabled || step.status !== 'suggested'} onChange={e => save({ key: action.key, done: e.target.checked })} />
      <span>{action.title}</span>
    </label></li>)}</ul>}
    {!final ? <p className="hint">Завершите разбор, чтобы отмечать выполнение.</p> : <>
      <div className="plan-step-status" role="status" aria-live="polite">{busy ? 'Сохраняем отметку…' : (!online || readOnly) ? 'Нет сети. Отметки доступны после подключения.' : failure ? 'Не удалось сохранить. Прогресс не изменён.' : step.status === 'done' ? (actions.length && done === actions.length ? 'Все действия выполнены. Шаг завершён.' : 'Шаг завершён вручную. Отметки действий сохранены.') : step.status === 'dismissed' ? 'Шаг отложен. Можно вернуться позже.' : 'Отметки сохранены.'}</div>
      {failure && <><ErrorNote error={failure.error} /><Button variant="secondary" disabled={disabled} onClick={() => save(failure.change)}>Повторить сохранение</Button></>}
      <div className="plan-step-controls">{step.status === 'suggested' ? <>
        <Button disabled={disabled} onClick={() => save({ status: 'done' })}>Завершить шаг вручную</Button>
        <Button variant="secondary" disabled={disabled} onClick={() => save({ status: 'dismissed' })}>Отложить</Button>
      </> : <Button variant="secondary" disabled={disabled} onClick={() => save({ status: 'suggested' })}>Вернуть в работу</Button>}</div>
      <p className="hint">Приложение не переводит деньги. Отметьте действие после самостоятельного выполнения.</p>
    </>}
  </div>
}
