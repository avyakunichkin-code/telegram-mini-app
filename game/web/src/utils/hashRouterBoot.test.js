import assert from 'node:assert/strict';
import {
  ensureHashRouterEntry,
  isGameShellPathname,
  isLandingPathname,
} from './hashRouterBoot.js';

assert.equal(isLandingPathname('/telegram-mini-app/landing/'), true);
assert.equal(isLandingPathname('/telegram-mini-app/landing/index.html'), true);
assert.equal(isGameShellPathname('/telegram-mini-app/landing/'), false);
assert.equal(isGameShellPathname('/telegram-mini-app/'), true);

const savedLocation = globalThis.location;

try {
  delete globalThis.location;
  globalThis.location = {
    hash: '',
    pathname: '/telegram-mini-app/',
    search: '',
    replace(url) {
      this._replaced = url;
    },
  };
  ensureHashRouterEntry();
  assert.equal(globalThis.location._replaced, '/telegram-mini-app/#/');

  globalThis.location.pathname = '/telegram-mini-app/landing/';
  globalThis.location._replaced = undefined;
  ensureHashRouterEntry();
  assert.equal(globalThis.location._replaced, undefined);

  globalThis.location.hash = '#/login';
  globalThis.location.pathname = '/telegram-mini-app/';
  ensureHashRouterEntry();
  assert.equal(globalThis.location._replaced, undefined);
} finally {
  globalThis.location = savedLocation;
}

console.log('hashRouterBoot.test.js: ok');
