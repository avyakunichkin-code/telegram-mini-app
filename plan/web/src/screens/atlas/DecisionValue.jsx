import { useEffect, useRef, useState } from 'react'
import { api, getToken } from '../../api.js'
import { Button, ErrorNote } from '../../components.jsx'
import { rub } from '../../format.js'
import './decision-value.css'

export default function DecisionValue({ checkup, report, readOnly, onUnauthorized }) {
  const [amount, setAmount] = useState('5000')
  const [result, setResult] = useState(null)
  const [sensitivity, setSensitivity] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const epoch = useRef(0)
  const pending = useRef(false)
  useEffect(() => { epoch.current++; setResult(null); setSensitivity(null); setError(null); return () => { epoch.current++ } }, [checkup, report.rules_version, readOnly])
  const candidate = ['incomes', 'expenses'].flatMap(section => (checkup.data?.[section] || []).map((row, row_index) => ({ section, row_index, min: Number(row.amount.min), max: Number(row.amount.max) }))).filter(row => row.min !== row.max).sort((a,b) => (b.max-b.min)-(a.max-a.min))[0]
  async function calculate(body) {
    if (readOnly || pending.current) return
    const started = epoch.current, session = getToken()
    pending.current = true; setBusy(true); setError(null)
    try {
      const value = await api.preview(checkup.id, body)
      if (epoch.current !== started || getToken() !== session) return
      if (body.mode === 'sensitivity') setSensitivity({ ...value, candidate })
      else setResult(value)
    } catch (err) {
      if (epoch.current === started && getToken() === session) {
        if (err.status === 401) onUnauthorized?.()
        else setError(err)
      }
    } finally { pending.current = false; setBusy(false) }
  }
  const valid = amount.trim() !== '' && Number.isFinite(Number(amount)) && Number(amount) >= 0
  const step = report.steps?.[0]
  return <div className="decision-value">
    <section className="decision-panel" aria-label="Влияние уточнения"><p className="eyebrow">Понять влияние</p><h2>Уточните данные перед решением</h2>
      {candidate ? <><p>{candidate.section === 'incomes' ? 'Доход' : 'Расход'} в строке {candidate.row_index + 1}: {rub(candidate.min)} — {rub(candidate.max)}. Проверим, как этот диапазон меняет месячный остаток.</p><Button disabled={readOnly || busy} onClick={() => calculate({mode:'sensitivity',section:candidate.section,row_index:candidate.row_index})}>Проверить влияние диапазона</Button></> : <p>В доходах и расходах нет диапазонов для сравнения. Это не подтверждает полноту остальных данных.</p>}
      {sensitivity && <div role="status"><div className="decision-ends">{sensitivity.endpoints.map((p,i) => <div key={i}><small>При сумме {rub(p.input)}</small><strong>{rub(p.free_cashflow)}</strong><span>Остаётся в месяц</span></div>)}</div><p>{sensitivity.assumptions}</p></div>}
    </section>
    <section className="decision-panel" aria-label="Проверить перевод в резерв"><p className="eyebrow">Проверить вариант</p><h2>А если пополнять резерв?</h2><p>Исходный чекап не изменится. Расчёт по серединам сохранённых диапазонов.</p><label className="field"><span>Перевод в резерв каждый месяц, ₽</span><input inputMode="decimal" value={amount} disabled={readOnly || busy} onChange={e => { setAmount(e.target.value); setResult(null) }} /></label><div className="actions"><Button disabled={readOnly || busy || !valid} onClick={() => calculate({mode:'cushion_contribution',monthly_amount:amount,horizon_months:12})}>Проверить перевод</Button><Button variant="ghost" disabled={busy} onClick={() => { epoch.current++; setAmount('0'); setResult(null); setError(null) }}>Сбросить сценарий</Button></div>
      {!valid && <p role="alert">Введите сумму не меньше нуля.</p>}
      {result && <div role="status"><div className="decision-ends"><div><small>Доступно после первого месяца</small><strong>{rub(result.available_after_contribution)}</strong></div><div><small>Дополнительный резерв за 12 месяцев</small><strong>{rub(result.cushion_delta)}</strong></div></div>{result.first_shortfall_month && <p className="precision-warning">Не хватает денег для заданного перевода с {result.first_shortfall_month}-го месяца. В месяцы нехватки перевод пропущен.</p>}<p>{result.assumptions}</p></div>}
      {readOnly && <p role="status">Нет сети: новый расчёт недоступен.</p>}
    </section>
    {step && <section className="decision-panel decision-expectation" aria-label="Ожидаемый результат шага"><p className="eyebrow">Сделать шаг</p><h2>{step.title}</h2><p>{step.rule_key === 'stop_deficit' || step.rule_key === 'close_overdue' ? 'Сначала проверьте обязательные платежи и устраните нехватку денег. Перевод в резерв пока не приоритет.' : 'Ожидаемый результат: проверить доступный остаток и выбрать посильное действие.'}</p><b>На следующем чекапе</b><p>Сравните фактический остаток, долги и резерв. Отметка шага сама по себе не означает, что денег стало больше.</p></section>}
    {busy && <p role="status">Проверяем данные…</p>}<ErrorNote error={error} />
  </div>
}
