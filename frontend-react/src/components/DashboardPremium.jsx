import { useMemo, useState, lazy, Suspense } from 'react';
import { Button, Modal } from '@telegram-apps/telegram-ui';
import { MoneyText } from './MoneyText';
import { showNotification } from './notifications';
import {
  MqxButton,
  MqxDashStack,
  MqxDivider,
  MqxLevelBlock,
  MqxPeriodActions,
  MqxPeriodChip,
  MqxPeriodDashboard,
  MqxPill,
} from './mqx';

const PeriodJourneyLottie = lazy(() => import('./PeriodJourneyLottie'));

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
    const lifestyleExpense = Number(overview?.monthly_lifestyle_expense) || 0;
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
        title: 'Поток',
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
        title: 'Расходы',
        valueNode: <MoneyText value={lifestyleExpense} />,
        accent: 'mqx-accent--amber',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M16 9l-4 4-2-2-4 4" />
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

  const characterXp = useMemo(() => {
    const level = Math.max(1, Number(overview?.character_level) || 1);
    const xp = Math.max(0, Number(overview?.character_xp) || 0);
    const needRaw = overview?.character_xp_need_for_next;
    const need = Number.isFinite(Number(needRaw)) && Number(needRaw) > 0 ? Number(needRaw) : 100;
    const frac = need > 0 ? xp / need : 0;
    return { level, xp, need, frac: pctClamp01(frac) };
  }, [overview]);

  const levelBars = useMemo(() => {
    const income = Number(overview?.total_monthly_income) || 0;
    const liab = Number(overview?.total_monthly_liabilities_payment) || 0;
    const denom = Math.max(income, liab, 1);
    return [
      { label: 'Доход', value: income, frac: income / denom, tone: 'mqx-bar--emerald' },
      { label: 'Долги', value: liab, frac: liab / denom, tone: 'mqx-bar--rose' },
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
    <div className="mqx-tab-page">
      <header className="mqx-hero">
          <div className="mqx-hero__glow" aria-hidden />

          <div className="mqx-hero__top">
            <div>
              <div className="mqx-hero__kicker">Money Quest</div>
              <div className="mqx-hero__title">Финансы как игра</div>
            </div>

            <MqxPeriodChip value={`#${periodIndex}`} />
          </div>

          <div className="mqx-hero__mid">
            <div className="mqx-timer">
              <div className="mqx-timer__label">Игровое время</div>
              <div className="mqx-timer__value">
                {mm}:{ss}
              </div>
            </div>

            <div className="mqx-hero-actions">
              <MqxButton variant="hero-filled" disabled={!canPlay} onClick={() => setPlay()}>
                Играть
              </MqxButton>
              <MqxButton variant="hero-outline" disabled={!canPause} onClick={() => setPause()}>
                Пауза
              </MqxButton>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="mq-period-boy mq-period-boy--lottie mq-period-boy--lottie-skeleton" aria-hidden>
                <div className="mq-period-boy__label">Цикл месяца · Lottie</div>
                <div className="mq-period-boy__lottie-wrap mq-period-boy__lottie-wrap--skeleton" />
              </div>
            }
          >
            <PeriodJourneyLottie
              timeState={timeStatus?.time_state}
              remainingSeconds={remaining}
              periodDurationSeconds={timeStatus?.period_duration_seconds}
            />
          </Suspense>

          <div className="mqx-hero__bottom">
            <MqxPill onClick={onNextPeriod}>Следующий период</MqxPill>
            {pendingEventsCount > 0 ? (
              <MqxPill events badge={pendingEventsCount} onClick={onOpenEvents}>
                События
              </MqxPill>
            ) : null}
          </div>
      </header>

      <main className="mqx-content mqx-tab-page__scroll mqx-content--dash-flat">
          <MqxDashStack>
            <MqxLevelBlock
              level={characterXp.level}
              xp={characterXp.xp}
              xpNeed={characterXp.need}
              xpFrac={characterXp.frac}
              score={Number(overview?.score ?? 0)}
              bars={levelBars}
            />
            <MqxDivider />
            <MqxPeriodDashboard
              victory={overview?.victory}
              legacyGoal={goal}
              financeCards={financeCards}
              onGoFinance={onGoFinance}
            />
            <MqxDivider />
            <MqxPeriodActions
              busy={busyAction !== null}
              onSalary={async () => {
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
              onContribute={() => {
                setAmountStr('');
                setMoneyModal('in');
              }}
              onWithdraw={() => {
                setAmountStr('');
                setMoneyModal('out');
              }}
              onInvest={onGoFinance}
            />
          </MqxDashStack>
      </main>
    </div>

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
