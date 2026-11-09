/** Не выдавать недоступность API за неверные учётные данные. */
export function authSubmitError(error, action) {
  const status = error?.status;
  if (status === 0 || status >= 500) {
    return 'Сервер недоступен. Попробуйте ещё раз позже.';
  }
  if (action === 'login' && status === 401) {
    return 'Неверная почта или пароль';
  }
  if (action === 'register' && (status === 400 || status === 409) && error?.detail === 'Email already registered') {
    return 'Эта почта уже зарегистрирована. Войдите в аккаунт.';
  }
  return action === 'login'
    ? 'Не удалось войти. Попробуйте ещё раз.'
    : 'Не удалось создать аккаунт. Попробуйте ещё раз.';
}
