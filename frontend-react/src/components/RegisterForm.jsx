import { useState } from 'react';
import { Button, Input, Cell, Section } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { MqxFrame } from './MqxFrame';

export function RegisterForm({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      await register({ username, password, full_name: fullName, email: email || undefined });
      // После успешной регистрации перенаправляем на главную
      window.location.href = '/telegram-mini-app/#/';
    } catch (err) {
      setError('Ошибка регистрации. Возможно, имя уже занято.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MqxFrame contentClassName="mqx-auth">
      <form onSubmit={handleSubmit}>
        <Section header="Регистрация">
          <div className="mq-screen-intro">Поля со звёздочкой обязательны. Остальное можно заполнить позже в профиле.</div>
          <Cell multiline subtitle="Логин для входа в приложение">
            <Input
              header="Имя пользователя *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Cell>
          <Cell>
            <Input
              header="Пароль *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Cell>
          <Cell multiline subtitle="Как к вам обращаться в интерфейсе (по желанию)">
            <Input
              header="Полное имя"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Cell>
          <Cell multiline subtitle="Для восстановления и рассылок, если подключим">
            <Input
              header="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Cell>
          {error ? (
            <Cell>
              <div className="mq-form-alert">{error}</div>
            </Cell>
          ) : null}
          <Cell>
            <div className="mq-actions-stack">
              <Button mode="filled" type="submit" stretched disabled={isSubmitting}>
                {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
              <Button mode="plain" type="button" stretched onClick={onSwitchToLogin}>
                Уже есть аккаунт — войти
              </Button>
            </div>
          </Cell>
        </Section>
      </form>
    </MqxFrame>
  );
}