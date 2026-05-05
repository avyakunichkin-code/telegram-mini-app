import { useState } from 'react';
import { Spinner, Button } from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { GameHUD } from './GameHUD';
import { DashboardSection } from './DashboardSection';
import { FinanceSection } from './FinanceSection';
import { MenuSection } from './MenuSection';
import { showNotification } from './notifications';

export function GameScreen({ onLogout, onNewGame, onLoadGame }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    overview,
    timeStatus,
    loading,
    error,
    setPlay,
    setPause,
    nextPeriod,
    claimSalary,
    contributeToSafetyFund,
    withdrawFromSafetyFund,
    refreshOverview,
  } = useGame();

  if (loading) return <Spinner />;
  if (error) return <div>Ошибка: {error}</div>;
  if (!overview || !timeStatus) return <div>Нет данных</div>;

  return (
    <div style={{ padding: '1rem', paddingBottom: '80px' }}>
      <GameHUD
        timeStatus={timeStatus}
        setPlay={setPlay}
        setPause={setPause}
        nextPeriod={nextPeriod}
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

      {/* Фиксированное нижнее меню */}
      <div className="bottom-nav">
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