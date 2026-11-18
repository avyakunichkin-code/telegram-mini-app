import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { MqxStartFlow } from '../../components/mqx/pregame/MqxStartFlow';
import { roles } from '../../components/mqx/pregame/startFlowData';
import { setPwaUpdateSafeZone } from '../../utils/pwaUpdate';
import { markPageColdUiComplete } from '../../utils/apiWarmupSession';
import { suggestDefaultProfileName } from '../../utils/suggestDefaultProfileName';
import { rememberScreen } from '../../utils/gameScreenSession';

export function StartAccessScreen({ screen, onGuest }) {
  const navigate = useNavigate();
  const { user, login, register, startGuest, acceptGuest } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const move = (target) => navigate('/' + target);
  const back = () => navigate('/');

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      const message = screen === 'login' && failure.status === 401
        ? 'Неверная почта или пароль'
        : screen === 'register' && [400, 409].includes(failure.status)
          ? 'Не удалось создать аккаунт. Проверь, не зарегистрирована ли уже эта почта.'
          : 'Не удалось выполнить действие. Попробуй ещё раз.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return <MqxStartFlow key={screen} screen={screen} live busy={busy} error={error}
    move={move} loginLink="/login" onBack={back}
    begin={() => run(async () => {
      const guest = await startGuest();
      onGuest(guest.returning);
      acceptGuest(guest.data);
    })}
    onAuth={(fields) => run(async () => {
      if (screen === 'register') await register(fields);
      else await login(fields.email, fields.password);
      if (screen === 'login' || !user?.is_guest) rememberScreen('start');
      navigate('/', { replace: true });
    })}
  />;
}

export function StartProfilesScreen({ initiallyShowSaves, onNewGame, onLoadGame, onLogout }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState(null);
  const [showSaves, setShowSaves] = useState(initiallyShowSaves);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPwaUpdateSafeZone(true);
    return () => setPwaUpdateSafeZone(false);
  }, []);

  useEffect(() => {
    let active = true;
    API.getGameProfiles().then((rows) => {
      if (active) setProfiles(rows);
    }).catch(() => {
      if (active) setLoadFailed(true);
    }).finally(() => {
      if (active) markPageColdUiComplete();
    });
    return () => { active = false; };
  }, [attempt]);

  const primary = profiles?.find((profile) => profile.is_active) || profiles?.[0];
  const screen = loadFailed ? 'unavailable' : !profiles ? 'loading'
    : !primary ? 'empty' : user.is_guest ? 'returning' : showSaves ? 'saves' : 'saved';

  return <MqxStartFlow screen={screen} error={error} busy={busy}
    profiles={showSaves && !user.is_guest ? profiles || [] : primary ? [primary] : []}
    move={() => setShowSaves(true)}
    onBack={loadFailed ? onLogout : () => setShowSaves(false)}
    onRetry={() => { setLoadFailed(false); setAttempt((value) => value + 1); }}
    onLogout={onLogout}
    onNewGame={() => onNewGame(suggestDefaultProfileName(profiles))}
    onLoadGame={async (profile) => {
      if (busy) return;
      setBusy(true);
      setError('');
      try {
        await API.activateGameProfile(profile.id);
        onLoadGame();
      } catch {
        setError('Не удалось загрузить сохранение. Попробуй ещё раз.');
      } finally {
        setBusy(false);
      }
    }}
  />;
}

export function StartRoleScreen({ profileName, onBack, onStart }) {
  const [catalog, setCatalog] = useState(null);
  const [role, setRole] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    API.listGameTemplates('game').then((templates) => {
      if (!active) return;
      const available = roles.filter((item) => templates.some((template) => template.template_key === item.templateKey));
      setCatalog(available);
      setRole(available[0] || null);
    }).catch(() => {
      if (active) setCatalog([]);
    });
    return () => { active = false; };
  }, [attempt]);

  return <MqxStartFlow screen={!catalog ? 'loading' : role ? 'roles' : 'unavailable'}
    role={role} availableRoles={catalog || []} setRole={setRole} busy={busy}
    error={catalog?.length === 0 ? 'Не удалось загрузить роли' : error}
    onRetry={() => { setCatalog(null); setAttempt((value) => value + 1); }}
    onBack={onBack}
    onStartRole={async ({ templateKey }) => {
      if (busy) return;
      setBusy(true);
      setError('');
      try {
        await API.startNewGame({ profile_name: profileName, save_kind: 'game', template_key: templateKey });
        onStart(templateKey);
      } catch {
        setError('Не удалось начать игру. Попробуй ещё раз.');
      } finally {
        setBusy(false);
      }
    }}
  />;
}
