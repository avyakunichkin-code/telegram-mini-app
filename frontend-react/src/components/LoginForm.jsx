import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthFormField } from './mqx/auth/AuthFormField';
import { BrandLogo } from './BrandLogo';
import { MqxBoardButton } from './mqx/pregame/MqxBoardButton';
import {
  hasFieldErrors,
  validateLoginFields,
} from '../utils/authFormValidation';

/** Вход ★ BG-2: логотип + спокойная форма, одна главная кнопка. */
export function LoginForm({ onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const runValidation = useCallback(() => {
    const errors = validateLoginFields({ username, password });
    setFieldErrors(errors);
    return errors;
  }, [username, password]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError('');

    const errors = runValidation();
    if (hasFieldErrors(errors)) return;

    setIsSubmitting(true);
    try {
      await login(username.trim().toLowerCase(), password);
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch {
      setSubmitError('Неверная почта или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mqx-pg mqx-pg--auth">
      <h1 className="mqx-bg-sr-only">Вход</h1>
      <BrandLogo variant="full" className="mqx-pg-logo" />
      <form onSubmit={handleSubmit} className="mqx-pg-form" noValidate aria-label="Вход">
        <AuthFormField
          id="login-email"
          name="email"
          label="Почта"
          type="email"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            clearFieldError('username');
          }}
          onBlur={runValidation}
          error={fieldErrors.username}
          placeholder="name@mail.ru"
          autoComplete="email"
          inputMode="email"
          required
        />
        <AuthFormField
          id="login-password"
          name="password"
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          onBlur={runValidation}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
        />

        {submitError ? (
          <p className="mqx-pg-form__alert" role="alert">
            {submitError}
          </p>
        ) : null}

        <button type="submit" className="mqx-bg-btn mqx-bg-cta mqx-pg-cta" disabled={isSubmitting}>
          {isSubmitting ? 'Входим…' : 'Войти'}
        </button>
      </form>

      <MqxBoardButton hint="займёт минуту" onClick={onSwitchToRegister}>
        Создать аккаунт
      </MqxBoardButton>
    </div>
  );
}
