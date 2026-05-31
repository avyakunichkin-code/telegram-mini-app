import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { DashboardPremium } from './DashboardPremium';
import { FinancePremium } from './FinancePremium';
import { AnalyticsPremium } from './AnalyticsPremium';
import { MenuPremium } from './MenuPremium';
import { showNotification } from './notifications';
import { API, formatApiErrorDetail } from '../api';
import { EventCarouselOverlay } from './mqx/events/EventCarouselOverlay';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';
import { GameScreenLayout, GameScreenTabNav } from './GameScreenLayout';
import {
  MqxPeriodCloseTail,
  MqxPeriodCloseRitual,
  MqxSalaryWarnModal,
  MqxGameOverModal,
  MqxStateError,
  MqxStateSkeleton,
} from './mqx';
import { PERIOD_CLOSE_AUTO_MAX } from '../constants/periodClose';
import { shouldAutoOpenPeriodClose } from '../utils/periodCloseDisplay';
import { GameOnboardingLayer } from './GameOnboardingLayer';

/** Эмоциональный слой страницы (TB1: без play/pause — активная партия = playing mood). */
function gamePageMoodClass(timeStatus) {
  if (!timeStatus) return 'mq-page--mood-await';
  return 'mq-page--mood-playing';
}

export function GameScreen({ onLogout, onNewGame, onLoadGame }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  /** @type {['income'|'expense'|null, function]} */
  const [capitalFlowsOpen, setCapitalFlowsOpen] = useState(null);
  const [salaryWarnOpen, setSalaryWarnOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [onboardingUi, setOnboardingUi] = useState({ visible: false, lockTabs: false });
  const [queuedPeriodClose, setQueuedPeriodClose] = useState(null);
  const [lastPeriodClose, setLastPeriodClose] = useState(null);
  const [periodCloseOpen, setPeriodCloseOpen] = useState(false);
  const onboardingRootRef = useRef(null);
  const lastOpenedEventsTickRef = useRef(0);
  const deferredEventsTickRef = useRef(0);
  const {
    overview,
    timeStatus,
    periodStatus,
    pendingEvents,
    loading,
    syncing,
    error,
    advancePeriod,
    fetchPeriodStatus,
    reload,
    claimSalary,
    contributeToSafetyFund,
    withdrawFromSafetyFund,
    treatSelf,
    getNeedsGuide,
    refreshOverview,
    refreshGameState,
    refreshPendingEvent,
    eventsPromptTick,
    periodCloseSummary,
    dismissPeriodClose,
    gameSessionStatus,
    defeatInfo,
  } = useGame();

  const closeEventsOverlay = useCallback(() => setEventsOpen(false), []);

  const inOnboarding =
    overview && (overview.onboarding_state === 'draft' || overview.onboarding_state === 'started');
  const eventsUnlocked = !inOnboarding;
  const periodCloseForUi = lastPeriodClose;
  const showPeriodCloseTail =
    !inOnboarding && activeTab === 'dashboard' && periodCloseForUi && !periodCloseOpen;

  // Итоги периода — до эффектов событий: в одном коммите сначала выставляем periodCloseOpen.
  useEffect(() => {
    if (!periodCloseSummary || !inOnboarding) return;
    setQueuedPeriodClose(periodCloseSummary);
    dismissPeriodClose();
  }, [periodCloseSummary, inOnboarding, dismissPeriodClose]);

  useEffect(() => {
    if (!periodCloseSummary || inOnboarding) return;
    const payload = periodCloseSummary;
    setLastPeriodClose(payload);
    setQueuedPeriodClose(null);
    setPeriodCloseOpen(shouldAutoOpenPeriodClose(payload, PERIOD_CLOSE_AUTO_MAX));
    dismissPeriodClose();
  }, [periodCloseSummary, inOnboarding, dismissPeriodClose]);

  useEffect(() => {
    if (!queuedPeriodClose || inOnboarding) return;
    setLastPeriodClose(queuedPeriodClose);
    setQueuedPeriodClose(null);
    setPeriodCloseOpen(shouldAutoOpenPeriodClose(queuedPeriodClose, PERIOD_CLOSE_AUTO_MAX));
  }, [queuedPeriodClose, inOnboarding]);

  useEffect(() => {
    if (!eventsUnlocked || inOnboarding) return;
    if (eventsPromptTick <= lastOpenedEventsTickRef.current) return;
    if ((pendingEvents?.length ?? 0) > 0) {
      // Пока открыт лист итогов — откладываем автопоказ событий (хвостик не блокирует).
      if (periodCloseOpen) {
        deferredEventsTickRef.current = eventsPromptTick;
        return;
      }

      lastOpenedEventsTickRef.current = eventsPromptTick;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- открытие только при новом bumpEvents
      setEventsOpen(true);
    }
  }, [eventsPromptTick, pendingEvents?.length, eventsUnlocked, inOnboarding, periodCloseOpen]);

  useEffect(() => {
    if (!eventsUnlocked || inOnboarding) {
      setEventsOpen(false);
    }
  }, [eventsUnlocked, inOnboarding]);

  useEffect(() => {
    if (!eventsUnlocked || inOnboarding) return;
    if ((pendingEvents?.length ?? 0) <= 0) return;
    if (periodCloseOpen) return;

    const deferredTick = deferredEventsTickRef.current;
    if (deferredTick > lastOpenedEventsTickRef.current && deferredTick <= eventsPromptTick) {
      deferredEventsTickRef.current = 0;
      lastOpenedEventsTickRef.current = deferredTick;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- однократный автопоказ после итогов
      setEventsOpen(true);
    }
  }, [eventsPromptTick, pendingEvents?.length, eventsUnlocked, inOnboarding, periodCloseOpen]);

  useEffect(() => {
    if (onboardingUi.visible && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [onboardingUi.visible, activeTab]);

  useEffect(() => {
    if (!inOnboarding) {
      setOnboardingUi({ visible: false, lockTabs: false });
    }
  }, [inOnboarding]);

  const handleClosePeriodClose = useCallback(() => {
    setPeriodCloseOpen(false);
  }, []);

  const handleRequestNextPeriod = async () => {
    if (!inOnboarding) {
      try {
        const st = await fetchPeriodStatus();
        if (st && st.salary_claimed === false && st.can_claim_salary) {
          setSalaryWarnOpen(true);
          return;
        }
      } catch {
        // если статус не получили — идём дальше без модалки
      }
    }
    try {
      await advancePeriod();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось закрыть месяц', 'error');
    }
  };

  const confirmAdvanceWithSalaryLoss = async () => {
    setSalaryWarnOpen(false);
    try {
      await advancePeriod();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось закрыть месяц', 'error');
    }
  };

  const moodClass = gamePageMoodClass(timeStatus);

  if (loading) {
    return (
      <GameScreenLayout moodClass={moodClass}>
        <MqxShell
          header={
            <MqxTabHero
              sectionLabel="Игра"
              rightPill="Загрузка"
              title="Подключаемся"
              subtitle="Период, баланс и события появятся в привычной рамке."
            />
          }
        >
          <div className="mqx-card" style={{ padding: 14 }}>
            <MqxStateSkeleton variant="chips" label="Финансы периода" />
            <div style={{ marginTop: 16 }}>
              <MqxStateSkeleton variant="rows" rows={2} label="Цели и действия" />
            </div>
          </div>
        </MqxShell>
      </GameScreenLayout>
    );
  }

  if (error) {
    return (
      <GameScreenLayout moodClass={moodClass}>
        <MqxShell
          header={
            <MqxTabHero
              sectionLabel="Игра"
              rightPill="Ошибка"
              title="Не удалось загрузить"
              subtitle="Проверьте сеть, VPN и что сессия ещё действительна."
            />
          }
        >
          <div className="mq-stack mq-stack--tight mq-stack-animate">
            <div className="mqx-card mq-enter-item">
              <MqxStateError
                title="Не удалось загрузить"
                message={formatApiErrorDetail(error, 'Проверьте сеть и попробуйте снова')}
                retryLabel="Повторить загрузку"
                onRetry={() => reload()}
              />
            </div>
          </div>
        </MqxShell>
      </GameScreenLayout>
    );
  }

  if (!overview || !timeStatus) {
    return (
      <GameScreenLayout moodClass={moodClass}>
        <MqxShell
          header={
            <MqxTabHero
              sectionLabel="Игра"
              rightPill="Нет данных"
              title="Профиль недоступен"
              subtitle="Сервер не вернул состояние игры. Обновление иногда помогает."
            />
          }
        >
          <div className="mq-stack mq-stack--tight mq-stack-animate">
            <div className="mqx-card mq-enter-item">
              <div className="mqx-card__title">Пустой ответ</div>
              <p className="mqx-card__sub">Активный профиль сейчас не прочитать. Попробуйте ещё раз.</p>
              <div className="mq-actions-stack" style={{ marginTop: 16 }}>
                <Button stretched mode="filled" onClick={() => reload()}>
                  Обновить
                </Button>
              </div>
            </div>
          </div>
        </MqxShell>
      </GameScreenLayout>
    );
  }

  return (
    <GameScreenLayout
      moodClass={moodClass}
      tabNav={(
        <GameScreenTabNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lockTabs={onboardingUi.lockTabs}
        />
      )}
      overlays={(
        <>
          <MqxSalaryWarnModal
            open={salaryWarnOpen && !inOnboarding}
            salaryAmount={Number(periodStatus?.salary_amount) || 0}
            onClose={() => setSalaryWarnOpen(false)}
            onConfirmSkip={confirmAdvanceWithSalaryLoss}
          />

          <MqxGameOverModal
            open={gameSessionStatus === 'defeated'}
            defeatReason={defeatInfo?.reason}
            defeatPeriodIndex={defeatInfo?.periodIndex}
            onNewGame={onNewGame}
            onMenu={onLoadGame}
          />

          <MqxPeriodCloseRitual
            summary={periodCloseForUi}
            open={Boolean(periodCloseForUi && periodCloseOpen && !inOnboarding)}
            onClose={handleClosePeriodClose}
          />
          {showPeriodCloseTail ? (
            <MqxPeriodCloseTail
              summary={periodCloseForUi}
              onOpen={() => setPeriodCloseOpen(true)}
            />
          ) : null}

          <EventCarouselOverlay
            open={eventsOpen}
            onClose={closeEventsOverlay}
            events={pendingEvents}
            onResolved={async (eventId, choiceId) => {
              const res = await API.chooseEvent(eventId, choiceId);
              const needsBefore = res?.needs_before;
              const needsAfter = res?.needs_after;
              const claim = res?.insurance_claim;
              if (claim?.applied && Number(claim.payout_amount) > 0) {
                const title = claim.policy_title ? `${claim.policy_title}: ` : '';
                showNotification(
                  `${title}выплата +${Math.round(Number(claim.payout_amount))} ₽`,
                  'success',
                );
              } else if (needsAfter && typeof needsAfter === 'object') {
                const labels = {
                  comfort: 'Комфорт',
                  status: 'Статус',
                  social: 'Связи',
                  health: 'Здоровье',
                };
                const deltas = [];
                if (needsBefore && typeof needsBefore === 'object') {
                  for (const key of Object.keys(labels)) {
                    const before = Number(needsBefore?.[key]);
                    const after = Number(needsAfter?.[key]);
                    if (!Number.isFinite(before) || !Number.isFinite(after)) continue;
                    const d = Math.round((after - before) * 10) / 10;
                    if (Math.abs(d) < 1e-6) continue;
                    deltas.push(`${labels[key]} ${d > 0 ? `+${d}` : String(d)}`);
                  }
                }
                showNotification(
                  deltas.length ? `Потребности: ${deltas.join(', ')}` : 'Потребности изменились',
                  'success',
                );
              } else {
                showNotification('Решение применено', 'success');
              }
              await refreshGameState();
            }}
          />
        </>
      )}
    >
      <div className="mqx-screen mqx-screen--game" aria-busy={syncing || undefined}>
        <div className="mqx-frame">
          <div className="mq-stack mq-stack-animate mq-stack--tight mq-stack--game-tab">
            <div key={activeTab} className="mq-enter-item mq-enter-item--fill">
              {activeTab === 'dashboard' && (
                <div ref={onboardingRootRef} className="mqx-onboarding-anchor-root">
                  <DashboardPremium
                    overview={overview}
                    timeStatus={timeStatus}
                    periodStatus={periodStatus}
                    eventsUnlocked={eventsUnlocked}
                    pendingEventsCount={eventsUnlocked ? (pendingEvents?.length ?? 0) : 0}
                    onOpenEvents={eventsUnlocked ? () => setEventsOpen(true) : undefined}
                    onNextPeriod={handleRequestNextPeriod}
                    closeMonthDisabled={syncing}
                    claimSalary={claimSalary}
                    contributeToSafetyFund={contributeToSafetyFund}
                    withdrawFromSafetyFund={withdrawFromSafetyFund}
                    treatSelf={treatSelf}
                    getNeedsGuide={getNeedsGuide}
                    onGoFinance={() => {
                      setCapitalFlowsOpen(null);
                      setActiveTab('finance');
                    }}
                    onGoCapitalFlows={(section) => {
                      setCapitalFlowsOpen(section);
                      setActiveTab('finance');
                    }}
                  />
                </div>
              )}

              {activeTab === 'finance' && (
                <FinancePremium
                  overview={overview}
                  refreshOverview={refreshOverview}
                  openFlowsSection={capitalFlowsOpen}
                  onFlowsSectionOpened={() => setCapitalFlowsOpen(null)}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsPremium overview={overview} />
              )}

              {activeTab === 'menu' && (
                <MenuPremium
                  onLogout={onLogout}
                  onNewGame={onNewGame}
                  onLoadGame={onLoadGame}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <GameOnboardingLayer
        overview={overview}
        periodStatus={periodStatus}
        rootRef={onboardingRootRef}
        refreshOverview={refreshOverview}
        onOverlayStateChange={setOnboardingUi}
      />
    </GameScreenLayout>
  );
}
