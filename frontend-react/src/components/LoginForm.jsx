import { useState } from 'react';
import { Button, Input, Cell, Section } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { MqxFrame } from './MqxFrame';

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
    <MqxFrame contentClassName="mqx-auth">
      <form onSubmit={handleSubmit}>
        <Section header="Вход">
          <div className="mq-screen-intro">Тот же визуальный язык, что в игре: короткие подписи и один основной шаг.</div>
          <Cell multiline subtitle="Как при регистрации, латиницей">
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
            <div className="mq-actions-stack">
              <Button mode="filled" type="submit" stretched>Войти</Button>
              <Button mode="plain" type="button" stretched onClick={onSwitchToRegister}>
                Нет аккаунта? Зарегистрироваться
              </Button>
            </div>
          </Cell>
        </Section>
      </form>
    </MqxFrame>
  );
}