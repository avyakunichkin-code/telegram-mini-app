import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { api, getToken, setToken } from './api.js'
import { reportCache, TOKEN_KEY } from './offline.js'
import { draftCache } from './draft.js'
import { Button, ErrorNote } from './components.jsx'
import Auth from './screens/Auth.jsx'
import Refine from './screens/Refine.jsx'
import Report from './screens/Report.jsx'
import History from './screens/History.jsx'
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
  const [online, setOnline] = useState(navigator.onLine)
  const [offlineCopy, setOfflineCopy] = useState(null)
  const [returnReport, setReturnReport] = useState(null)
  const readOnly = !online || !!offlineCopy
  const reportEpoch = useRef(0)
  useLayoutEffect(() => { reportEpoch.current++ }, [screen, checkup, report, readOnly])

  const guard = useCallback(async (fn) => {
    const session = getToken()
    setError(null)
    setBusy(true)
    try {
      return await fn()
    } catch (err) {
      if (getToken() !== session) return undefined
      if (err.status === 401) {
        setToken(null)
        setMe(null)
        setCheckup(null)
        setReport(null)
        setHistory([])
        setScreen('auth')
      } else {
        setError(err)
      }
      return undefined
    } finally {
      setBusy(false)
    }
  }, [])

  const restoreOffline = useCallback(async () => {
    setReturnReport(null)
    const session = getToken()
    const saved = await reportCache.load()
    if (!session || getToken() !== session) return
    if (!saved) {
      setCheckup(null); setReport(null); setHistory([]); setOfflineCopy(null)
      setError(new Error('Нет сети и сохранённого итогового отчёта. Откройте итоговый разбор при подключении.'))
      setScreen('offline-empty')
      return
    }
    setMe({ user: { id: saved.ownerId }, members: [] })
    setCheckup(saved.checkup)
    setReport(saved.report)
    setHistory([{ ...saved.checkup, entry_question: '' }])
    setOfflineCopy(saved.savedAt)
    setError(null)
    setScreen('report')
  }, [])

  const boot = useCallback(() => guard(async () => {
    const session = getToken()
    try {
      const [m, list] = await Promise.all([api.me(), api.listCheckups()])
      const draft = list.find(c => c.status === 'draft')
      const last = list.find(c => c.status === 'completed')
      const target = draft || last
      const ck = target ? await api.getCheckup(target.id) : null
      const r = last && !draft ? await api.report(last.id) : null
      if (getToken() !== session) return
      if (!draft) draftCache.clear()
      setReturnReport(null)
      setMe(m); setHistory(list); setCheckup(ck); setReport(r); setOfflineCopy(null)
      setScreen(draft ? (ck.data.incomes.length ? 'refine' : 'quick') : last ? 'report' : 'question')
    } catch (err) {
      if (getToken() !== session) return
      if (err.status === 0 || err instanceof TypeError) await restoreOffline()
      else throw err
    }
  }), [guard, restoreOffline])

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setMeta({}))
    if (getToken()) boot()
  }, [boot])

  useEffect(() => {
    if (screen !== 'report') setReturnReport(null)
    if (screen !== 'offline-empty') setError(null)
    window.scrollTo(0, 0)
  }, [screen])

  useEffect(() => {
    if (me?.user?.id && report?.final && checkup?.status === 'completed' && !offlineCopy) {
      void reportCache.save(me.user.id, checkup, report)
    }
  }, [me, report, checkup, offlineCopy])

  useEffect(() => {
    const connected = () => { setOnline(true); if (getToken() && screen !== 'refine') void boot() }
    const disconnected = () => { setOnline(false); if (getToken() && screen !== 'refine') void restoreOffline() }
    const storageChanged = e => {
      if (e.key === null || e.key === TOKEN_KEY) {
        draftCache.clear()
        reportCache.clear(); setMe(null); setCheckup(null); setReport(null); setHistory([]); setOfflineCopy(null); setScreen('auth')
      }
    }
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    window.addEventListener('storage', storageChanged)
    return () => {
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
      window.removeEventListener('storage', storageChanged)
    }
  }, [boot, restoreOffline, screen])

  const openReport = (ck = checkup) => {
    if (readOnly) { if (report?.final) setScreen('report'); return }
    return guard(async () => {
      const session = getToken(), fresh = await api.report(ck.id)
      if (getToken() !== session) return
      setReport(fresh); setScreen('report'); window.scrollTo(0, 0)
    })
  }

  // Логотип ведёт к текущей работе: незавершённая анкета не должна подменяться созданием новой.
  const goHome = () => {
    if (screen === 'auth' || screen === 'loading') return
    if (checkup && report) setScreen('report')
    else if (checkup?.status === 'draft') setScreen(checkup.data.incomes.length ? 'refine' : 'quick')
    else if (!readOnly) setScreen('question')
  }

  const pickQuestion = (q) => guard(async () => {
    const ck = await api.createCheckup(q)
    setCheckup(ck)
    setReport(null)
    setHistory(await api.listCheckups())
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
    const session = getToken()
    const r = await api.complete(checkup.id)
    if (getToken() !== session) return
    draftCache.clear()
    const [ck, list] = await Promise.all([api.getCheckup(checkup.id), api.listCheckups()])
    if (getToken() !== session) return
    setCheckup(ck); setReport(r); setHistory(list)
    window.scrollTo(0, 0)
  }

  const logout = () => {
    setOfflineCopy(null)
    setToken(null)
    setMe(null)
    setCheckup(null)
    setReport(null)
    setHistory([])
    setScreen('auth')
  }

  const remove = () => guard(async () => {
    if (readOnly) return
    if (!window.confirm('Удалить аккаунт и все данные? Это нельзя отменить.')) return
    await api.deleteMe()
    logout()
  })

  return (
    <div className={`app ${screen === 'report' || screen === 'refine' ? 'atlas-shell' : ''}`}>
      <header className="topbar">
        <button className="brand" onClick={goHome}>
          <span className="brand-mark" aria-hidden>П</span>
          <span><b>ТВОЙ ПЛАН</b><small>Деньги отвечают</small></span>
        </button>
        {screen !== 'auth' && (
          <nav className="topnav">
            {checkup?.status === 'draft' && <button disabled={readOnly} className="link" aria-current={screen === 'refine' ? 'page' : undefined} onClick={() => setScreen('refine')}>Данные</button>}
            {checkup && (checkup.status === 'completed' || checkup.data.incomes.length > 0) && (
              <button className="link" aria-current={screen === 'report' ? 'page' : undefined} onClick={() => openReport()}>Разбор</button>
            )}
            <button className="link" aria-current={screen === 'profile' ? 'page' : undefined} onClick={() => setScreen('profile')}>Профиль</button>
          </nav>
        )}
      </header>
      <span className="proto-badge">Тестовый стенд: только демо-данные, письма не отправляются</span>
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
          <Refine key={checkup.id} checkup={checkup} onChange={setCheckup} onShowReport={() => openReport()} onUnauthorized={logout} />
        )}
        {screen === 'report' && checkup && report && (
          <Report key={checkup.id} checkup={checkup} report={report} onReport={setReport} readOnly={readOnly} offlineSavedAt={offlineCopy} onRefine={() => setScreen('refine')}
            onUnauthorized={logout}
            onHistoryDraft={id => { if (readOnly) return; return guard(async () => {
              const session = getToken(), ck = await api.getCheckup(id)
              if (getToken() !== session) return
              setCheckup(ck); setReport(null); setScreen(ck.data.incomes.length ? 'refine' : 'quick')
            }) }}
            onReturn={returnReport ? () => { setCheckup(returnReport.checkup); setReport(returnReport.report); setReturnReport(null); window.scrollTo(0, 0) } : null}
            onOpenPrevious={async id => {
              if (readOnly) return
              const session = getToken(), epoch = reportEpoch.current
              try {
                const [ck, saved] = await Promise.all([api.getCheckup(id), api.report(id)])
                if (getToken() !== session || reportEpoch.current !== epoch) return
                setReturnReport({ checkup, report })
                setCheckup(ck); setReport(saved); window.scrollTo(0, 0)
              } catch (err) {
                if (getToken() !== session || reportEpoch.current !== epoch) return
                if (err.status === 401) logout()
                else throw err
              }
            }}
            onComplete={complete} onNew={() => { setReport(null); setScreen('question') }} />
        )}
        {screen === 'profile' && (
          <div className="stack">
            <h1>Профиль</h1>
            <p>{me?.user?.email}</p>
            <History readOnly={readOnly} onUnauthorized={logout}
              onNew={() => { setReport(null); setScreen('question') }}
              onDraft={id => guard(async () => {
                const session = getToken(), ck = await api.getCheckup(id)
                if (getToken() !== session) return
                setCheckup(ck); setReport(null); setScreen(ck.data.incomes.length ? 'refine' : 'quick')
              })}
              onOpen={id => { if (readOnly) return; return guard(async () => {
                const session = getToken()
                const [ck, saved] = await Promise.all([api.getCheckup(id), api.report(id)])
                if (getToken() !== session) return
                setCheckup(ck); setReport(saved); setScreen('report'); window.scrollTo(0, 0)
              }) }} />
            <div className="actions">
              <Button variant="ghost" onClick={logout}>Выйти</Button>
              <Button variant="danger" disabled={readOnly} onClick={remove}>Удалить мои данные</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
