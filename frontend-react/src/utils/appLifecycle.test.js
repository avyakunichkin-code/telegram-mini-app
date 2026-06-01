import assert from 'node:assert/strict';
import { subscribeAppForeground, debounceForeground } from './appLifecycle.js';

function mockDom() {
  const docListeners = new Map();
  const winListeners = new Map();
  const doc = {
    visibilityState: 'hidden',
    addEventListener(type, fn) {
      docListeners.set(type, fn);
    },
    removeEventListener(type) {
      docListeners.delete(type);
    },
  };
  const win = {
    addEventListener(type, fn) {
      winListeners.set(type, fn);
    },
    removeEventListener(type) {
      winListeners.delete(type);
    },
  };
  return { doc, win, docListeners, winListeners };
}

const savedDocument = globalThis.document;
const savedWindow = globalThis.window;

try {
  const { doc, win, docListeners } = mockDom();
  globalThis.document = doc;
  globalThis.window = win;

  let count = 0;
  const unsub = subscribeAppForeground(() => {
    count += 1;
  });

  doc.visibilityState = 'visible';
  docListeners.get('visibilitychange')();
  assert.equal(count, 1);

  doc.visibilityState = 'hidden';
  docListeners.get('visibilitychange')();
  assert.equal(count, 1);

  doc.visibilityState = 'visible';
  docListeners.get('visibilitychange')();
  assert.equal(count, 2);

  unsub();
  assert.equal(count, 2);
} finally {
  globalThis.document = savedDocument;
  globalThis.window = savedWindow;
}

await new Promise((resolve, reject) => {
  let debouncedCalls = 0;
  const debounced = debounceForeground(() => {
    debouncedCalls += 1;
  }, 20);
  debounced({ source: 'a' });
  debounced({ source: 'b' });
  setTimeout(() => {
    try {
      assert.equal(debouncedCalls, 1);
      resolve();
    } catch (e) {
      reject(e);
    }
  }, 35);
});

console.log('appLifecycle.test.js: ok');
