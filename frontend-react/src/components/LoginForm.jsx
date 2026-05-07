import { useState } from 'react';
import { Button, Input, Cell, Section } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';

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
      window.location.href = '/telegram-mini-app/#/';
    } catch (err) {
      setError('Неверное имя пользователя или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mq-page mq-page--auth" onSubmit={handleSubmit}>
      <div className="mq-page__decor" aria-hidden />
      <div className="mq-auth-inner mq-stack mq-stack-animate mq-stack--tight">
      <div className="mq-enter-item">
      <Section header="Вход">
        <Cell>
          <Input
            header="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </Cell>
        <Cell>
          <Input
            header="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </Cell>
        {error ? (
          <Cell>
            <div className="mq-form-alert">{error}</div>
          </Cell>
        ) : null}
        <Cell>
          <Button mode="filled" type="submit" stretched>Войти</Button>
        </Cell>
        <Cell>
          <Button mode="plain" onClick={onSwitchToRegister}>Зарегистрироваться</Button>
        </Cell>
      </Section>
      </div>
      </div>
    </form>
  );
}