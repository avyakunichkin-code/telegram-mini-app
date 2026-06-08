import assert from 'node:assert/strict';
import test from 'node:test';
import {
  areGameEventsUnlocked,
  isP1GuidanceComplete,
  MIN_PERIOD_INDEX_FOR_GAME_EVENTS,
  shouldBlockAutoEventsOverlay,
  shouldDeferGuidanceForPeriodCloseRitual,
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

test('areGameEventsUnlocked locked on turns 1-2 during curriculum', () => {
  assert.equal(
    areGameEventsUnlocked(
      { show_curriculum: true, completed_beats: ['p1_close'] },
      'started',
      2,
    ),
    false,
  );
  assert.equal(
    areGameEventsUnlocked(
      { show_curriculum: true, beat_id: 'p2_new_month', completed_beats: ['p1_close'] },
      'started',
      2,
    ),
    false,
  );
});

test('areGameEventsUnlocked on turn 3 after P1 spine', () => {
  assert.equal(
    areGameEventsUnlocked(
      { show_curriculum: true, completed_beats: ['p1_close'] },
      'started',
      MIN_PERIOD_INDEX_FOR_GAME_EVENTS,
    ),
    true,
  );
});

test('areGameEventsUnlocked locked during p1_close debrief even on turn 3', () => {
  assert.equal(
    areGameEventsUnlocked(
      {
        show_curriculum: true,
        beat_id: 'p1_close',
        show_debrief: true,
        completed_beats: ['p1_period', 'p1_salary', 'p1_cushion'],
      },
      'started',
      3,
    ),
    false,
  );
});

test('areGameEventsUnlocked t_events_intro beat on turn 3', () => {
  assert.equal(
    areGameEventsUnlocked(
      { show_curriculum: true, beat_id: 't_events_intro', completed_beats: ['p1_close', 'p2_new_month'] },
      'started',
      3,
    ),
    true,
  );
});

test('areGameEventsUnlocked locked on period 1 until p1_close', () => {
  assert.equal(
    areGameEventsUnlocked(
      { show_curriculum: true, completed_beats: ['p1_period', 'p1_salary', 'p1_cushion'] },
      'started',
      1,
    ),
    false,
  );
});

test('shouldDeferGuidanceForPeriodCloseRitual while month stats sheet open', () => {
  assert.equal(shouldDeferGuidanceForPeriodCloseRitual(true), true);
  assert.equal(shouldDeferGuidanceForPeriodCloseRitual(false), false);
});

test('shouldDeferGuidanceForPeriodCloseRitual false during p1_close debrief', () => {
  assert.equal(
    shouldDeferGuidanceForPeriodCloseRitual(true, {
      beat_id: 'p1_close',
      show_debrief: true,
    }),
    false,
  );
});

test('shouldBlockAutoEventsOverlay during period close pipeline', () => {
  assert.equal(
    shouldBlockAutoEventsOverlay({
      periodCloseOpen: false,
      periodCloseSummary: { closed_period_index: 1 },
      queuedPeriodClose: null,
      guidance: null,
    }),
    true,
  );
  assert.equal(
    shouldBlockAutoEventsOverlay({
      periodCloseOpen: false,
      periodCloseSummary: null,
      queuedPeriodClose: null,
      guidance: { beat_id: 'p1_close', show_debrief: true },
    }),
    true,
  );
  assert.equal(
    shouldBlockAutoEventsOverlay({
      periodCloseOpen: false,
      periodCloseSummary: null,
      queuedPeriodClose: null,
      guidance: { beat_id: 'p2_new_month', show_debrief: false },
    }),
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
