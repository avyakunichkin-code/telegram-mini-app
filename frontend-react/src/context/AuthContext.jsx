import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API, setAuthToken } from '../api';
import { isRemoteProdApi } from '../api/client';
import { wakeRemoteApi } from '../api/health';
import { markApiWarmedThisSession, shouldShowApiColdStart } from '../utils/apiWarmupSession';

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
      const cold = remote && shouldShowApiColdStart();

      if (cold) {
        setBootPhase('cold_start');
      }

      if (remote && cold) {
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

      if (!cold && !cancelled) {
        setBootPhase('session');
      }

      setAuthToken(token);
      try {
        const userData = await API.getMe();
        if (cancelled) return;
        setUser(userData);
        markApiWarmedThisSession();
      } catch {
        if (!cancelled) logout();
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
    markApiWarmedThisSession();
    return data;
  };

  const register = async (userData) => {
    const data = await API.register(userData);
    setAuthToken(data.access_token);
    setUser({ id: data.user_id, username: data.username });
    markApiWarmedThisSession();
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, bootPhase, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
