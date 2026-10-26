import { useEffect, useState } from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';  // импортируем AppRoot
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { StartMenuScreen } from './components/StartMenuScreen';
import { GameTemplatePickScreen } from './screens/pre-game/GameTemplatePickScreen';
import { GameScreen } from './components/GameScreen';
import { ToastHost } from './components/ToastHost';
import { MqCatalogScreen } from './components/mqx/catalog/MqCatalogScreen';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminWebShell } from './components/admin/AdminWebShell';
import { AdminCatalogCreateScreen } from './components/admin/AdminCatalogCreateScreen';
import { AdminCatalogEditorScreen } from './components/admin/AdminCatalogEditorScreen';
import { AdminCatalogListScreen } from './components/admin/AdminCatalogListScreen';
import { AdminCatalogsHub } from './components/admin/AdminCatalogsHub';
import { AdminProfilesScreen } from './components/admin/AdminProfilesScreen';
import { AdminUsersScreen } from './components/admin/AdminUsersScreen';
import { AdminWatchtowerScreen } from './components/admin/AdminWatchtowerScreen';
import { suggestDefaultProfileName } from './utils/suggestDefaultProfileName';
import { API } from './api';
import { showNotification } from './components/notifications';
import { startGameWithStudentTemplate } from './utils/startGame';
import { AppBootstrapGate } from './components/AppBootstrapGate';
import { readResumeScreen, rememberScreen } from './utils/gameScreenSession';

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
  // start | newGame | gameTemplates | game; партия переживает перезагрузку вкладки.
  const [screen, setScreen] = useState(readResumeScreen);
  const [newGameProfileName, setNewGameProfileName] = useState('');
  const { logout } = useAuth();

  useEffect(() => {
    rememberScreen(screen);
  }, [screen]);

  /**
   * «Новая игра» сразу ведёт к выбору жизни (шага «Игра / План» нет — ADR-013, GO-01).
   * Пустой список сохранений — авто-старт за Студента, как раньше.
   */
  const handleNewGame = async (initialName) => {
    setScreen('newGame');
    let rows;
    try {
      rows = await API.getGameProfiles();
    } catch {
      rows = null;
    }
    const list = Array.isArray(rows) ? rows : [];
    const name =
      typeof initialName === 'string' && initialName.trim()
        ? initialName.trim()
        : suggestDefaultProfileName(list);
    setNewGameProfileName(name);
    if (Array.isArray(rows) && rows.length === 0) {
      try {
        await startGameWithStudentTemplate(name);
        setScreen('game');
      } catch (error) {
        showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
        setScreen('start');
      }
      return;
    }
    setScreen('gameTemplates');
  };

  const handleLogout = () => {
    rememberScreen('start');
    logout();
    navigate('/login', { replace: true });
  };

  if (screen === 'start') {
    return (
      <GameAppFlowShell>
        <StartMenuScreen onNewGame={handleNewGame} onLoadGame={() => setScreen('game')} onLogout={handleLogout} />
      </GameAppFlowShell>
    );
  }

  if (screen === 'newGame') {
    return (
      <GameAppFlowShell>
        <div className="mqx-pg">
          <div className="mqx-pg-state" role="status">
            <Spinner size="m" />
            <span>Готовим новую партию…</span>
          </div>
        </div>
      </GameAppFlowShell>
    );
  }

  if (screen === 'gameTemplates') {
    return (
      <GameAppFlowShell>
        <GameTemplatePickScreen
          profileName={newGameProfileName}
          onBack={() => setScreen('start')}
          onJumpToGame={() => setScreen('game')}
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
        <AppBootstrapGate>
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
                      <Route element={<AdminLayout />}>
                        <Route index element={<AdminWatchtowerScreen />} />
                        <Route path="users" element={<AdminUsersScreen />} />
                        <Route path="profiles" element={<AdminProfilesScreen />} />
                        <Route path="catalogs" element={<AdminCatalogsHub />} />
                        <Route path="catalogs/:catalogKey/new" element={<AdminCatalogCreateScreen />} />
                        <Route path="catalogs/:catalogKey" element={<AdminCatalogListScreen />} />
                        <Route
                          path="catalogs/:catalogKey/edit/:rowId"
                          element={<AdminCatalogEditorScreen />}
                        />
                      </Route>
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
        </AppBootstrapGate>
      </AuthProvider>
    </AppRoot>
  );
}

export default App;
