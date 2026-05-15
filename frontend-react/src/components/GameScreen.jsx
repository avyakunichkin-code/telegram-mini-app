import { useCallback, useEffect, useState } from 'react';
import { Spinner, Button, Modal } from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { DashboardPremium } from './DashboardPremium';
import { FinancePremium } from './FinancePremium';
import { AnalyticsPremium } from './AnalyticsPremium';
import { MenuPremium } from './MenuPremium';
import { BottomGameNav } from './BottomGameNav';
import { showNotification } from './notifications';
import { API } from '../api';
import { EventCarouselOverlay } from './EventDeck';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';

export function GameScreen({ onLogout, onNewGame, onLoadGame }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [salaryWarnOpen, setSalaryWarnOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const {
    overview,
    timeStatus,
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
  } = useGame();

  const closeEventsOverlay = useCallback(() => setEventsOpen(false), []);

  // Открыть колоду при появлении новых событий (тик из useGame при смене периода).
  useEffect(() => {
    if (eventsPromptTick > 0 && (pendingEvents?.length ?? 0) > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация с событиями бэкенда
      setEventsOpen(true);
    }
  }, [eventsPromptTick, pendingEvents]);

  const handleRequestNextPeriod = async () => {
    try {
      const st = await fetchPeriodStatus();
      if (st && st.salary_claimed === false && st.can_claim_salary) {
        setSalaryWarnOpen(true);
        return;
      }
    } catch {
      // если статус не получили — идём дальше без модалки
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

  if (loading) {
    return (
      <div className="app-shell mq-page mq-page--center" style={{ padding: '16px', paddingBottom: 'calc(var(--tma-tabbar-height) + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mq-page__decor" aria-hidden />
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
      </div>
    );
  }
  if (error) {
    return (
      <div className="app-shell mq-page" style={{ padding: '12px', paddingBottom: 'calc(var(--tma-tabbar-height) + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mq-page__decor" aria-hidden />
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
              <p className="mqx-card__sub">{error}</p>
              <div className="mq-actions-stack" style={{ marginTop: 16 }}>
                <Button stretched mode="filled" onClick={() => reload()}>
                  Повторить загрузку
                </Button>
              </div>
            </div>
          </div>
        </MqxShell>
      </div>
    );
  }
  if (!overview || !timeStatus) {
    return (
      <div className="app-shell mq-page" style={{ padding: '12px', paddingBottom: 'calc(var(--tma-tabbar-height) + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mq-page__decor" aria-hidden />
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
      </div>
    );
  }

  return (
    <div
      className="app-shell mq-page"
      style={{ padding: '12px', paddingBottom: 'calc(var(--tma-tabbar-height) + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mq-page__decor" aria-hidden />

      <Modal open={salaryWarnOpen} onClose={() => setSalaryWarnOpen(false)}>
        <div className="mqx-modal">
          <div className="mqx-card">
            <div className="mqx-card__kicker mqx-card__kicker--amber">Период</div>
            <div className="mqx-card__title">Следующий период</div>
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

      <EventCarouselOverlay
        open={eventsOpen}
        onClose={closeEventsOverlay}
        events={pendingEvents}
        onResolved={async (eventId, choiceId) => {
          await API.chooseEvent(eventId, choiceId);
          showNotification('Решение применено', 'success');
          await refreshOverview();
          await refreshPendingEvent();
        }}
      />

      <div className="mqx-screen">
        <div className="mqx-frame">
          <div className="mq-stack mq-stack-animate mq-stack--tight">
            <div key={activeTab} className="mq-enter-item">
          {activeTab === 'dashboard' && (
            <DashboardPremium
              overview={overview}
              timeStatus={timeStatus}
              pendingEventsCount={pendingEvents?.length ?? 0}
              onOpenEvents={() => setEventsOpen(true)}
              setPlay={setPlay}
              setPause={setPause}
              onNextPeriod={handleRequestNextPeriod}
              claimSalary={claimSalary}
              contributeToSafetyFund={contributeToSafetyFund}
              withdrawFromSafetyFund={withdrawFromSafetyFund}
              onGoFinance={() => setActiveTab('finance')}
            />
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

      <BottomGameNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
