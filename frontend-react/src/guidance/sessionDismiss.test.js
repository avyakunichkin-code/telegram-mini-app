import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  bumpGuidanceSessionDismissCount,
  getGuidanceSessionDismissCount,
  resetGuidanceSessionDismissCount,
} from './sessionDismiss.js';

const store = new Map();

beforeEach(() => {
  store.clear();
  globalThis.sessionStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
});

test('guidance sessionDismiss tracks count in sessionStorage', () => {
  resetGuidanceSessionDismissCount();
  assert.equal(getGuidanceSessionDismissCount(), 0);
  assert.equal(bumpGuidanceSessionDismissCount(), 1);
  assert.equal(bumpGuidanceSessionDismissCount(), 2);
  assert.equal(getGuidanceSessionDismissCount(), 2);
  resetGuidanceSessionDismissCount();
  assert.equal(getGuidanceSessionDismissCount(), 0);
});
