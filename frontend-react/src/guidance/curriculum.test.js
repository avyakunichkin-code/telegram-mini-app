import assert from 'node:assert/strict';
import test from 'node:test';
import {
  areGameEventsUnlocked,
  isP1GuidanceComplete,
  shouldDeferPeriodCloseDuringGuidance,
} from './curriculum.js';

test('isP1GuidanceComplete when p1_close done', () => {
  assert.equal(
    isP1GuidanceComplete({ show_curriculum: true, completed_beats: ['p1_close'] }),
    true,
  );
});

test('isP1GuidanceComplete false during P1', () => {
  assert.equal(
    isP1GuidanceComplete({ show_curriculum: true, completed_beats: ['p1_period'] }),
    false,
  );
});

test('isP1GuidanceComplete when curriculum hidden', () => {
  assert.equal(isP1GuidanceComplete({ show_curriculum: false }), true);
});

test('areGameEventsUnlocked during P2 curriculum after P1', () => {
  assert.equal(
    areGameEventsUnlocked(
      { show_curriculum: true, completed_beats: ['p1_close'] },
      'started',
    ),
    true,
  );
  assert.equal(
    areGameEventsUnlocked({ show_curriculum: true, completed_beats: ['p1_period'] }, 'started'),
    false,
  );
});

test('shouldDeferPeriodCloseDuringGuidance only early P1', () => {
  assert.equal(
    shouldDeferPeriodCloseDuringGuidance(
      { show_curriculum: true, completed_beats: ['p1_period'] },
      1,
    ),
    true,
  );
  assert.equal(
    shouldDeferPeriodCloseDuringGuidance(
      { show_curriculum: true, completed_beats: ['p1_close'] },
      2,
    ),
    false,
  );
});
