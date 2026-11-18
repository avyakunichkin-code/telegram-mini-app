import { lazy, Suspense, useEffect, useState } from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';  // импортируем AppRoot
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { StartAccessScreen, StartProfilesScreen, StartRoleScreen } from './screens/pre-game/StartFlowScreens';
import { MqxStartFlow } from './components/mqx/pregame/MqxStartFlow';
import { roles } from './components/mqx/pregame/startFlowData';
import { GameScreen } from './components/GameScreen';
import { ToastHost } from './components/ToastHost';
import { MqxAnalyticsPreview } from './components/mqx/catalog/MqxAnalyticsPreview';
import { MqxCapitalPreview } from './components/mqx/catalog/MqxCapitalPreview';
import { MqxMenuPreview } from './components/mqx/catalog/MqxMenuPreview';
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

const MqxStartPreview = import.meta.env.DEV
  ? lazy(() => import('./components/mqx/catalog/MqxStartPreview').then(({ MqxStartPreview }) => ({ default: MqxStartPreview })))
  : null;

const MqxDesktopPreview = import.meta.env.DEV
  ? lazy(() => import('./components/mqx/catalog/MqxDesktopPreview').then((module) => ({ default: module.MqxDesktopPreview })))
  : null;

function GameAppFlowShell({ children }) {
  return (
    <div className="app-shell mq-page pg-app-shell">
      <div className="mq-page__decor" aria-hidden />
      {children}
    </div>
  );
}

function GameApp({ newGuest }) {
  const navigate = useNavigate();
  // start | saves | newGame | gameTemplates | intro | game; партия переживает перезагрузку вкладки.
  const [screen, setScreen] = useState(() => newGuest ? 'intro' : readResumeScreen());
  const [newGameProfileName, setNewGameProfileName] = useState('');
  const [introTemplateKey, setIntroTemplateKey] = useState(newGuest ? roles[0].templateKey : null);
  const { user, logout } = useAuth();

  useEffect(() => {
    // Партия уже создана на экране знакомства: перезагрузка ведёт в игру, а не в меню.
    rememberScreen(screen === 'intro' ? 'game' : screen);
  }, [screen]);

  /** Партия создана → знакомство с напарником (★ companions-round B) → первый ход. */
  const openCompanionIntro = (templateKey) => {
    setIntroTemplateKey(templateKey);
    setScreen('intro');
  };

  /**
   * «Новая игра» сразу ведёт к выбору жизни (шага «Игра / План» нет — ADR-013, GO-01).
   * Пустой список сохранений — авто-старт за Студента, как раньше.
   */
  const handleNewGame = async (initialName) => {
    if (user.is_guest) {
      setScreen('start');
      return;
    }
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
        openCompanionIntro('mq_game_basic_v1');
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
    navigate('/', { replace: true });
  };

  if (screen === 'start' || screen === 'saves') {
    return (
      <StartProfilesScreen initiallyShowSaves={screen === 'saves'} onNewGame={handleNewGame} onLoadGame={() => setScreen('game')} onLogout={handleLogout} />
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
      <StartRoleScreen
        profileName={newGameProfileName}
        onBack={() => setScreen('start')}
        onStart={openCompanionIntro}
      />
    );
  }

  if (screen === 'intro') {
    return (
      <MqxStartFlow screen="intro" role={roles.find((role) => role.templateKey === introTemplateKey)} onEnterGame={() => setScreen('game')} />
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        onLogout={handleLogout}
        onNewGame={handleNewGame}
        onLoadGame={() => setScreen('saves')}
        onClaimGuest={user.is_guest ? () => navigate('/register') : undefined}
      />
    );
  }

  return null;
}

function GameEntry() {
  const { user, loading } = useAuth();
  const [newGuest, setNewGuest] = useState(false);
  if (loading) return null;
  if (!user) return <StartAccessScreen screen="welcome" onGuest={(returning) => {
    rememberScreen('start');
    setNewGuest(!returning);
  }} />;
  return <GameApp key={user.id} newGuest={user.is_guest && newGuest} />;
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
            <Route path="/login" element={<StartAccessScreen key="login" screen="login" />} />
            <Route path="/register" element={<StartAccessScreen key="register" screen="register" />} />
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
            {import.meta.env.DEV && <Route path="/dev/mqx/analytics" element={<MqxAnalyticsPreview />} />}
            {import.meta.env.DEV && <Route path="/dev/mqx/capital" element={<MqxCapitalPreview />} />}
            {import.meta.env.DEV && <Route path="/dev/mqx/desktop" element={<Suspense fallback={null}><MqxDesktopPreview /></Suspense>} />}
            {import.meta.env.DEV && <Route path="/dev/mqx/menu" element={<MqxMenuPreview />} />}
            {import.meta.env.DEV && <Route path="/dev/mqx/start" element={<Suspense fallback={null}><MqxStartPreview /></Suspense>} />}
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
            <Route path="/" element={<GameEntry />} />
          </Routes>
        </HashRouter>
        </div>
        </AppBootstrapGate>
      </AuthProvider>
    </AppRoot>
  );
}

export default App;
