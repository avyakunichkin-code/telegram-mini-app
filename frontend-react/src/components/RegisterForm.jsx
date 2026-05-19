import { useState } from 'react';
import { Button, Input } from '@telegram-apps/telegram-ui';
import { formatApiErrorDetail } from '../api';
import { useAuth } from '../context/AuthContext';
import { AuthHeroBackdrop } from './AuthHeroBackdrop';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';

function validateRegisterForm({ username, password, passwordConfirm, email }) {
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();

  if (!trimmedUsername) {
    return 'Введите имя пользователя';
  }
  if (password.length < 6) {
    return 'Пароль — не короче 6 символов';
  }
  if (password !== passwordConfirm) {
    return 'Пароли не совпадают';
  }
  if (!trimmedEmail) {
    return 'Укажите email';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Введите корректный email';
  }
  return null;
}

export function RegisterForm({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    const validationError = validateRegisterForm({
      username,
      password,
      passwordConfirm,
      email,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim(),
        password,
        password_confirm: passwordConfirm,
        full_name: fullName.trim() || undefined,
        email: email.trim(),
      });
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch (err) {
      setError(
        formatApiErrorDetail(
          err?.detail ?? err?.message,
          'Ошибка регистрации. Возможно, имя или email уже заняты.',
        ),
      );
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
          subtitle="Логин, email и пароль — обязательны. Повторите пароль для проверки."
        />
      }
      contentClassName="mqx-auth mqx-auth--lottie-bg"
    >
      <AuthHeroBackdrop />
      <div className="mq-auth-foreground">
        <form
          onSubmit={handleSubmit}
          className="mq-stack mq-stack--tight"
          aria-labelledby="mqx-register-form-title"
          noValidate
        >
          <div className="mqx-card mq-enter-item mq-stack-animate">
            <div className="mqx-card__kicker mqx-card__kicker--violet">Профиль</div>
            <h2 id="mqx-register-form-title" className="mqx-card__title">
              Создать аккаунт
            </h2>
            <p className="mqx-card__sub">Дальше вы попадёте в те же экраны, что и на демо-стартовом потоке.</p>

            <div className="mqx-form" style={{ marginTop: 14 }}>
              <Input
                id="register-username"
                name="username"
                header="Имя пользователя *"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <Input
                id="register-email"
                name="email"
                header="Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
              <Input
                id="register-password"
                name="password"
                header="Пароль *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="new-password"
                required
                minLength={6}
                aria-describedby="register-password-hint"
              />
              <p id="register-password-hint" className="mqx-field-inline-hint">
                Не короче 6 символов
              </p>
              <Input
                id="register-password-confirm"
                name="password_confirm"
                header="Повторите пароль *"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••"
                autoComplete="new-password"
                required
              />
              <div className="mqx-form-field-hint-wrap">
                <Input
                  id="register-full-name"
                  name="full_name"
                  header="Полное имя"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  aria-describedby="register-full-name-hint"
                />
                <p id="register-full-name-hint" className="mqx-field-inline-hint">
                  Как к вам обращаться в интерфейсе (по желанию)
                </p>
              </div>
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
                title="Создать аккаунт и войти"
              >
                {isSubmitting ? 'Регистрация…' : 'Зарегистрироваться'}
              </Button>
              <Button
                mode="outline"
                type="button"
                stretched
                title="Перейти к входу в существующий аккаунт"
                onClick={onSwitchToLogin}
              >
                Уже есть аккаунт — войти
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MqxShell>
  );
}
