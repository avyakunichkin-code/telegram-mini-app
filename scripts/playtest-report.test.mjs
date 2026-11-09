import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from './playtest-report.mjs';

const options = { from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z', observedAt: '2026-11-07T00:00:00Z' };
function fixture() {
  return { build_revision: 'abcdef0', accounts: [{ id: 1, guidance_completed: true }],
    profiles: [1, 2].map(id => ({ id, user_id: 1, save_kind: 'game', created_at: options.from, run_outcome: id === 1 ? 'victory' : null })),
    closings: [1, 2, 3, 4, 5].map(period_index => ({ game_profile_id: 1, period_index, closed_at: options.to })),
    surveys: [{ user_id: 1, survey_key: 'first_turns_v2', submitted_at: options.to, game_profile_id: 1 }] };
}

test('separates two runs from one account and counts actual unique closes', () => {
  const data = fixture(); data.closings.push(data.closings[0]);
  const before = JSON.stringify(data);
  const report = buildReport(data, options);
  assert.equal(report.cohort.profiles, 2);
  assert.equal(report.cohort.accounts, 1);
  assert.deepEqual(report.stages.five_closes, { count: 1, denominator: 2, rate_pct: 50 });
  assert.equal(report.account_status.guidance_completed, 1);
  assert.equal(report.account_status.surveys_linked_to_cohort, 1);
  assert.equal(JSON.stringify(data), before);
  assert.ok(!JSON.stringify(report).includes('user_id'));
});

test('half-open cohort excludes end boundary and legacy Plan', () => {
  const data = fixture();
  data.profiles[1].created_at = options.to;
  data.profiles.push({ ...data.profiles[0], id: 3, save_kind: 'plan' });
  assert.equal(buildReport(data, options).cohort.profiles, 1);
});

test('zero denominator is unknown rate, not zero success', () => {
  const data = fixture(); data.profiles.forEach(row => { row.save_kind = 'plan'; });
  const report = buildReport(data, options);
  assert.equal(report.stages.first_close.rate_pct, null);
  assert.equal(report.cohort.youngest_observation_hours, null);
});

test('unlinked survey stays on account and is not attributed to latest run', () => {
  const data = fixture(); data.surveys[0].game_profile_id = null;
  const report = buildReport(data, options);
  assert.equal(report.account_status.surveys_not_linked_to_cohort, 1);
  assert.equal(report.account_status.surveys_linked_to_cohort, 0);
});

test('rejects invalid windows, missing timezone, future records and foreign survey links', () => {
  assert.throws(() => buildReport(fixture(), { ...options, to: options.from }));
  assert.throws(() => buildReport(fixture(), { ...options, from: '2026-11-01' }));
  const future = fixture(); future.closings[0].closed_at = '2027-01-01T00:00:00Z';
  assert.throws(() => buildReport(future, options));
  const foreign = fixture(); foreign.accounts.push({ id: 2, guidance_completed: false });
  foreign.surveys[0].user_id = 2;
  assert.throws(() => buildReport(foreign, options));
});

test('rejects personal fields, duplicate profiles and duplicate account surveys', () => {
  const personal = fixture(); personal.accounts[0].email = 'synthetic@example.invalid';
  assert.throws(() => buildReport(personal, options));
  const duplicate = fixture(); duplicate.profiles.push(duplicate.profiles[0]);
  assert.throws(() => buildReport(duplicate, options));
  const surveys = fixture(); surveys.surveys.push(surveys.surveys[0]);
  assert.throws(() => buildReport(surveys, options));
});
