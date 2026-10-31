import { useCallback, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'
import { Button, ErrorNote } from './components.jsx'
import Auth from './screens/Auth.jsx'
import Refine from './screens/Refine.jsx'
import Report from './screens/Report.jsx'
import { Family, Question, Quick } from './screens/Start.jsx'

// Экраны: auth → question → family → quick → (refine ⇄ report) · profile
export default function App() {
  const [meta, setMeta] = useState(null)
  const [screen, setScreen] = useState(getToken() ? 'loading' : 'auth')
  const [me, setMe] = useState(null)
  const [checkup, setCheckup] = useState(null)
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const guard = useCallback(async (fn) => {
    setError(null)
    setBusy(true)
    try {
      return await fn()
    } catch (err) {
      if (err.status === 401) {
        setToken(null)
        setScreen('auth')
      } else {
        setError(err)
      }
      return undefined
    } finally {
      setBusy(false)
    }
  }, [])

  const boot = useCallback(() => guard(async () => {
    const [m, list] = await Promise.all([api.me(), api.listCheckups()])
    setMe(m)
    setHistory(list)
    const draft = list.find((c) => c.status === 'draft')
    const last = list.find((c) => c.status === 'completed')
    if (draft) {
      const ck = await api.getCheckup(draft.id)
      setCheckup(ck)
      setScreen(ck.data.incomes.length ? 'refine' : 'quick')
    } else if (last) {
      const ck = await api.getCheckup(last.id)
      setCheckup(ck)
      setReport(await api.report(ck.id))
      setScreen('report')
    } else {
      setScreen('question')
    }
  }), [guard])

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setMeta({}))
    if (getToken()) boot()
  }, [boot])

  const openReport = (ck = checkup) => guard(async () => {
    setReport(await api.report(ck.id))
    setScreen('report')
    window.scrollTo(0, 0)
  })

  const pickQuestion = (q) => guard(async () => {
    const ck = await api.createCheckup(q)
    setCheckup(ck)
    setScreen('family')
  })

  const saveFamily = async (rows) => {
    const members = await api.putMembers(rows)
    setCheckup({ ...checkup, members })
    setScreen(checkup.data.incomes.length ? 'refine' : 'quick')
  }

  const quick = async (answers) => {
    const ck = await api.quick(checkup.id, answers)
    setCheckup(ck)
    await openReport(ck)
  }

  const demo = () => guard(async () => {
    const ck = await api.demo(checkup.id)
    setCheckup(ck)
    setReport(await api.report(ck.id))
    setScreen('report')
  })

  const complete = async () => {
    const r = await api.complete(checkup.id)
    setCheckup({ ...checkup, status: 'completed' })
    setReport(r)
    setHistory(await api.listCheckups())
    window.scrollTo(0, 0)
  }

  const logout = () => {
    setToken(null)
    setCheckup(null)
    setReport(null)
    setScreen('auth')
  }

  const remove = () => guard(async () => {
    if (!window.confirm('Удалить аккаунт и все данные? Это нельзя отменить.')) return
    await api.deleteMe()
    logout()
  })

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => checkup && setScreen(report ? 'report' : 'question')}>
          <span className="brand-mark" aria-hidden>П</span>
          <span><b>ТВОЙ ПЛАН</b><small>Финансы как есть</small></span>
        </button>
        {screen !== 'auth' && (
          <nav className="topnav">
            {checkup?.status === 'draft' && <button className="link" onClick={() => setScreen('refine')}>Данные</button>}
            {checkup && (checkup.status === 'completed' || checkup.data.incomes.length > 0) && (
              <button className="link" onClick={() => openReport()}>Разбор</button>
            )}
            <button className="link" onClick={() => setScreen('profile')}>Профиль</button>
          </nav>
        )}
      </header>
      <span className="proto-badge">Прототип: данные хранятся в памяти сервера</span>
      <main className="main">
        <ErrorNote error={error} />
        {screen === 'loading' && <p className="muted">Загружаем…</p>}
        {screen === 'auth' && <Auth meta={meta} onLoggedIn={boot} />}
        {screen === 'question' && <Question busy={busy} onPick={pickQuestion} />}
        {screen === 'family' && checkup && (
          <Family members={checkup.members} onSave={saveFamily} onBack={() => setScreen('question')} />
        )}
        {screen === 'quick' && checkup && (
          <Quick checkup={checkup} onDone={quick} onDemo={demo} onSkip={() => setScreen('refine')} />
        )}
        {screen === 'refine' && checkup && (
          <Refine key={checkup.id} checkup={checkup} onChange={setCheckup} onShowReport={() => openReport()} />
        )}
        {screen === 'report' && checkup && report && (
          <Report checkup={checkup} report={report} onReport={setReport} onRefine={() => setScreen('refine')}
            onComplete={complete} onNew={() => { setReport(null); setScreen('question') }} />
        )}
        {screen === 'profile' && (
          <div className="stack narrow">
            <h1>Профиль</h1>
            <p>{me?.user?.email}</p>
            <h2>История разборов</h2>
            <ul className="history">
              {history.map((c) => (
                <li key={c.id}>
                  <button className="link" onClick={() => guard(async () => {
                    const ck = await api.getCheckup(c.id)
                    setCheckup(ck)
                    setReport(await api.report(ck.id))
                    setScreen('report')
                  })}>
                    {c.as_of}, {c.status === 'completed' ? 'итоговый' : 'черновик'}
                  </button>
                </li>
              ))}
              {!history.length && <li className="muted">Пока нет</li>}
            </ul>
            <div className="actions">
              <Button variant="ghost" onClick={logout}>Выйти</Button>
              <Button variant="danger" onClick={remove}>Удалить мои данные</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
