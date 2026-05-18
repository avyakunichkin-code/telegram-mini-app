import { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';  // импортируем AppRoot
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { StartMenuScreen } from './components/StartMenuScreen';
import { NewProfileKindScreen } from './components/new-game/NewProfileKindScreen';
import { GameTemplatePickScreen } from './components/new-game/GameTemplatePickScreen';
import { GameScreen } from './components/GameScreen';
import { ToastHost } from './components/ToastHost';

function GameAppFlowShell({ children }) {
  return (
    <div className="app-shell mq-page" style={{ padding: '12px' }}>
      <div className="mq-page__decor" aria-hidden />
      {children}
    </div>
  );
}

function GameApp() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('start'); // start | newProfileKind | gameTemplates | game
  const [newGameProfileName, setNewGameProfileName] = useState('');
  const { logout } = useAuth();

  const handleNewGame = () => {
    setNewGameProfileName('');
    setScreen('newProfileKind');
  };

  const handleChooseGameMode = (name) => {
    setNewGameProfileName(name);
    setScreen('gameTemplates');
  };

  const handleBackFromTemplates = () => {
    setScreen('newProfileKind');
  };

  const handleBackFromProfileKind = () => setScreen('start');

  const handleLoadGame = () => {
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
    return (
      <GameAppFlowShell>
        <StartMenuScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} onLogout={handleLogout} />
      </GameAppFlowShell>
    );
  }

  if (screen === 'newProfileKind') {
    return (
      <GameAppFlowShell>
        <NewProfileKindScreen
          profileName={newGameProfileName}
          onProfileNameChange={setNewGameProfileName}
          onChooseGame={handleChooseGameMode}
          onBack={handleBackFromProfileKind}
        />
      </GameAppFlowShell>
    );
  }

  if (screen === 'gameTemplates') {
    return (
      <GameAppFlowShell>
        <GameTemplatePickScreen
          profileName={newGameProfileName}
          onBack={handleBackFromTemplates}
          onJumpToGame={handleGameStarted}
        />
      </GameAppFlowShell>
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        onLogout={handleLogout}
        onNewGame={handleNewGame}
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
                <div className="app-shell mq-page mq-page--auth">
                  <div className="mq-page__decor" aria-hidden />
                  <LoginForm
                    onSwitchToRegister={() => {
                      window.location.href = `${import.meta.env.BASE_URL}#/register`;
                    }}
                  />
                </div>
              }
            />
            <Route
              path="/register"
              element={
                <div className="app-shell mq-page mq-page--auth">
                  <div className="mq-page__decor" aria-hidden />
                  <RegisterForm
                    onSwitchToLogin={() => {
                      window.location.href = `${import.meta.env.BASE_URL}#/login`;
                    }}
                  />
                </div>
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
