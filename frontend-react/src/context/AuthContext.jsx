import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API, setAuthToken } from '../api';
import { isRemoteProdApi } from '../api/client';
import { wakeRemoteApi } from '../api/health';
import {
  isPageColdUiActive,
  markApiWarmedThisSession,
  shouldRunApiWake,
} from '../utils/apiWarmupSession';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  /** @type {'cold_start' | 'session' | null} */
  const [bootPhase, setBootPhase] = useState(null);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const remote = isRemoteProdApi();

      if (remote && isPageColdUiActive()) {
        setBootPhase('cold_start');
      }

      if (remote && shouldRunApiWake()) {
        const wake = await wakeRemoteApi();
        if (cancelled) return;
        if (wake.ok) {
          markApiWarmedThisSession();
        }
      }

      const token = localStorage.getItem('tg_miniapp_token');
      if (!token) {
        if (!cancelled) {
          setBootPhase(null);
          setLoading(false);
        }
        return;
      }

      if (!remote && !cancelled) {
        setBootPhase('session');
      }

      setAuthToken(token);
      try {
        const userData = await API.getMe();
        if (cancelled) return;
        setUser(userData);
        markApiWarmedThisSession();
      } catch (error) {
        if (!cancelled && error?.status === 401 && localStorage.getItem('tvoy_hod_guest') === '1') {
          try {
            const data = await API.resumeGuest();
            if (cancelled) return;
            setAuthToken(data.access_token);
            const resumed = await API.getMe();
            if (!cancelled) setUser(resumed);
          } catch {
            if (!cancelled) logout();
          }
        } else if (!cancelled) logout();
      } finally {
        if (!cancelled) {
          setBootPhase(null);
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = async (username, password) => {
    const data = await API.login({ username, password });
    setAuthToken(data.access_token);
    const userData = await API.getMe();
    setUser(userData);
    localStorage.removeItem('tvoy_hod_guest');
    markApiWarmedThisSession();
    return data;
  };

  const startGuest = async () => {
    const data = await API.startGuest();
    setAuthToken(data.access_token);
    localStorage.setItem('tvoy_hod_guest', '1');
    const userData = await API.getMe();
    // Keep the welcome mounted until the party is ready.
    return userData;
  };

  const enterGuestGame = (userData) => {
    markApiWarmedThisSession();
    setUser(userData);
  };

  const register = async (userData) => {
    const data = await (user?.is_guest ? API.claimGuest(userData) : API.register(userData));
    setAuthToken(data.access_token);
    setUser(await API.getMe());
    localStorage.removeItem('tvoy_hod_guest');
    markApiWarmedThisSession();
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, bootPhase, login, register, logout, startGuest, enterGuestGame }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
