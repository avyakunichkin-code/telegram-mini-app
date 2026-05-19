import { useState } from 'react';
import { Button, Input } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { AuthHeroBackdrop } from './AuthHeroBackdrop';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';

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
      await login(username, password);
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch {
      setError('Неверное имя пользователя или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MqxShell
      header={
        <MqxTabHero
          sectionLabel="Аккаунт"
          rightPill="Вход"
          title="Money Quest"
          subtitle="Латинские логин и пароль, как при регистрации."
        />
      }
      contentClassName="mqx-auth mqx-auth--lottie-bg"
    >
      <AuthHeroBackdrop />
      <div className="mq-auth-foreground">
        <form
          onSubmit={handleSubmit}
          className="mq-stack mq-stack--tight"
          aria-labelledby="mqx-login-form-title"
          noValidate
        >
          <div className="mqx-card mq-enter-item mq-stack-animate">
            <div className="mqx-card__kicker mqx-card__kicker--violet">Безопасность</div>
            <h2 id="mqx-login-form-title" className="mqx-card__title">
              Войти в игру
            </h2>
            <p className="mqx-card__sub">Тот же язык интерфейса, что на главном экране: коротко и по делу.</p>

            <div className="mqx-form" style={{ marginTop: 14 }}>
              <Input
                id="login-username"
                name="username"
                header="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
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

            <div className="mq-actions-stack" style={{ marginTop: 16 }}>
              <Button
                mode="filled"
                type="submit"
                stretched
                disabled={isSubmitting}
                title="Войти в аккаунт"
              >
                {isSubmitting ? 'Входим…' : 'Войти'}
              </Button>
              <Button
                mode="outline"
                type="button"
                stretched
                title="Перейти к регистрации нового аккаунта"
                onClick={onSwitchToRegister}
              >
                Нет аккаунта? Зарегистрироваться
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MqxShell>
  );
}
