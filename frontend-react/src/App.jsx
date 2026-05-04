import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';  // импортируем AppRoot
import { API } from './api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { StartMenuScreen } from './components/StartMenuScreen';
import { DifficultyScreen } from './components/DifficultyScreen';
import { BaseParamsScreen } from './components/BaseParamsScreen';
import { GameScreen } from './components/GameScreen';

import '@telegram-apps/telegram-ui/dist/styles.css';

function GameApp() {
  const [screen, setScreen] = useState('start'); // 'start', 'difficulty', 'baseParams', 'game'
  const [difficultyConfig, setDifficultyConfig] = useState(null);
  const [newGameState, setNewGameState] = useState({
    profile_name: '',
    mode: 'light',
    period_duration_seconds: 300,
  });
  const { logout } = useAuth();

  const handleNewGame = () => {
    setScreen('difficulty');
  };

  const handleDifficultyNext = (config) => {
    console.log('Config from difficulty:', config); // проверьте, что config.profile_name не пуст
    setDifficultyConfig(config);
    setScreen('baseParams');
  };

  const handleDifficultyBack = () => setScreen('start');

  const handleBaseParamsStart = async (params) => {
      // Объединяем config из DifficultyScreen с параметрами из BaseParamsScreen
      const fullConfig = {
        profile_name: difficultyConfig.profileName,
        mode: difficultyConfig.mode,
        period_duration_seconds: difficultyConfig.periodDuration,
        cash_balance: params.cash_balance,
        monthly_salary: params.monthly_salary,
        assets: params.assets,
        liabilities: params.liabilities,
      };
      const result = await API.startNewGame(fullConfig);
      if (result) {
        setScreen('game');
        // Дополнительно можно сохранить профиль активным, но сервер уже сделал это
      } else {
        alert('Ошибка при старте игры');
      }
    };

  const handleBaseParamsBack = () => setScreen('difficulty');

  const handleLoadGame = () => {
    // После загрузки профиля переходим в игру
    setScreen('game');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleGameStarted = (result) => {
    console.log('Игра создана', result);
    setScreen('game');
  };

  // Здесь будут другие экраны (DifficultyScreen, BaseParamsScreen, GameScreen)
  // пока показываем StartMenuScreen
  if (screen === 'start') {
    return <StartMenuScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} onLogout={handleLogout} />;
  }

  if (screen === 'difficulty') {
    return <DifficultyScreen onNext={handleDifficultyNext} onBack={handleDifficultyBack} />;
  }

  if (screen === 'baseParams') {
    return <BaseParamsScreen
      profileName={difficultyConfig.profile_name}
      mode={difficultyConfig.mode}
      periodDuration={difficultyConfig.period_duration_seconds}
      onBack={() => setScreen('difficulty')}
      onGameStarted={handleGameStarted}
    />;
  }

  if (screen === 'game') {
    return <GameScreen onLogout={handleLogout} />;
  }

  return null;
}

function App() {
  return (
    <AppRoot>   {/* <-- обязательно */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginForm onSwitchToRegister={() => window.location.href='/register'} />} />
            <Route path="/register" element={<RegisterForm onSwitchToLogin={() => window.location.href='/login'} />} />
            <Route path="/" element={
              <AuthGuard>
                <GameApp />
              </AuthGuard>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppRoot>
  );
}

export default App;