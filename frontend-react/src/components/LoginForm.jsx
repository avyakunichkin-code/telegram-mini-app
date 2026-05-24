import { useState } from 'react';
import { Button, Input } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { AuthMonetkaScreen } from './mqx/auth/AuthMonetkaScreen';

export function LoginForm({ onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch {
      setError('Неверный логин или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthMonetkaScreen
      showBrand
      title="Привет, я Монетка!"
      subtitle="Помогу разобраться с финансами. Введи логин и пароль"
      titleId="mqx-login-monetka-title"
    >
      <form onSubmit={handleSubmit} className="mqx-auth-monetka__form" noValidate>
        <div className="mqx-form">
          <Input
            id="login-username"
            name="username"
            header="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="логин или email"
            autoComplete="username"
            required
          />
          <Input
            id="login-password"
            name="password"
            header="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <div className="mq-form-alert" role="alert" style={{ marginTop: 12 }}>
            {error}
          </div>
        ) : null}

        <div className="mqx-auth-monetka__actions">
          <Button
            mode="filled"
            type="submit"
            stretched
            disabled={isSubmitting}
            title="Войти в аккаунт"
          >
            {isSubmitting ? 'Входим…' : 'Войти'}
          </Button>
        </div>

        <p className="mqx-auth-monetka__link">
          Нет аккаунта?{' '}
          <button
            type="button"
            title="Перейти к регистрации"
            onClick={onSwitchToRegister}
          >
            Создать
          </button>
        </p>
      </form>
    </AuthMonetkaScreen>
  );
}
