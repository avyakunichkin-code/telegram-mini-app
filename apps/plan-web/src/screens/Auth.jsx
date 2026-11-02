import { useState } from 'react'
import { api, setToken } from '../api.js'
import { Button, ErrorNote } from '../components.jsx'

export default function Auth({ meta, onLoggedIn }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [consent, setConsent] = useState(false)
  const [stage, setStage] = useState('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await api.requestCode(email)
      setDevCode(r.dev_code)
      setStage('code')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function verify(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await api.verify(email, code, consent ? meta?.consent_version : undefined)
      setToken(r.access_token)
      onLoggedIn()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="hero">
      {/* ★ U1 + раскладка S4 (design-lab/plan-checkup/bento-round, утверждено 2026-11-02) */}
      <div className="hero-copy">
        <h1>Деньги отвечают</h1>
        <p className="lead">Вместо таблицы на сто строк — три плитки и следующий шаг.</p>
        <div className="vs" aria-hidden="true">
          <div className="sheet">{Array.from({ length: 18 }, (_, i) => <i key={i} />)}</div>
          <span className="arrow">→</span>
          <div className="mini"><i className="area-green" /><i className="area-yellow" /><i className="mini-calm" /></div>
        </div>
      </div>
      <form className="card auth" onSubmit={stage === 'email' ? send : verify}>
        {stage === 'email' ? (
          <>
            <h2>Вход</h2>
            <label className="field">
              <span className="field-label">E-mail</span>
              <input type="email" required autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.ru" />
            </label>
            <Button type="submit" busy={busy}>Получить код</Button>
          </>
        ) : (
          <>
            <h2>Код из письма</h2>
            {devCode && (
              <p className="stub">Тестовый стенд: письма не отправляются. Ваш код — <b>{devCode}</b></p>
            )}
            <label className="field">
              <span className="field-label">6 цифр</span>
              <input inputMode="numeric" pattern="\d{6}" required value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
            </label>
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>Согласен на обработку персональных данных для расчёта разбора (версия {meta?.consent_version})</span>
            </label>
            <Button type="submit" busy={busy}>Войти</Button>
            <button type="button" className="link" onClick={() => setStage('email')}>Другой e-mail</button>
          </>
        )}
        <ErrorNote error={error} />
      </form>
    </div>
  )
}
