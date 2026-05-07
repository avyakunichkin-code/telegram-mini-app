import { useCallback, useState } from 'react';
import { Spinner, Button, Modal, Cell, Section } from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { GameHUD } from './GameHUD';
import { DashboardSection } from './DashboardSection';
import { FinanceSection } from './FinanceSection';
import { AnalyticsSection } from './AnalyticsSection';
import { MenuSection } from './MenuSection';
import { BottomGameNav } from './BottomGameNav';
import { showNotification } from './notifications';
import { API } from '../api';
import { EventsTriggerButton, EventCarouselOverlay } from './EventDeck';
import { MqLogo } from './MqLogo';

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
  } = useGame();

  const closeEventsOverlay = useCallback(() => setEventsOpen(false), []);

  const handleRequestNextPeriod = async () => {
    try {
      const st = await fetchPeriodStatus();
      if (st && st.salary_claimed === false && st.can_claim_salary) {
        setSalaryWarnOpen(true);
        return;
      }
    } catch (_) {
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
      <div className="app-shell mq-page mq-page--center" style={{ padding: '16px' }}>
        <div className="mq-page__decor" aria-hidden />
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="app-shell mq-page" style={{ padding: '12px' }}>
        <div className="mq-page__decor" aria-hidden />
        <div className="mq-stack mq-stack-animate mq-stack--tight">
          <div className="mq-enter-item">
            <Section header="Не удалось загрузить игру">
              <Cell multiline subtitle={error}>
                <div>Проверьте сеть и попробуйте ещё раз.</div>
              </Cell>
              <Cell>
                <Button stretched mode="filled" onClick={() => reload()}>
                  Повторить загрузку
                </Button>
              </Cell>
            </Section>
          </div>
        </div>
      </div>
    );
  }
  if (!overview || !timeStatus) {
    return (
      <div className="app-shell mq-page" style={{ padding: '12px' }}>
        <div className="mq-page__decor" aria-hidden />
        <div className="mq-stack mq-stack-animate mq-stack--tight">
          <div className="mq-enter-item">
            <Section header="Нет данных">
              <Cell>Профиль игры недоступен.</Cell>
              <Cell>
                <Button stretched onClick={() => reload()}>Обновить</Button>
              </Cell>
            </Section>
          </div>
        </div>
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
        <Section header="Следующий период">
          <Cell multiline>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Зарплата не получена</div>
            <div style={{ lineHeight: 1.35 }}>
              Если перейти к следующему периоду, зарплата за текущий месяц <strong>сгорит</strong>, как при пропуске рабочего дня без отработки.
            </div>
          </Cell>
          <Cell style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button mode="filled" stretched onClick={confirmAdvanceWithSalaryLoss}>Перейти</Button>
            <Button mode="outline" stretched onClick={() => setSalaryWarnOpen(false)}>Отмена</Button>
          </Cell>
        </Section>
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

      <div className="mq-stack mq-stack-animate mq-stack--tight">
        <div className="mq-enter-item">
          <header className="tma-app-header">
            <MqLogo size={34} />
            <div className="tma-app-header__text">
              <span className="tma-app-header__name">Money Quest</span>
              <span className="tma-app-header__tag">Финансы как игра</span>
            </div>
            <EventsTriggerButton
              count={pendingEvents?.length ?? 0}
              open={eventsOpen}
              onOpen={() => setEventsOpen(true)}
            />
          </header>
        </div>
        <GameHUD
          className="mq-enter-item"
          timeStatus={timeStatus}
          setPlay={setPlay}
          setPause={setPause}
          onRequestNextPeriod={handleRequestNextPeriod}
        />

        <div key={activeTab} className="mq-enter-item">
          {activeTab === 'dashboard' && (
            <DashboardSection
              overview={overview}
              claimSalary={claimSalary}
              contributeToSafetyFund={contributeToSafetyFund}
              withdrawFromSafetyFund={withdrawFromSafetyFund}
              refreshOverview={refreshOverview}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceSection overview={overview} refreshOverview={refreshOverview} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsSection overview={overview} />
          )}

          {activeTab === 'menu' && (
            <MenuSection
              onLogout={onLogout}
              onNewGame={onNewGame}
              onLoadGame={onLoadGame}
            />
          )}
        </div>
      </div>

      <BottomGameNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
