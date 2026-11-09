import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authSubmitError } from './authSubmitError.js';

test('API outage is not reported as invalid credentials or duplicate email', () => {
  for (const action of ['login', 'register']) {
    for (const status of [0, 500, 502, 503]) {
      assert.equal(authSubmitError({ status, detail: '' }, action),
        'Сервер недоступен. Попробуйте ещё раз позже.');
    }
  }
});

test('only confirmed auth failures receive specific messages', () => {
  assert.equal(authSubmitError({ status: 401 }, 'login'), 'Неверная почта или пароль');
  assert.equal(authSubmitError({ status: 400, detail: 'Email already registered' }, 'register'),
    'Эта почта уже зарегистрирована. Войдите в аккаунт.');
  assert.equal(authSubmitError(new Error(), 'register'),
    'Не удалось создать аккаунт. Попробуйте ещё раз.');
  assert.equal(authSubmitError({ status: 429 }, 'login'),
    'Не удалось войти. Попробуйте ещё раз.');
});
