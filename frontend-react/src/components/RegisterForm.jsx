import { useState } from 'react';
import { Button, Input } from '@telegram-apps/telegram-ui';
import { formatApiErrorDetail } from '../api';
import { useAuth } from '../context/AuthContext';
import { deriveUsernameFromEmail } from '../utils/deriveUsernameFromEmail';
import { AuthMonetkaScreen } from './mqx/auth/AuthMonetkaScreen';

function validateRegisterForm({ password, passwordConfirm, email }) {
  const trimmedEmail = email.trim();

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
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    const validationError = validateRegisterForm({
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
        username: deriveUsernameFromEmail(email),
        password,
        password_confirm: passwordConfirm,
        email: email.trim(),
      });
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch (err) {
      setError(
        formatApiErrorDetail(
          err?.detail ?? err?.message,
          'Ошибка регистрации. Возможно, email уже занят.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthMonetkaScreen
      title="Привет, я Монетка!"
      subtitle="Я тоже регистрировалась в первый раз. Теперь не могу оторваться. Регистрируйся! Я подожду"
      titleId="mqx-register-monetka-title"
    >
      <form onSubmit={handleSubmit} className="mqx-auth-monetka__form" noValidate>
        <div className="mqx-form">
          <Input
            id="register-email"
            name="email"
            header="Email"
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
            header="Пароль"
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
            header="Повторите пароль"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="••••••"
            autoComplete="new-password"
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
            title="Создать аккаунт и войти"
          >
            {isSubmitting ? 'Регистрация…' : 'Зарегистрироваться'}
          </Button>
        </div>

        <p className="mqx-auth-monetka__link">
          Уже есть аккаунт?{' '}
          <button type="button" title="Перейти к входу" onClick={onSwitchToLogin}>
            Войти
          </button>
        </p>
      </form>
    </AuthMonetkaScreen>
  );
}
