import { useState } from 'react';
import { Button, Input } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';
import { LazyFintechTgsSticker } from './LazyFintechTgsSticker';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';

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
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch {
      setError('Ошибка регистрации. Возможно, имя уже занято.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MqxShell
      header={
        <MqxTabHero
          sectionLabel="Аккаунт"
          rightPill="Регистрация"
          title="Новый игрок"
          subtitle="Обязательны логин и пароль со звёздочкой. Остальное — позже."
        />
      }
      contentClassName="mqx-auth"
    >
      <form onSubmit={handleSubmit} className="mq-stack mq-stack--tight">
        <div className="mq-auth-tgs-row">
          <LazyFintechTgsSticker />
        </div>
        <div className="mqx-card mq-enter-item mq-stack-animate">
          <div className="mqx-card__kicker mqx-card__kicker--violet">Профиль</div>
          <div className="mqx-card__title">Создать аккаунт</div>
          <p className="mqx-card__sub">Дальше вы попадёте в те же экраны, что и на демо-стартовом потоке.</p>

          <div className="mqx-form" style={{ marginTop: 14 }}>
            <Input
              header="Имя пользователя *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <Input
              header="Пароль *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <div className="mqx-form-field-hint-wrap">
              <Input
                header="Полное имя"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
              <p className="mqx-field-inline-hint">Как к вам обращаться в интерфейсе (по желанию)</p>
            </div>
            <div className="mqx-form-field-hint-wrap">
              <Input
                header="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <p className="mqx-field-inline-hint">Для восстановления и рассылок, если подключим</p>
            </div>
          </div>

          {error ? <div className="mq-form-alert" style={{ marginTop: 12 }}>{error}</div> : null}

          <div className="mq-actions-stack" style={{ marginTop: 16 }}>
            <Button mode="filled" type="submit" stretched disabled={isSubmitting}>
              {isSubmitting ? 'Регистрация…' : 'Зарегистрироваться'}
            </Button>
            <Button mode="outline" type="button" stretched onClick={onSwitchToLogin}>
              Уже есть аккаунт — войти
            </Button>
          </div>
        </div>
      </form>
    </MqxShell>
  );
}
