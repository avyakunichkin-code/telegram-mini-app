import { useCallback, useState } from 'react';
import { Spinner, Button, Modal, Cell, Section } from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { DashboardPremium } from './DashboardPremium';
import { FinancePremium } from './FinancePremium';
import { AnalyticsPremium } from './AnalyticsPremium';
import { MenuPremium } from './MenuPremium';
import { BottomGameNav } from './BottomGameNav';
import { showNotification } from './notifications';
import { API } from '../api';
import { EventCarouselOverlay } from './EventDeck';

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
              <div className="mq-screen-intro">Типичные причины: нет сети, недоступен API или истекла сессия.</div>
              <Cell multiline subtitle={error}>
                <div className="mq-modal-body">Проверьте соединение и откройте приложение заново при необходимости.</div>
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
              <div className="mq-screen-intro">Не удалось прочитать активный профиль. Сеть или сервер могли ответить с ошибкой.</div>
              <Cell multiline subtitle="Попробуйте ещё раз после проверки соединения">
                <div className="mq-modal-body">Профиль игры сейчас недоступен.</div>
              </Cell>
              <Cell>
                <Button stretched mode="filled" onClick={() => reload()}>Обновить</Button>
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
          <div className="mq-screen-intro">Проверка перед сменой месяца в игре.</div>
          <Cell multiline>
            <div className="mq-modal-lead">Зарплата за этот период ещё не получена</div>
            <p className="mq-modal-body">
              Если перейти дальше, начисление за текущий месяц <strong>сгорит</strong>, как если не нажали «Получить зарплату».
            </p>
          </Cell>
          <Cell>
            <div className="mq-modal-actions">
              <Button mode="filled" stretched onClick={confirmAdvanceWithSalaryLoss}>
                Перейти без зарплаты
              </Button>
              <Button mode="outline" stretched onClick={() => setSalaryWarnOpen(false)}>
                Отмена
              </Button>
            </div>
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
