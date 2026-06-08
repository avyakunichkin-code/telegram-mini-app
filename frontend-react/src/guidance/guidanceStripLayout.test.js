import assert from 'node:assert/strict';
import test from 'node:test';
import { computeGuidanceScrollPad, defaultGuidanceStripBottom } from './guidanceStripLayout.js';

test('defaultGuidanceStripBottom', () => {
  assert.equal(defaultGuidanceStripBottom(64), 68);
});

test('computeGuidanceScrollPad sums strip height and bottom offset', () => {
  assert.equal(computeGuidanceScrollPad(160, 68, 8), 'calc(160px + 68px + 8px)');
});
