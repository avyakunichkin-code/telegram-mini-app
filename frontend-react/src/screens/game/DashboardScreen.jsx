import { useEffect, useMemo, useRef, useState } from 'react';


import { showNotification } from '../../components/notifications';
import { suggestSafetyFundAmount } from '../../utils/safetyFundAmount';

import { getSafetyFundFillFromOverview } from '../../utils/safetyFundFill';
import { personaRoleTitle } from '../../components/mqx/brand/personaRoles';
import { buildTurnTip, closePreviewView, incomeCell } from '../../components/mqx/utils/boardDashDisplay';
import { buildGoalChainView } from '../../components/mqx/utils/goalChainDisplay';

import {

  MqxPocketHero, MqxPocketTickets,

  MqxFinancePeriodBlock,

  MqxNeedsDash,
  MqxNeedsHelpSheet,
  MqxTreatSelfSheet,

  MqxPocketGoal,

  MqxPeriodActions,
  MqxJuiceGainFeedback,
  MqxSafetyFundSheet,

} from '../../components/mqx/index';



function pctClamp01(x) {

  if (!Number.isFinite(x)) return 0;

  return Math.max(0, Math.min(1, x));

}



export function DashboardScreen({
  profileId = null,

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

  onGoFinanceInvest,

  onGoCapitalFlows,

  onGuidanceScreenEnter,

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

  const juiceTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (juiceTimerRef.current) window.clearTimeout(juiceTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (needsHelpOpen) onGuidanceScreenEnter?.('needs');
  }, [needsHelpOpen, onGuidanceScreenEnter]);

  const closeSafetyPanel = () => {

    setMoneyModal(null);

    setSafetyAmount(0);

  };

  const periodIndex = timeStatus?.period_index ?? overview?.period_index ?? 0;

  const salaryClaimed = periodStatus?.salary_claimed === true;
  const canClaimSalary = periodStatus?.can_claim_salary === true;
  const salaryDisabled = busyAction !== null || salaryClaimed || (periodStatus != null && !canClaimSalary);

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




  const cashBalance = Math.max(0, Math.floor(Number(overview?.cash_balance) || 0));
  const safetyBalance = Math.max(0, Math.floor(Number(overview?.safety_fund_balance) || 0));
  const cushionFill = getSafetyFundFillFromOverview(overview);
  const templateKey = overview?.victory?.template_key ?? overview?.starter_template_key;
  const shownEventsCount = eventsUnlocked ? Number(pendingEventsCount) || 0 : 0;
  const salaryAvailable = !salaryClaimed && (periodStatus == null || canClaimSalary);

  const goalView = useMemo(
    () => buildGoalChainView(overview?.victory, goal),
    [overview?.victory, goal],
  );

  const closePreview = useMemo(
    () => closePreviewView(overview?.period_close_preview),
    [overview?.period_close_preview],
  );

  const turnTip = useMemo(
    () =>
      buildTurnTip({
        needs: overview?.needs,
        needsZeroStreak: overview?.needs_zero_periods_streak,
        overdueCount: overview?.overdue_liabilities_count,
        salaryAvailable,
        pendingEventsCount: shownEventsCount,
        goalView,
        closePreview,
        safetyBalance,
        salaryAmount: overview?.salary?.monthly_amount,
      }),
    [overview, salaryAvailable, shownEventsCount, goalView, closePreview, safetyBalance],
  );

  const openSafetySheet = (mode) => {
    const max = mode === 'in' ? cashBalance : safetyBalance;
    setSafetyAmount(suggestSafetyFundAmount(max));
    setMoneyModal(mode);
  };

  const submitMoney = async () => {

    const amt = safetyAmount;

    const max = moneyModal === 'in' ? cashBalance : safetyBalance;
    if (!Number.isFinite(amt) || amt <= 0 || amt > max) {

      showNotification('Введи корректную сумму', 'error');

      return;

    }

    try {

      setBusyAction(moneyModal === 'in' ? 'in' : 'out');

      if (moneyModal === 'in') {

        const res = await contributeToSafetyFund(amt);
        showNotification('Подушка пополнена', 'success');

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



  const handleSalary = async () => {
                if (salaryClaimed) {
                  showNotification('Зарплата за этот ход уже получена', 'info');
                  return;
                }
                if (periodStatus != null && !canClaimSalary) {
                  showNotification('Зарплату в этом ходе получить нельзя', 'info');
                  return;
                }

                try {
                  setBusyAction('salary');
                  const result = await claimSalary();
                  if (result?.already_claimed) {
                    showNotification(
                      result.message || 'Зарплата за этот ход уже получена',
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
  };
  return <>
    <div className="mqx-tab-page mqx-tab-page--dash-unified mqx-tab-page--board mqx-pocket">
      <main className="mqx-content mqx-tab-page__scroll">
        <div className="mqx-pocket-heading"><span>Твоя партия · твои решения</span><h2>Собери жизнь<br />по своим правилам.</h2></div>
        <div className="mqx-pocket-layout mqx-juice-host">
          <MqxJuiceGainFeedback burstKey={juiceBurstKey} amount={juiceAmount} toastVisible={juiceToastVisible} toastMessage="Зарплата в кошелёк — ход стал сильнее" />
          <div className="mqx-pocket-main">
            <MqxPocketHero roleTitle={personaRoleTitle(templateKey)} templateKey={templateKey} periodIndex={periodIndex}
              cash={Number(overview?.cash_balance) || 0} closePreview={closePreview} onCloseMonth={onNextPeriod}
              closeMonthDisabled={closeMonthDisabled || busyAction !== null} juiceGainActive={salaryCelebrate} help={turnTip?.tone === 'risk'
                ? { pose: 'worried', title: 'Обрати внимание', text: turnTip.text }
                : salaryAvailable ? { pose: 'think', title: 'Зарплата за этот ход', text: 'Забери зарплату до завершения хода: пропущенная выплата не переносится.' }
                : shownEventsCount > 0 ? { pose: 'surprised', title: 'Твоё решение', text: 'Открой «События» и выбери, как поступить. Посмотри на последствия для денег и потребностей.' }
                : { pose: 'joy', title: 'Можно подвести итог', text: 'Основные действия выполнены. Проверь прогноз списаний и заверши ход, когда будешь готов.' }} />
            <MqxPocketTickets pendingEventsCount={shownEventsCount} onOpenEvents={eventsUnlocked ? onOpenEvents : undefined}
              salaryClaimed={salaryClaimed} salaryAvailable={salaryAvailable} salaryDisabled={salaryDisabled} busy={busyAction !== null}
              salaryAmount={Number(overview?.salary?.monthly_amount) || 0} salaryCelebrate={salaryCelebrate} onSalary={handleSalary} />
            <MqxNeedsDash compact needs={overview?.needs} needsZeroPeriodsStreak={overview?.needs_zero_periods_streak}
              treatSelf={overview?.treat_self} needsMeta={overview?.needs_meta} cash={overview?.cash_balance} busy={busyAction !== null}
              onHelp={() => setNeedsHelpOpen(true)} onTreatSelf={() => setTreatOpen(true)} />
            <MqxPeriodActions showSalary={false} busy={busyAction !== null} activeMoneyMode={moneyModal}
              onContribute={() => openSafetySheet('in')} onWithdraw={() => openSafetySheet('out')} onInvest={onGoFinanceInvest ?? onGoFinance} />
            <MqxFinancePeriodBlock showBalance={false} templateKey={templateKey} cash={Number(overview?.cash_balance) || 0}
              safety={Number(overview?.safety_fund_balance) || 0} cushionPercent={cushionFill?.percent ?? null} income={incomeCell(overview)}
              outflow={Number(overview?.total_monthly_outflow) || 0} onFlowsNavigate={onGoCapitalFlows} cushionRisk={Boolean(closePreview?.negative)} />
          </div>
          <aside className="mqx-pocket-side">
            <MqxPocketGoal victory={overview?.victory} legacyGoal={goal} cash={overview?.cash_balance} outflow={overview?.total_monthly_outflow}
              busy={busyAction !== null} onContribute={(amount) => { setSafetyAmount(amount); setMoneyModal('in'); }} />
          </aside>
        </div>
      </main>
    </div>
    <MqxNeedsHelpSheet open={needsHelpOpen} onClose={() => setNeedsHelpOpen(false)} loadGuide={getNeedsGuide} />
    <MqxTreatSelfSheet open={treatOpen} onClose={() => setTreatOpen(false)} treatSelf={treatSelf} treatSelfState={overview?.treat_self} />
    <MqxSafetyFundSheet open={moneyModal != null} mode={moneyModal || 'in'} onClose={closeSafetyPanel} amount={safetyAmount}
      onAmountChange={setSafetyAmount} onSubmit={submitMoney} busy={busyAction === 'in' || busyAction === 'out'} cashBalance={cashBalance} safetyBalance={safetyBalance} />
  </>;
}
