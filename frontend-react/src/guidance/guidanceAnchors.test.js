import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getGuidanceAnchorForBeat,
  getGuidanceBottomReservePx,
} from './guidanceAnchors.js';

describe('guidanceAnchors', () => {
  it('maps action beats to dashboard anchors', () => {
    assert.equal(getGuidanceAnchorForBeat('p1_salary'), 'salary');
    assert.equal(getGuidanceAnchorForBeat('t_events_intro'), 'events');
    assert.equal(getGuidanceAnchorForBeat('t_needs'), 'needs');
  });

  it('returns null for unknown or legacy O2 beat ids', () => {
    assert.equal(getGuidanceAnchorForBeat('p2_events_intro'), null);
    assert.equal(getGuidanceAnchorForBeat('p3_needs'), null);
    assert.equal(getGuidanceAnchorForBeat(null), null);
  });

  it('reserves strip height plus padding for scroll', () => {
    assert.equal(getGuidanceBottomReservePx(140, 16), 140 + 16);
  });
});
