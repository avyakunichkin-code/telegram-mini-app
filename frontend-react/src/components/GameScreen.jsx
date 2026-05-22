import { useCallback, useEffect, useRef, useState } from 'react';
import { Spinner, Button, Modal } from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { DashboardPremium } from './DashboardPremium';
import { FinancePremium } from './FinancePremium';
import { AnalyticsPremium } from './AnalyticsPremium';
import { MenuPremium } from './MenuPremium';
import { showNotification } from './notifications';
import { API, formatApiErrorDetail } from '../api';
import { EventCarouselOverlay } from './EventDeck';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';
import { GameScreenLayout, GameScreenTabNav } from './GameScreenLayout';
import { MqxPeriodCloseSheet, MqxPeriodCloseTail } from './mqx';
import { PERIOD_CLOSE_AUTO_MAX } from '../constants/periodClose';
import { shouldAutoOpenPeriodClose } from '../utils/periodCloseDisplay';
import { GameOnboardingLayer } from './GameOnboardingLayer';

/** Эмоциональный слой страницы: фон синхронизирован с «время идёт» / «пауза» / загрузка. */
function gamePageMoodClass(timeStatus) {
  if (!timeStatus) return 'mq-page--mood-await';
  return timeStatus.time_state === 'play' ? 'mq-page--mood-playing' : 'mq-page--mood-pause';
}

export function GameScreen({ onLogout, onNewGame, onLoadGame }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [salaryWarnOpen, setSalaryWarnOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [onboardingUi, setOnboardingUi] = useState({ visible: false, lockTabs: false });
  const [queuedPeriodClose, setQueuedPeriodClose] = useState(null);
  const [lastPeriodClose, setLastPeriodClose] = useState(null);
  const [periodCloseOpen, setPeriodCloseOpen] = useState(false);
  const onboardingRootRef = useRef(null);
  const {
    overview,
    timeStatus,
    periodStatus,
    pendingEvents,
    loading,
    error,
    setPlay,
    setPause,
    advancePeriod,
    fetchPeriodStatus,
    reload,
    claimSalary,
    contributeToSafetyFund,
    withdrawFromSafetyFund,
    refreshOverview,
    refreshPendingEvent,
    eventsPromptTick,
    periodCloseSummary,
    dismissPeriodClose,
  } = useGame();

  const closeEventsOverlay = useCallback(() => setEventsOpen(false), []);

  const characterLevel = Math.max(1, Number(overview?.character_level) || 1);
  const eventsUnlocked = characterLevel >= 2;
  const inOnboarding =
    overview && (overview.onboarding_state === 'draft' || overview.onboarding_state === 'started');

  useEffect(() => {
    if (!eventsUnlocked || inOnboarding) return;
    if (eventsPromptTick > 0 && (pendingEvents?.length ?? 0) > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация с событиями бэкенда
      setEventsOpen(true);
    }
  }, [eventsPromptTick, pendingEvents, eventsUnlocked, inOnboarding]);

  useEffect(() => {
    if (!eventsUnlocked || inOnboarding) {
      setEventsOpen(false);
    }
  }, [eventsUnlocked, inOnboarding]);

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

  const periodCloseForUi = lastPeriodClose;
  const showPeriodCloseTail =
    !inOnboarding && activeTab === 'dashboard' && periodCloseForUi && !periodCloseOpen;

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
      showNotification(e?.detail || e?.message || 'Не удалось перейти к следующему периоду', 'error');
    }
  };

  const confirmAdvanceWithSalaryLoss = async () => {
    setSalaryWarnOpen(false);
    try {
      await advancePeriod();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось перейти к следующему периоду', 'error');
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
              subtitle="Таймер, баланс и события появятся в привычной рамке."
            />
          }
        >
          <div className="mqx-card" style={{ display: 'grid', placeItems: 'center', minHeight: 140, padding: 28 }}>
            <Spinner />
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
              <div className="mqx-card__kicker">Сеть или API</div>
              <div className="mqx-card__title">Что-то пошло не так</div>
              <p className="mqx-card__sub">{formatApiErrorDetail(error, 'Не удалось загрузить данные')}</p>
              <div className="mq-actions-stack" style={{ marginTop: 16 }}>
                <Button stretched mode="filled" onClick={() => reload()}>
                  Повторить загрузку
                </Button>
              </div>
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
          <Modal open={salaryWarnOpen} onClose={() => setSalaryWarnOpen(false)} title="Следующий период">
            <div className="mqx-modal" role="document" aria-labelledby="mqx-salary-warn-title">
              <div className="mqx-card">
                <div className="mqx-card__kicker mqx-card__kicker--amber">Период</div>
                <div id="mqx-salary-warn-title" className="mqx-card__title">
                  Следующий период
                </div>
                <p className="mqx-card__sub">Проверка перед сменой месяца в игре.</p>
                <p className="mq-modal-lead" style={{ marginTop: 14 }}>Зарплата за этот период ещё не получена</p>
                <p className="mq-modal-body">
                  Если перейти дальше, начисление за текущий месяц <strong>сгорит</strong>, как если не нажали «Получить зарплату».
                </p>
                <div className="mq-modal-actions" style={{ marginTop: 16 }}>
                  <Button mode="filled" stretched onClick={confirmAdvanceWithSalaryLoss}>
                    Перейти без зарплаты
                  </Button>
                  <Button mode="outline" stretched onClick={() => setSalaryWarnOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </Modal>

          <MqxPeriodCloseSheet
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
              const claim = res?.insurance_claim;
              const xpg = Number(res?.xp_gained) || 0;
              const lv = res?.level_up ? res?.new_level : null;
              if (claim?.applied && Number(claim.payout_amount) > 0) {
                const title = claim.policy_title ? `${claim.policy_title}: ` : '';
                showNotification(
                  `${title}выплата +${Math.round(Number(claim.payout_amount))} ₽`,
                  'success',
                );
              } else if (xpg > 0) {
                showNotification(lv ? `+${xpg} XP · уровень ${lv}` : `+${xpg} XP`, 'success');
              } else {
                showNotification('Решение применено', 'success');
              }
              await refreshOverview();
              await refreshPendingEvent();
            }}
          />
        </>
      )}
    >
      <div className="mqx-screen mqx-screen--game">
        <div className="mqx-frame">
          <div className="mq-stack mq-stack-animate mq-stack--tight mq-stack--game-tab">
            <div key={activeTab} className="mq-enter-item mq-enter-item--fill">
              {activeTab === 'dashboard' && (
                <div ref={onboardingRootRef} className="mqx-onboarding-anchor-root">
                  <DashboardPremium
                    overview={overview}
                    timeStatus={timeStatus}
                    eventsUnlocked={eventsUnlocked}
                    pendingEventsCount={eventsUnlocked ? (pendingEvents?.length ?? 0) : 0}
                    onOpenEvents={eventsUnlocked ? () => setEventsOpen(true) : undefined}
                    setPlay={setPlay}
                    setPause={setPause}
                    onNextPeriod={handleRequestNextPeriod}
                    claimSalary={claimSalary}
                    contributeToSafetyFund={contributeToSafetyFund}
                    withdrawFromSafetyFund={withdrawFromSafetyFund}
                    onGoFinance={() => setActiveTab('finance')}
                  />
                </div>
              )}

              {activeTab === 'finance' && (
                <FinancePremium overview={overview} refreshOverview={refreshOverview} />
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
