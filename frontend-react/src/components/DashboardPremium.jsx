import { useMemo, useState } from 'react';
import { Button, Modal } from '@telegram-apps/telegram-ui';
import { MoneyText } from './MoneyText';
import { showNotification } from './notifications';
import { getMonthlyBurn } from '../utils/expensesDisplay';
import { buildLevelProgressHint } from '../utils/levelProgressHint';
import {
  MqxDashStack,
  MqxDashboardHero,
  MqxDivider,
  MqxLevelBlock,
  MqxPeriodActions,
  MqxPeriodDashboard,
} from './mqx';

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
  eventsUnlocked = true,
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

  const monthlyBurn = getMonthlyBurn(overview);
  const periodIndex = timeStatus?.period_index ?? overview?.period_index ?? 0;
  const remaining = timeStatus?.remainingLocal ?? timeStatus?.seconds_until_next_period ?? 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(Math.floor(remaining % 60)).padStart(2, '0');

  const financeCards = useMemo(() => {
    const cash = Number(overview?.cash_balance) || 0;
    const safety = Number(overview?.safety_fund_balance) || 0;
    const flow = Number(overview?.net_monthly_cashflow) || 0;
    const lifestyleExpense = getMonthlyBurn(overview);
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
        title: 'На жизнь',
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

  const levelProgressHint = useMemo(
    () => (overview ? buildLevelProgressHint(overview) : null),
    [overview],
  );

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
        const res = await contributeToSafetyFund(amt);
        const xpg = Number(res?.xp_gained) || 0;
        if (res?.level_up && res?.new_level) {
          showNotification(`Подушка пополнена · уровень ${res.new_level}`, 'success', { ttlMs: 3200 });
        } else if (xpg > 0) {
          showNotification(`Подушка +${xpg} XP`, 'success');
        } else {
          showNotification('Подушка пополнена', 'success');
        }
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
        <MqxDashboardHero
          periodIndex={periodIndex}
          timerLabel="Прогресс месяца"
          timerValue={`${mm}:${ss}`}
          periodDurationSeconds={timeStatus?.period_duration_seconds}
          remainingSeconds={remaining}
          canPlay={canPlay}
          canPause={canPause}
          onPlay={() => setPlay()}
          onPause={() => setPause()}
          onNextPeriod={onNextPeriod}
          pendingEventsCount={eventsUnlocked ? pendingEventsCount : 0}
          onOpenEvents={eventsUnlocked ? onOpenEvents : undefined}
        />

        <main className="mqx-content mqx-tab-page__scroll mqx-content--dash-flat">
          <MqxDashStack>
            <MqxLevelBlock
              level={characterXp.level}
              xp={characterXp.xp}
              xpNeed={characterXp.need}
              xpFrac={characterXp.frac}
              score={Number(overview?.score ?? 0)}
              bars={levelBars}
              progressHint={levelProgressHint}
            />
            <MqxDivider />
            <MqxPeriodDashboard
              victory={overview?.victory}
              legacyGoal={goal}
              financeCards={financeCards}
              onGoFinance={onGoFinance}
            />
            {monthlyBurn > 0 ? (
              <p className="mqx-dash-burn-hint" role="note">
                Чистый поток — до расходов на жизнь. В конце периода спишется ещё{' '}
                <MoneyText value={monthlyBurn} decimals={0} />.
              </p>
            ) : null}
            <MqxDivider />
            <MqxPeriodActions
              xpLabel={`${characterXp.xp} / ${characterXp.need} XP`}
              busy={busyAction !== null}
              onSalary={async () => {
                try {
                  setBusyAction('salary');
                  const salaryRes = await claimSalary();
                  if (salaryRes?.level_up && salaryRes?.new_level) {
                    showNotification(`Уровень ${salaryRes.new_level}!`, 'success', { ttlMs: 3200 });
                  } else {
                    showNotification('Зарплата на счёт · XP в конце месяца', 'success');
                  }
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

      <Modal
        open={moneyModal !== null}
        onClose={() => setMoneyModal(null)}
        title={moneyModal === 'in' ? 'В подушку' : 'Снять с подушки'}
      >
        <div className="mqx-modal" role="document" aria-labelledby="mqx-safety-fund-modal-title">
          <div className="mqx-card">
            <div id="mqx-safety-fund-modal-title" className="mqx-card__title">
              {moneyModal === 'in' ? 'В подушку' : 'Снять с подушки'}
            </div>
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
