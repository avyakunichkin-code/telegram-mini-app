import { useEffect, useState } from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';  // импортируем AppRoot
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { StartMenuScreen } from './components/StartMenuScreen';
import { NewProfileKindScreen } from './screens/pre-game/NewProfileKindScreen';
import { GameTemplatePickScreen } from './screens/pre-game/GameTemplatePickScreen';
import { BaseParamsScreen } from './components/BaseParamsScreen';
import { GameScreen } from './components/GameScreen';
import { ToastHost } from './components/ToastHost';
import { MqCatalogScreen } from './components/mqx/catalog/MqCatalogScreen';
import { AdminWebShell } from './components/admin/AdminWebShell';
import { AdminCatalogListScreen } from './components/admin/AdminCatalogListScreen';
import { AdminCatalogsHub } from './components/admin/AdminCatalogsHub';
import { AdminWatchtowerScreen } from './components/admin/AdminWatchtowerScreen';
import { suggestDefaultProfileName } from './utils/suggestDefaultProfileName';
import { API } from './api';
import { showNotification } from './components/notifications';
import { startGameWithStudentTemplate } from './utils/startGame';

function GameAppFlowShell({ children }) {
  return (
    <div className="app-shell mq-page pg-app-shell">
      <div className="mq-page__decor" aria-hidden />
      {children}
    </div>
  );
}

function GameApp() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('start'); // start | newProfileKind | gameTemplates | planSetup | game
  const [newGameProfileName, setNewGameProfileName] = useState('');
  const [savedProfileCount, setSavedProfileCount] = useState(null);
  const [startingFirstGame, setStartingFirstGame] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    if (screen !== 'newProfileKind') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const rows = await API.getGameProfiles();
        if (!cancelled) {
          setSavedProfileCount(Array.isArray(rows) ? rows.length : 0);
        }
      } catch {
        if (!cancelled) setSavedProfileCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [screen]);

  const handleNewGame = (initialName) => {
    const name =
      typeof initialName === 'string' && initialName.trim()
        ? initialName.trim()
        : suggestDefaultProfileName([]);
    setNewGameProfileName(name);
    setScreen('newProfileKind');
  };

  const handleChooseGameMode = async () => {
    if (savedProfileCount === 0) {
      setStartingFirstGame(true);
      try {
        await startGameWithStudentTemplate(newGameProfileName);
        handleGameStarted();
      } catch (error) {
        showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
      } finally {
        setStartingFirstGame(false);
      }
      return;
    }
    setScreen('gameTemplates');
  };

  const handleChoosePlanMode = (name) => {
    setNewGameProfileName(name);
    setScreen('planSetup');
  };

  const handleBackFromTemplates = () => {
    setScreen('newProfileKind');
  };

  const handleBackFromPlanSetup = () => {
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

  if (startingFirstGame) {
    return (
      <GameAppFlowShell>
        <div className="mqx-card" style={{ margin: 24, padding: 24, textAlign: 'center' }}>
          <Spinner size="m" />
          <p style={{ marginTop: 16 }}>Запускаем первую игру…</p>
        </div>
      </GameAppFlowShell>
    );
  }

  if (screen === 'newProfileKind') {
    return (
      <GameAppFlowShell>
        <NewProfileKindScreen onChooseGame={handleChooseGameMode} onBack={handleBackFromProfileKind} />
      </GameAppFlowShell>
    );
  }

  if (screen === 'gameTemplates') {
    return (
      <GameAppFlowShell>
        <GameTemplatePickScreen
          profileName={newGameProfileName}
          onProfileNameChange={setNewGameProfileName}
          onBack={handleBackFromTemplates}
          onJumpToGame={handleGameStarted}
        />
      </GameAppFlowShell>
    );
  }

  if (screen === 'planSetup') {
    return (
      <GameAppFlowShell>
        <BaseParamsScreen
          profileName={newGameProfileName}
          saveKind="plan"
          onBack={handleBackFromPlanSetup}
          onGameStarted={handleGameStarted}
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
    <AppRoot className="mq-app-fill">
      <AuthProvider>
        <ToastHost />
        <div className="mq-app-fill">
        <HashRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <div className="app-shell mq-page pg-app-shell mq-page--auth">
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
                <div className="app-shell mq-page pg-app-shell mq-page--auth">
                  <div className="mq-page__decor" aria-hidden />
                  <RegisterForm
                    onSwitchToLogin={() => {
                      window.location.href = `${import.meta.env.BASE_URL}#/login`;
                    }}
                  />
                </div>
              }
            />
            {import.meta.env.DEV ? (
              <Route
                path="/dev/mqx"
                element={
                  <div className="app-shell mq-page">
                    <MqCatalogScreen />
                  </div>
                }
              />
            ) : null}
            <Route
              path="/admin/*"
              element={
                <AdminWebShell>
                  <AuthGuard layout="admin">
                    <Routes>
                      <Route index element={<AdminWatchtowerScreen />} />
                      <Route path="catalogs" element={<AdminCatalogsHub />} />
                      <Route path="catalogs/:catalogKey" element={<AdminCatalogListScreen />} />
                    </Routes>
                  </AuthGuard>
                </AdminWebShell>
              }
            />
            <Route path="/" element={
              <AuthGuard>
                <GameApp />
              </AuthGuard>
            } />
          </Routes>
        </HashRouter>
        </div>
      </AuthProvider>
    </AppRoot>
  );
}

export default App;
