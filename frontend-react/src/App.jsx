import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';  // импортируем AppRoot
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { StartMenuScreen } from './components/StartMenuScreen';
import { DifficultyScreen } from './components/DifficultyScreen';
import { BaseParamsScreen } from './components/BaseParamsScreen';
import { GameScreen } from './components/GameScreen';
import { ToastHost } from './components/ToastHost';

import '@telegram-apps/telegram-ui/dist/styles.css';

function GameApp() {
  const [screen, setScreen] = useState('start'); // 'start', 'difficulty', 'baseParams', 'game'
  const [difficultyConfig, setDifficultyConfig] = useState(null);
  const { logout } = useAuth();

  const handleNewGame = () => {
    setScreen('difficulty');
  };

  const handleDifficultyNext = (config) => {
    setDifficultyConfig(config);
    setScreen('baseParams');
  };

  const handleDifficultyBack = () => setScreen('start');

  const handleLoadGame = () => {
    // После загрузки профиля переходим в игру
    setScreen('game');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleGameStarted = () => {
    setScreen('game');
  };

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
    return (
      <GameScreen
        onLogout={() => {
          logout();
          window.location.href = '/login';
        }}
        onNewGame={() => setScreen('difficulty')}
        onLoadGame={() => setScreen('start')}
      />
    );
  }

  return null;
}

function App() {
  return (
    <AppRoot>   {/* <-- обязательно */}
      <AuthProvider>
        <ToastHost />
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginForm onSwitchToRegister={() => window.location.href='/register'} />} />
            <Route path="/register" element={<RegisterForm onSwitchToLogin={() => window.location.href='/login'} />} />
            <Route path="/" element={
              <AuthGuard>
                <GameApp />
              </AuthGuard>
            } />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </AppRoot>
  );
}

export default App;