import { useEffect, useState } from 'react';
import { Spinner, Button, Modal, Cell, Section } from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { GameHUD } from './GameHUD';
import { DashboardSection } from './DashboardSection';
import { FinanceSection } from './FinanceSection';
import { MenuSection } from './MenuSection';
import { showNotification } from './notifications';
import { API } from '../api';
import { EventModal } from './EventModal';

export function GameScreen({ onLogout, onNewGame, onLoadGame }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [eventOpen, setEventOpen] = useState(false);
  const [salaryWarnOpen, setSalaryWarnOpen] = useState(false);
  const {
    overview,
    timeStatus,
    pendingEvent,
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

  useEffect(() => {
    if (pendingEvent) setEventOpen(true);
  }, [pendingEvent]);

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

  if (loading) return <Spinner />;
  if (error) {
    return (
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
    );
  }
  if (!overview || !timeStatus) {
    return (
      <Section header="Нет данных">
        <Cell>Профиль игры недоступен.</Cell>
        <Cell>
          <Button stretched onClick={() => reload()}>Обновить</Button>
        </Cell>
      </Section>
    );
  }

  return (
    <div className="app-shell" style={{ padding: '12px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
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

      <EventModal
        open={eventOpen && !!pendingEvent}
        event={pendingEvent}
        onClose={() => setEventOpen(false)}
        onChoose={async (choiceId) => {
          await API.chooseEvent(pendingEvent.id, choiceId);
          await refreshOverview();
          await refreshPendingEvent();
        }}
      />

      <GameHUD
        timeStatus={timeStatus}
        setPlay={setPlay}
        setPause={setPause}
        onRequestNextPeriod={handleRequestNextPeriod}
      />

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

      {activeTab === 'menu' && (
        <MenuSection
          onLogout={onLogout}
          onNewGame={onNewGame}
          onLoadGame={onLoadGame}
        />
      )}

      <div className="bottom-nav" style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <Button
          mode={activeTab === 'dashboard' ? 'filled' : 'outline'}
          onClick={() => setActiveTab('dashboard')}
        >
          Главная
        </Button>
        <Button
          mode={activeTab === 'finance' ? 'filled' : 'outline'}
          onClick={() => setActiveTab('finance')}
        >
          Финансы
        </Button>
        <Button
          mode={activeTab === 'menu' ? 'filled' : 'outline'}
          onClick={() => setActiveTab('menu')}
        >
          Меню
        </Button>
      </div>
    </div>
  );
}
