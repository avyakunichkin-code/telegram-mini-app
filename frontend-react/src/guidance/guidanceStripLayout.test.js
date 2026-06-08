import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeGuidanceScrollPad,
  computeGuidanceSheetLift,
  defaultGuidanceStripBottom,
} from './guidanceStripLayout.js';

test('defaultGuidanceStripBottom', () => {
  assert.equal(defaultGuidanceStripBottom(64), 64);
});

test('computeGuidanceScrollPad uses strip height only', () => {
  assert.equal(computeGuidanceScrollPad(160, 12), 'calc(160px + 12px)');
});

test('computeGuidanceSheetLift stacks strip and tab bar', () => {
  assert.equal(computeGuidanceSheetLift(160, 56, 4), 'calc(160px + 56px + 4px)');
});
