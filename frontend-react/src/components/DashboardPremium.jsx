import { useEffect, useMemo, useRef, useState } from 'react';

import { MoneyText } from './MoneyText';

import { SafetyFundActionForm } from './SafetyFundActionForm';

import { showNotification } from './notifications';

import { getMonthlyBurn } from '../utils/expensesDisplay';
import { CAPITAL_FLOWS_SECTION } from '../utils/capitalFlowsNav';
import {
  getSafetyFundFillFromOverview,
  SAFETY_FUND_BASELINE_HINT,
  SAFETY_FUND_CHIP_LABEL,
} from '../utils/safetyFundFill';

import {

  MqxDashStack,

  MqxDashboardHero,

  MqxDivider,

  MqxFinancePeriodBlock,

  MqxNeedsDash,
  MqxNeedsHelpSheet,
  MqxTreatSelfSheet,

  MqxGoalDash,

  MqxPeriodActions,
  MqxJuiceGainFeedback,

} from './mqx';



function formatSignedMoney(n) {

  const v = Number(n) || 0;

  return v >= 0 ? `+${v}` : `${v}`;

}



function formatChipMoneyAria(value, { tone } = {}) {

  const n = Number(value) || 0;

  const abs = Math.abs(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  if (tone === 'pos' && n > 0) return `плюс ${abs} руб.`;

  if (tone === 'out') return `${abs} руб.`;

  if (n < 0) return `минус ${abs} руб.`;

  return `${abs} руб.`;

}



function pctClamp01(x) {

  if (!Number.isFinite(x)) return 0;

  return Math.max(0, Math.min(1, x));

}



export function DashboardPremium({

  overview,

  timeStatus,

  periodStatus = null,

  eventsUnlocked = true,

  pendingEventsCount,

  onOpenEvents,

  onNextPeriod,

  closeMonthDisabled = false,

  claimSalary,

  contributeToSafetyFund,

  withdrawFromSafetyFund,
  treatSelf,
  getNeedsGuide,

  onGoFinance,

  onGoCapitalFlows,

}) {

  const [moneyModal, setMoneyModal] = useState(null); // 'in' | 'out' | null

  const [safetyAmount, setSafetyAmount] = useState(0);

  const [busyAction, setBusyAction] = useState(null); // 'salary'|'in'|'out'|null
  const [juiceBurstKey, setJuiceBurstKey] = useState(0);
  const [juiceAmount, setJuiceAmount] = useState(0);
  const [juiceToastVisible, setJuiceToastVisible] = useState(false);
  const [salaryCelebrate, setSalaryCelebrate] = useState(false);
  const [needsHelpOpen, setNeedsHelpOpen] = useState(false);
  const [treatOpen, setTreatOpen] = useState(false);

  const safetyPanelRef = useRef(null);
  const juiceTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (juiceTimerRef.current) window.clearTimeout(juiceTimerRef.current);
    },
    [],
  );

  const closeSafetyPanel = () => {

    setMoneyModal(null);

    setSafetyAmount(0);

  };

  useEffect(() => {

    if (!moneyModal) return undefined;

    const onPointerDown = (e) => {

      if (safetyPanelRef.current?.contains(e.target)) return;

      if (e.target.closest('[data-money-trigger]')) return;

      closeSafetyPanel();

    };

    document.addEventListener('pointerdown', onPointerDown, true);

    return () => document.removeEventListener('pointerdown', onPointerDown, true);

  }, [moneyModal]);



  const periodIndex = timeStatus?.period_index ?? overview?.period_index ?? 0;

  const salaryClaimed = periodStatus?.salary_claimed === true;
  const canClaimSalary = periodStatus?.can_claim_salary === true;
  const salaryDisabled = busyAction !== null || salaryClaimed || (periodStatus != null && !canClaimSalary);

  const financeCards = useMemo(() => {

    const cash = Number(overview?.cash_balance) || 0;

    const safety = Number(overview?.safety_fund_balance) || 0;

    const totalIncome = Number(overview?.total_monthly_income) || 0;

    const lifestyleExpense = getMonthlyBurn(overview);
    const cushionFill = getSafetyFundFillFromOverview(overview);

    return [
      {
        title: 'Доходы',
        chipAction: CAPITAL_FLOWS_SECTION.income,
        titleHint:
          'Сумма доходов за период: зарплата и доход от активов (без вычета расходов и платежей по долгам)',
        valueNode: <MoneyText value={totalIncome} />,
        valueLabel: formatChipMoneyAria(totalIncome, { tone: 'pos' }),
        accent: 'mqx-accent--sky',
        valueTone: 'pos',
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
        chipAction: CAPITAL_FLOWS_SECTION.expense,
        titleHint: 'Расходы на жизнь за период (без платежей по долгам)',
        valueNode: <MoneyText value={lifestyleExpense} />,
        valueLabel: formatChipMoneyAria(lifestyleExpense, { tone: 'out' }),
        accent: 'mqx-accent--amber',
        valueTone: 'out',
        expenseIcon: true,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ),
      },
      {
        title: 'Баланс',
        juiceTarget: 'balance',
        valueNode: <MoneyText value={cash} />,
        valueLabel: formatChipMoneyAria(cash),
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
        title: SAFETY_FUND_CHIP_LABEL,
        titleHint: cushionFill
          ? `${SAFETY_FUND_CHIP_LABEL} · ${cushionFill.percent}% от нормы (${SAFETY_FUND_BASELINE_HINT})`
          : 'Финансовая подушка — запас на чёрный день',
        valueNode: <MoneyText value={safety} />,
        valueLabel: cushionFill
          ? `${formatChipMoneyAria(safety)}, наполнение ${cushionFill.percent}%`
          : formatChipMoneyAria(safety),
        accent: 'mqx-accent--emerald',
        cushionChip: true,
        cushionFill,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 20 7v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4Z" />
            <path d="M9.5 12.2 11 13.7 14.6 10.1" />
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




  const safetyModalLimits = useMemo(() => {

    const cash = Math.max(0, Math.floor(Number(overview?.cash_balance) || 0));

    const safety = Math.max(0, Math.floor(Number(overview?.safety_fund_balance) || 0));

    if (moneyModal === 'in') {

      return { max: cash, chipValue: safety, chipHint: 'в подушке' };

    }

    if (moneyModal === 'out') {

      return { max: safety, chipValue: cash, chipHint: 'на счёте' };

    }

    return { max: 0, chipValue: 0, chipHint: '' };

  }, [moneyModal, overview]);



  const submitMoney = async () => {

    const amt = safetyAmount;

    if (!Number.isFinite(amt) || amt <= 0 || amt > safetyModalLimits.max) {

      showNotification('Введите корректную сумму', 'error');

      return;

    }

    try {

      setBusyAction(moneyModal === 'in' ? 'in' : 'out');

      if (moneyModal === 'in') {

        const res = await contributeToSafetyFund(amt);
        showNotification('Фин.подушка пополнена', 'success');

      } else {

        await withdrawFromSafetyFund(amt);

        showNotification('С подушки снято', 'success');

      }

      closeSafetyPanel();

    } catch (e) {

      showNotification(e?.detail || e?.message || 'Не удалось выполнить действие', 'error');

    } finally {

      setBusyAction(null);

    }

  };



  return (

    <>

      <div className="mqx-tab-page mqx-tab-page--dash-unified">

        <MqxDashboardHero
          periodIndex={periodIndex}
          onCloseMonth={onNextPeriod}
          closeMonthDisabled={closeMonthDisabled || busyAction !== null}
          pendingEventsCount={eventsUnlocked ? pendingEventsCount : 0}
          onOpenEvents={eventsUnlocked ? onOpenEvents : undefined}
        />



        <main className="mqx-content mqx-tab-page__scroll mqx-content--dash-flat">

          <MqxDashStack className="mqx-dash-stack--unified mqx-juice-host">
            <MqxJuiceGainFeedback
              burstKey={juiceBurstKey}
              amount={juiceAmount}
              toastVisible={juiceToastVisible}
              toastMessage="Зарплата в кошелёк — ход стал сильнее"
            />

            <MqxNeedsDash
              needs={overview?.needs}
              needsZeroPeriodsStreak={overview?.needs_zero_periods_streak ?? overview?.needsZeroPeriodsStreak ?? 0}
              treatSelf={overview?.treat_self}
              onHelp={() => setNeedsHelpOpen(true)}
              onTreatSelf={() => setTreatOpen(true)}
            />

            <MqxDivider />

            <MqxFinancePeriodBlock
              financeCards={financeCards}
              onGoFinance={onGoFinance}
              onFlowsNavigate={onGoCapitalFlows}
              juiceGainActive={salaryCelebrate}
            />

            <MqxDivider />

            <MqxGoalDash victory={overview?.victory} legacyGoal={goal} />

            <MqxDivider />

            <MqxPeriodActions
              busy={busyAction !== null}
              salaryDisabled={salaryDisabled}
              salaryCelebrate={salaryCelebrate}
              onSalary={async () => {
                if (salaryClaimed) {
                  showNotification('Зарплата за этот период уже получена', 'info');
                  return;
                }
                if (periodStatus != null && !canClaimSalary) {
                  showNotification('Зарплату в этом периоде получить нельзя', 'info');
                  return;
                }

                try {
                  setBusyAction('salary');
                  const result = await claimSalary();
                  if (result?.already_claimed) {
                    showNotification(
                      result.message || 'Зарплата за этот период уже получена',
                      'info',
                    );
                  } else if (result?.status === 'success') {
                    const amount = Number(result.amount) || 0;
                    if (amount > 0) {
                      if (juiceTimerRef.current) window.clearTimeout(juiceTimerRef.current);
                      setJuiceAmount(amount);
                      setJuiceBurstKey((k) => k + 1);
                      setSalaryCelebrate(true);
                      setJuiceToastVisible(true);
                      juiceTimerRef.current = window.setTimeout(() => {
                        setSalaryCelebrate(false);
                        setJuiceToastVisible(false);
                        juiceTimerRef.current = null;
                      }, 2400);
                    } else {
                      showNotification('Зарплата на счёт', 'success');
                    }
                  }
                } catch (e) {
                  showNotification(e?.detail || e?.message || 'Не удалось получить зарплату', 'error');
                } finally {
                  setBusyAction(null);
                }
              }}

              onContribute={() => {

                setSafetyAmount(0);

                setMoneyModal('in');

              }}

              onWithdraw={() => {

                setSafetyAmount(0);

                setMoneyModal('out');

              }}

              onInvest={onGoFinance}

            />

            {moneyModal ? (
              <div ref={safetyPanelRef} className="mqx-dash-safety-panel">
                <SafetyFundActionForm
                  mode={moneyModal}
                  amount={safetyAmount}
                  maxAmount={safetyModalLimits.max}
                  chipValue={safetyModalLimits.chipValue}
                  chipHint={safetyModalLimits.chipHint}
                  onAmountChange={setSafetyAmount}
                  onSubmit={submitMoney}
                  submitLabel={moneyModal === 'in' ? 'Перевести в подушку' : 'Снять на счёт'}
                  busy={busyAction === 'in' || busyAction === 'out'}
                />
              </div>
            ) : null}

          </MqxDashStack>

        </main>

      </div>

      <MqxNeedsHelpSheet
        open={needsHelpOpen}
        onClose={() => setNeedsHelpOpen(false)}
        loadGuide={getNeedsGuide}
      />
      <MqxTreatSelfSheet
        open={treatOpen}
        onClose={() => setTreatOpen(false)}
        treatSelf={treatSelf}
        treatSelfState={overview?.treat_self}
      />
    </>

  );

}

