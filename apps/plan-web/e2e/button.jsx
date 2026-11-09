import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '../src/components.jsx'

function Fixture() {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [clicks, setClicks] = useState(0)
  const [submits, setSubmits] = useState(0)
  return <form onSubmit={e => { e.preventDefault(); setSubmits(n => n + 1) }}>
    <Button ref={ref} busy={busy} disabled={false} onClick={() => setClicks(n => n + 1)}>Действие</Button>
    <Button type="submit">Отправить</Button>
    <Button onClick={() => setBusy(v => !v)}>Загрузка</Button>
    <Button onClick={() => ref.current.focus()}>Фокус</Button>
    <output aria-label="Нажатия">{clicks}</output>
    <output aria-label="Отправки">{submits}</output>
  </form>
}
createRoot(document.getElementById('root')).render(<Fixture />)
