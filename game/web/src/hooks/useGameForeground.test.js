/**
 * PW1: debounced foreground handler не дергает resync во время начальной загрузки.
 */
import assert from 'node:assert/strict';

function createForegroundResyncStub() {
  let loading = true;
  let refreshCalls = 0;

  const resyncAfterForeground = async () => {
    if (loading) return;
    refreshCalls += 1;
  };

  const debounceForeground = (handler, delayMs = 400) => {
    let timerId = null;
    return () => {
      if (timerId != null) clearTimeout(timerId);
      timerId = setTimeout(() => {
        timerId = null;
        handler();
      }, delayMs);
    };
  };

  return {
    setLoading(value) {
      loading = value;
    },
    getRefreshCalls() {
      return refreshCalls;
    },
    resyncAfterForeground,
    debounceForeground,
  };
}

const stub = createForegroundResyncStub();
const onForeground = stub.debounceForeground(() => {
  void stub.resyncAfterForeground();
});

onForeground();
onForeground();

await new Promise((resolve) => setTimeout(resolve, 450));
assert.equal(stub.getRefreshCalls(), 0, 'no resync while loading');

stub.setLoading(false);
onForeground();
onForeground();

await new Promise((resolve) => setTimeout(resolve, 450));
assert.equal(stub.getRefreshCalls(), 1, 'single debounced resync after load');

console.log('useGameForeground.test.js: ok');
