import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getGuidanceAnchorForBeat,
  getGuidanceBottomReservePx,
} from './guidanceAnchors.js';

describe('guidanceAnchors', () => {
  it('maps action beats to dashboard anchors', () => {
    assert.equal(getGuidanceAnchorForBeat('p1_salary'), 'salary');
    assert.equal(getGuidanceAnchorForBeat('p2_events_intro'), 'events');
    assert.equal(getGuidanceAnchorForBeat('p3_needs'), 'needs');
  });

  it('returns null for beats without UI anchor', () => {
    assert.equal(getGuidanceAnchorForBeat('p2_events_done'), null);
    assert.equal(getGuidanceAnchorForBeat('p3_farewell'), null);
    assert.equal(getGuidanceAnchorForBeat(null), null);
  });

  it('sums strip + tabbar reserve', () => {
    assert.equal(getGuidanceBottomReservePx(140, 56), 140 + 56 + 16);
  });
});
