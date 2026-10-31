import { useCallback, useState } from 'react';
import { formatApiErrorDetail } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  hasFieldErrors,
  validateRegisterFields,
} from '../utils/authFormValidation';
import { AuthFormField } from './mqx/auth/AuthFormField';
import { BrandLogo } from './BrandLogo';
import { MqxBoardButton } from './mqx/pregame/MqxBoardButton';

/** Регистрация ★ BG-2: та же оболочка, что вход; одна главная кнопка. */
export function RegisterForm({ onSwitchToLogin }) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const runValidation = useCallback(() => {
    const errors = validateRegisterFields({
      email,
      password,
      passwordConfirm,
    });
    setFieldErrors(errors);
    return errors;
  }, [email, password, passwordConfirm]);

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
      await register({
        password,
        password_confirm: passwordConfirm,
        email: email.trim(),
      });
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch (err) {
      setSubmitError(
        formatApiErrorDetail(
          err?.detail ?? err?.message,
          'Ошибка регистрации. Возможно, почта уже занята.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mqx-pg mqx-pg--auth">
      <h1 className="mqx-bg-sr-only">Регистрация</h1>
      <BrandLogo variant="full" className="mqx-pg-logo" />
      <form onSubmit={handleSubmit} className="mqx-pg-form" noValidate aria-label="Регистрация">
        <AuthFormField
          id="register-email"
          name="email"
          label="Почта"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          onBlur={runValidation}
          error={fieldErrors.email}
          placeholder="name@mail.ru"
          autoComplete="email"
          inputMode="email"
          required
        />
        <AuthFormField
          id="register-password"
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
          hint="Не короче 6 символов"
          autoComplete="new-password"
          required
          minLength={6}
        />
        <AuthFormField
          id="register-password-confirm"
          name="password_confirm"
          label="Повтори пароль"
          type="password"
          value={passwordConfirm}
          onChange={(e) => {
            setPasswordConfirm(e.target.value);
            clearFieldError('passwordConfirm');
          }}
          onBlur={runValidation}
          error={fieldErrors.passwordConfirm}
          autoComplete="new-password"
          required
        />

        {submitError ? (
          <p className="mqx-pg-form__alert" role="alert">
            {submitError}
          </p>
        ) : null}

        <button type="submit" className="mqx-bg-btn mqx-bg-cta mqx-pg-cta" disabled={isSubmitting}>
          {isSubmitting ? 'Создаём…' : 'Создать аккаунт'}
        </button>
      </form>

      <MqxBoardButton hint="войти" onClick={onSwitchToLogin}>
        Уже есть аккаунт
      </MqxBoardButton>
    </div>
  );
}
