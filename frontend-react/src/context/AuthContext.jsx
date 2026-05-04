import { createContext, useContext, useState, useEffect } from 'react';
import { API, setAuthToken } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tg_miniapp_token');
    if (token) {
      setAuthToken(token);
      API.getMe()
        .then(userData => setUser(userData))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await API.login({ username, password });
    setAuthToken(data.access_token);
    const userData = await API.getMe();
    setUser(userData);
    return data;
  };

  const register = async (userData) => {
    const data = await API.register(userData);
    setAuthToken(data.access_token);
    // Не вызываем getMe здесь, доверимся тому, что после логина редирект сам запросит getMe
    // Но чтобы пользователь сразу был в контексте, можно вернуть данные
    setUser({ id: data.user_id, username: data.username });
    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);