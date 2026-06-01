import assert from 'node:assert/strict';
import test from 'node:test';
import { isP1GuidanceComplete } from './curriculum.js';

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
