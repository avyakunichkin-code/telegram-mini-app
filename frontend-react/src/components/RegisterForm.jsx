import { useCallback, useState } from 'react';
import { formatApiErrorDetail } from '../api';
import { useAuth } from '../context/AuthContext';
import { deriveUsernameFromEmail } from '../utils/deriveUsernameFromEmail';
import {
  hasFieldErrors,
  validateRegisterFields,
} from '../utils/authFormValidation';
import { AuthFormField } from './mqx/auth/AuthFormField';
import { AuthMonetkaScreen } from './mqx/auth/AuthMonetkaScreen';
import { MqxButton } from './mqx/primitives/MqxButton';

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
        username: deriveUsernameFromEmail(email),
        password,
        password_confirm: passwordConfirm,
        email: email.trim(),
      });
      window.location.href = `${import.meta.env.BASE_URL}#/`;
    } catch (err) {
      setSubmitError(
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
      showBrand
      title="Рада знакомству!"
      subtitle={
        <>
          Регистрируйся по <span className="mqx-voice-em">email</span> — пригодится, если забудешь пароль.
        </>
      }
      titleId="mqx-register-monetka-title"
    >
      <form onSubmit={handleSubmit} className="mqx-auth-monetka__form" noValidate>
        <div className="mqx-form">
          <AuthFormField
            id="register-email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            onBlur={runValidation}
            error={fieldErrors.email}
            placeholder="name@example.com"
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
            placeholder="••••••"
            autoComplete="new-password"
            required
            minLength={6}
          />
          <AuthFormField
            id="register-password-confirm"
            name="password_confirm"
            label="Повторите пароль"
            type="password"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              clearFieldError('passwordConfirm');
            }}
            onBlur={runValidation}
            error={fieldErrors.passwordConfirm}
            placeholder="••••••"
            autoComplete="new-password"
            required
          />
        </div>

        {submitError ? (
          <div className="mq-form-alert" role="alert" style={{ marginTop: 12 }}>
            {submitError}
          </div>
        ) : null}

        <div className="pg-actions">
          <MqxButton
            variant="primary"
            type="submit"
            stretched
            disabled={isSubmitting}
            title="Создать аккаунт и войти"
          >
            {isSubmitting ? 'Регистрация…' : 'Зарегистрироваться'}
          </MqxButton>
        </div>

        <p className="mqx-auth-monetka__link">
          Уже есть аккаунт?{' '}
          <MqxButton type="button" variant="link" title="Перейти к входу" onClick={onSwitchToLogin}>
            Войти
          </MqxButton>
        </p>
      </form>
    </AuthMonetkaScreen>
  );
}
