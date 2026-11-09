import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../api';
import { rememberScreen } from '../../utils/gameScreenSession';
import { MqxGuestWelcome } from '../../components/mqx/pregame/MqxGuestWelcome';

export function GuestWelcomeScreen() {
  const { startGuest, enterGuestGame } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  async function start() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const prepare = async () => {
        await startGuest();
        await API.startGuestGame();
        rememberScreen('game');
        enterGuestGame(await API.getMe());
      };
      // Cookie from the first tab must arrive before another tab resumes identity.
      if (navigator.locks) await navigator.locks.request('tvoy-hod-guest-start', prepare);
      else await prepare();
    } catch {
      setError('Не удалось подключиться. Попробуй ещё раз — твоя история будет сохранена.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return <div className="mqx-guest-page"><MqxGuestWelcome returning={localStorage.getItem('tvoy_hod_guest') === '1'} busy={busy} error={error} onStart={start} onLogin={() => navigate('/login')} /></div>;
}
