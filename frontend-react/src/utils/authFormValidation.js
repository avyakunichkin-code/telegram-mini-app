/** Валидация полей входа и регистрации (синхронно с backend UserRegister). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

export function validateLoginFields({ username, password }) {
  const errors = {};
  const email = (username ?? '').trim().toLowerCase();

  if (!email) {
    errors.username = 'Укажите email';
  } else if (!EMAIL_RE.test(email)) {
    errors.username = 'Введите корректный email';
  }

  if (!(password ?? '').length) {
    errors.password = 'Введите пароль';
  }

  return errors;
}

export function validateRegisterFields({ email, password, passwordConfirm }) {
  const errors = {};
  const trimmedEmail = (email ?? '').trim().toLowerCase();
  const pass = password ?? '';
  const confirm = passwordConfirm ?? '';

  if (!trimmedEmail) {
    errors.email = 'Укажите email';
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    errors.email = 'Введите корректный email';
  }

  if (!pass) {
    errors.password = 'Придумайте пароль';
  } else if (pass.length < PASSWORD_MIN) {
    errors.password = `Пароль — не короче ${PASSWORD_MIN} символов`;
  } else if (pass.length > PASSWORD_MAX) {
    errors.password = `Пароль — не длиннее ${PASSWORD_MAX} символов`;
  }

  if (!confirm) {
    errors.passwordConfirm = 'Повторите пароль';
  } else if (pass !== confirm) {
    errors.passwordConfirm = 'Пароли не совпадают';
  }

  return errors;
}

export function hasFieldErrors(errors) {
  return Object.keys(errors).length > 0;
}

/** Первое сообщение для общего alert (если нужен один блок). */
export function firstFieldError(errors) {
  const key = Object.keys(errors)[0];
  return key ? errors[key] : null;
}
