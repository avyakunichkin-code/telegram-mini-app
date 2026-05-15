import { useMemo, useState } from 'react';
import { Button, Modal } from '@telegram-apps/telegram-ui';
import { MoneyText } from './MoneyText';
import { showNotification } from './notifications';

function formatSignedMoney(n) {
  const v = Number(n) || 0;
  return v >= 0 ? `+${v}` : `${v}`;
}

function pctClamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function DashboardPremium({
  overview,
  timeStatus,
  pendingEventsCount,
  onOpenEvents,
  setPlay,
  setPause,
  onNextPeriod,
  claimSalary,
  contributeToSafetyFund,
  withdrawFromSafetyFund,
  onGoFinance,
}) {
  const [moneyModal, setMoneyModal] = useState(null); // 'in' | 'out' | null
  const [amountStr, setAmountStr] = useState('');
  const [busyAction, setBusyAction] = useState(null); // 'salary'|'in'|'out'|null

  const periodIndex = timeStatus?.period_index ?? overview?.period_index ?? 0;
  const remaining = timeStatus?.remainingLocal ?? timeStatus?.seconds_until_next_period ?? 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(Math.floor(remaining % 60)).padStart(2, '0');

  const financeCards = useMemo(() => {
    const cash = Number(overview?.cash_balance) || 0;
    const safety = Number(overview?.safety_fund_balance) || 0;
    const flow = Number(overview?.net_monthly_cashflow) || 0;
    const streak = Number(overview?.clean_period_streak) || 0;
    return [
      {
        title: 'Баланс',
        valueNode: <MoneyText value={cash} />,
        accent: 'mqx-accent--violet',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 10V7a5 5 0 0 1 10 0v3" />
            <path d="M6 10h12v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V10Z" />
            <path d="M10 14h4" />
          </svg>
        ),
      },
      {
        title: 'Подушка',
        valueNode: <MoneyText value={safety} />,
        accent: 'mqx-accent--emerald',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 20 7v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4Z" />
            <path d="M9.5 12.2 11 13.7 14.6 10.1" />
          </svg>
        ),
      },
      {
        title: 'Чистый поток',
        valueNode: <MoneyText value={formatSignedMoney(flow)} />,
        accent: 'mqx-accent--sky',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M7 15l4-4 3 3 5-6" />
          </svg>
        ),
      },
      {
        title: 'Стрик месяцев',
        valueNode: <span className="mqx-card-value">{streak}</span>,
        accent: 'mqx-accent--amber',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3v3" />
            <path d="M17 3v3" />
            <path d="M4 8h16" />
            <path d="M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
            <path d="M8 12h4" />
            <path d="M8 16h6" />
          </svg>
        ),
      },
    ];
  }, [overview]);

  const goal = useMemo(() => {
    const current = Number(overview?.safety_fund_balance) || 0;
    const target = Number(overview?.win_target_safety_fund) || 0;
    const frac = target > 0 ? current / target : 0;
    return {
      target,
      current,
      frac: pctClamp01(frac),
      win: !!overview?.win_reached,
      ready: !!overview?.win_ready,
    };
  }, [overview]);

  const overviewBars = useMemo(() => {
    const income = Number(overview?.total_monthly_income) || 0;
    const liab = Number(overview?.total_monthly_liabilities_payment) || 0;
    const maint = Number(overview?.total_monthly_assets_maintenance) || 0;
    const denom = Math.max(income, liab + maint, 1);
    return [
      { label: 'Ежемесячный доход', value: income, frac: income / denom, tone: 'mqx-bar--emerald' },
      { label: 'Платежи по долгам', value: liab, frac: liab / denom, tone: 'mqx-bar--rose' },
      { label: 'Обслуживание активов', value: maint, frac: maint / denom, tone: 'mqx-bar--violet' },
    ];
  }, [overview]);

  const canPlay = timeStatus?.time_state !== 'play';
  const canPause = timeStatus?.time_state !== 'pause';

  const submitMoney = async () => {
    const amt = Number(String(amountStr).replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      showNotification('Введите корректную сумму', 'error');
      return;
    }
    try {
      setBusyAction(moneyModal === 'in' ? 'in' : 'out');
      if (moneyModal === 'in') {
        await contributeToSafetyFund(amt);
        showNotification('Подушка пополнена', 'success');
      } else {
        await withdrawFromSafetyFund(amt);
        showNotification('С подушки снято', 'success');
      }
      setAmountStr('');
      setMoneyModal(null);
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось выполнить действие', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <header className="mqx-hero">
          <div className="mqx-hero__glow" aria-hidden />

          <div className="mqx-hero__top">
            <div>
              <div className="mqx-hero__kicker">Money Quest</div>
              <div className="mqx-hero__title">Финансы как игра</div>
            </div>

            <div className="mqx-period-chip">
              <div className="mqx-period-chip__label">Период</div>
              <div className="mqx-period-chip__value">#{periodIndex}</div>
            </div>
          </div>

          <div className="mqx-hero__mid">
            <div className="mqx-timer">
              <div className="mqx-timer__label">Игровое время</div>
              <div className="mqx-timer__value">
                {mm}:{ss}
              </div>
            </div>

            <div className="mqx-hero-actions">
              <button
                type="button"
                className="mqx-btn mqx-btn--filled"
                disabled={!canPlay}
                onClick={() => setPlay()}
              >
                Играть
              </button>
              <button
                type="button"
                className="mqx-btn mqx-btn--outline"
                disabled={!canPause}
                onClick={() => setPause()}
              >
                Пауза
              </button>
            </div>
          </div>

          <div className="mqx-hero__bottom">
            <button type="button" className="mqx-pill" onClick={onNextPeriod}>
              Следующий период
            </button>
            {pendingEventsCount > 0 ? (
              <button type="button" className="mqx-pill mqx-pill--events" onClick={onOpenEvents}>
                События <span className="mqx-pill__badge">{pendingEventsCount}</span>
              </button>
            ) : null}
          </div>
      </header>

      <main className="mqx-content">
          <section className="mqx-card mqx-card--goal">
            <div className="mqx-goal__top">
              <div>
                <div className="mqx-card__kicker mqx-card__kicker--emerald">Цель</div>
                <div className="mqx-card__title">Финансовая свобода</div>
              </div>
              <div className="mqx-goal__badge">{goal.win ? 'Победа' : goal.ready ? 'Почти' : 'В работе'}</div>
            </div>

            {goal.target > 0 ? (
              <div className="mqx-goal__progress">
                <div className="mqx-goal__row">
                  <span>Подушка к цели</span>
                  <span>
                    <MoneyText value={goal.current} decimals={0} /> / <MoneyText value={goal.target} decimals={0} />
                  </span>
                </div>
                <div className="mqx-progress">
                  <div className="mqx-progress__fill" style={{ width: `${Math.round(goal.frac * 100)}%` }} />
                </div>
              </div>
            ) : (
              <div className="mqx-goal__progress">
                <div className="mqx-goal__row">
                  <span>Цель не задана</span>
                  <span>—</span>
                </div>
              </div>
            )}
          </section>

          <section className="mqx-block">
            <div className="mqx-block__head">
              <div className="mqx-block__title">Финансы</div>
              <button type="button" className="mqx-link" onClick={onGoFinance}>
                Детали
              </button>
            </div>
            <div className="mqx-grid2">
              {financeCards.map((c) => (
                <div key={c.title} className="mqx-mini" role="group" aria-label={c.title}>
                  <div className={`mqx-mini__icon ${c.accent}`} aria-hidden>
                    {c.icon}
                  </div>
                  <div className="mqx-mini__label">{c.title}</div>
                  <div className="mqx-mini__value">{c.valueNode}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mqx-card">
            <div className="mqx-actions__head">
              <div>
                <div className="mqx-card__title">Действия периода</div>
                <div className="mqx-card__sub">Управляй денежным потоком</div>
              </div>
              <div className="mqx-xp">XP +10</div>
            </div>

            <div className="mqx-grid2">
              <button
                type="button"
                className="mqx-action"
                disabled={busyAction !== null}
                onClick={async () => {
                  try {
                    setBusyAction('salary');
                    await claimSalary();
                    showNotification('Зарплата получена', 'success');
                  } catch (e) {
                    showNotification(e?.detail || e?.message || 'Не удалось получить зарплату', 'error');
                  } finally {
                    setBusyAction(null);
                  }
                }}
              >
                Получить зарплату
              </button>
              <button
                type="button"
                className="mqx-action"
                disabled={busyAction !== null}
                onClick={() => {
                  setAmountStr('');
                  setMoneyModal('in');
                }}
              >
                В подушку
              </button>
              <button
                type="button"
                className="mqx-action"
                disabled={busyAction !== null}
                onClick={() => {
                  setAmountStr('');
                  setMoneyModal('out');
                }}
              >
                Снять
              </button>
              <button type="button" className="mqx-action" onClick={onGoFinance}>
                Инвестировать
              </button>
            </div>
          </section>

          <section className="mqx-card">
            <div className="mqx-analytics__head">
              <div>
                <div className="mqx-card__kicker">Уровень</div>
                <div className="mqx-analytics__title">Финансовый стратег</div>
              </div>
              <div className="mqx-score">
                <div className="mqx-score__label">Очки</div>
                <div className="mqx-score__value">{Number(overview?.score ?? 0)}</div>
              </div>
            </div>

            <div className="mqx-bars">
              {overviewBars.map((b) => (
                <div key={b.label}>
                  <div className="mqx-bars__row">
                    <span className="mqx-bars__label">{b.label}</span>
                    <span className="mqx-bars__value">
                      <MoneyText value={b.value} decimals={0} />
                    </span>
                  </div>
                  <div className="mqx-bars__track">
                    <div className={`mqx-bars__fill ${b.tone}`} style={{ width: `${Math.round(pctClamp01(b.frac) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mqx-xp-card">
              <div className="mqx-xp-card__row">
                <span>XP до следующего уровня</span>
                <strong>{Number(overview?.xp_to_next_level ?? 0)} XP</strong>
              </div>
              <div className="mqx-xp-card__track">
                <div className="mqx-xp-card__fill" style={{ width: '90%' }} />
              </div>
            </div>
          </section>
      </main>

      <Modal open={moneyModal !== null} onClose={() => setMoneyModal(null)}>
        <div className="mqx-modal">
          <div className="mqx-card">
            <div className="mqx-card__title">{moneyModal === 'in' ? 'В подушку' : 'Снять с подушки'}</div>
            <p className="mq-modal-lead" style={{ marginTop: 8 }}>Сумма</p>
            <label className="mq-field" style={{ marginTop: 6 }}>
              <span className="mq-field__label visually-hidden">Сумма</span>
              <input
                className="mq-field__input"
                name={moneyModal === 'in' ? 'safety_fund_in' : 'safety_fund_out'}
                inputMode="numeric"
                value={amountStr}
                placeholder="0"
                onChange={(e) => setAmountStr(e.target.value)}
              />
            </label>
            <div className="mq-modal-actions" style={{ marginTop: 16 }}>
              <Button mode="filled" stretched disabled={busyAction !== null} onClick={submitMoney}>
                Выполнить
              </Button>
              <Button mode="outline" stretched onClick={() => setMoneyModal(null)}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

