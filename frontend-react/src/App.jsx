import { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
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

function GameApp() {
  const navigate = useNavigate();
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
    navigate('/login', { replace: true });
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
      saveKind={difficultyConfig.save_kind}
      templateKey={difficultyConfig.template_key}
      periodDuration={difficultyConfig.period_duration_seconds}
      onBack={() => setScreen('difficulty')}
      onGameStarted={handleGameStarted}
    />;
  }

  if (screen === 'game') {
    return (
      <GameScreen
        onLogout={handleLogout}
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
            <Route
              path="/login"
              element={
                <LoginForm
                  onSwitchToRegister={() => {
                    window.location.href = `${import.meta.env.BASE_URL}#/register`;
                  }}
                />
              }
            />
            <Route
              path="/register"
              element={
                <RegisterForm
                  onSwitchToLogin={() => {
                    window.location.href = `${import.meta.env.BASE_URL}#/login`;
                  }}
                />
              }
            />
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