import assert from 'node:assert/strict';

import {
  periodCloseEventsSpawnFailed,
  shouldAutoOpenPeriodClose,
} from './periodCloseDisplay.js';

assert.equal(periodCloseEventsSpawnFailed(null), false);
assert.equal(periodCloseEventsSpawnFailed({}), false);
assert.equal(periodCloseEventsSpawnFailed({ events_spawn_failed: false }), false);
assert.equal(periodCloseEventsSpawnFailed({ events_spawn_failed: true }), true);

assert.equal(shouldAutoOpenPeriodClose({ closed_period_index: 5, cash_delta: 0 }), false);
assert.equal(
  shouldAutoOpenPeriodClose({
    closed_period_index: 5,
    cash_delta: 0,
    events_spawn_failed: true,
  }),
  true,
);
assert.equal(shouldAutoOpenPeriodClose({ closed_period_index: 2, cash_delta: 0 }), true);

console.log('periodCloseDisplay.test.js OK');
