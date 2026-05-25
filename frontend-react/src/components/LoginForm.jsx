import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthFormField } from './mqx/auth/AuthFormField';
import { AuthMonetkaScreen } from './mqx/auth/AuthMonetkaScreen';
import { MqxButton } from './mqx/primitives/MqxButton';
import {
  hasFieldErrors,
  validateLoginFields,
} from '../utils/authFormValidation';

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
      setSubmitError('Неверный email или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthMonetkaScreen
      showBrand
      showLottieBackdrop
      title="Привет, я Монетка!"
      subtitle={
        <>
          Помогу разобраться с финансами. Введи <span className="mqx-voice-em">email</span> и пароль
        </>
      }
      titleId="mqx-login-monetka-title"
    >
      <form onSubmit={handleSubmit} className="mqx-auth-monetka__form" noValidate>
        <div className="mqx-form">
          <AuthFormField
            id="login-email"
            name="email"
            label="Email"
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
            placeholder="••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {submitError ? (
          <div className="mq-form-alert" role="alert" style={{ marginTop: 12 }}>
            {submitError}
          </div>
        ) : null}

        <div className="mqx-auth-monetka__actions">
          <MqxButton
            variant="primary"
            type="submit"
            stretched
            disabled={isSubmitting}
            title="Войти в аккаунт"
          >
            {isSubmitting ? 'Входим…' : 'Войти'}
          </MqxButton>
        </div>

        <p className="mqx-auth-monetka__link">
          Нет аккаунта?{' '}
          <MqxButton type="button" variant="link" title="Перейти к регистрации" onClick={onSwitchToRegister}>
            Создать
          </MqxButton>
        </p>
      </form>
    </AuthMonetkaScreen>
  );
}
