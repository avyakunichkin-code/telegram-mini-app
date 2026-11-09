import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function timestamp(value) {
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)
      || !Number.isFinite(Date.parse(value))) throw new Error('Expected timestamp with timezone');
  return Date.parse(value);
}

function fields(row, allowed, required = allowed) {
  if (!row || typeof row !== 'object' || Array.isArray(row)
      || Object.keys(row).some(key => !allowed.includes(key))
      || required.some(key => !(key in row))) throw new Error('Invalid snapshot fields');
}

function id(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Expected positive integer ID');
  return value;
}

/** Aggregate an explicit, pseudonymous snapshot. No database, environment or network access. */
export function buildReport(snapshot, { from, to, observedAt }) {
  const start = timestamp(from), end = timestamp(to), observed = timestamp(observedAt);
  if (!(start < end && end <= observed)) throw new Error('Expected from < to <= observedAt');
  fields(snapshot, ['build_revision', 'profiles', 'closings', 'accounts', 'surveys']);
  if (typeof snapshot.build_revision !== 'string' || !/^[a-f0-9]{7,40}$/.test(snapshot.build_revision)) {
    throw new Error('Expected git revision');
  }
  for (const key of ['profiles', 'closings', 'accounts', 'surveys']) {
    if (!Array.isArray(snapshot[key])) throw new Error('Expected snapshot arrays');
  }
  const profiles = new Map(), accounts = new Map();
  for (const row of snapshot.accounts) {
    fields(row, ['id', 'guidance_completed']);
    id(row.id);
    if (accounts.has(row.id) || typeof row.guidance_completed !== 'boolean') throw new Error('Invalid account');
    accounts.set(row.id, row);
  }
  for (const row of snapshot.profiles) {
    fields(row, ['id', 'user_id', 'save_kind', 'created_at', 'run_outcome']);
    id(row.id); id(row.user_id);
    if (profiles.has(row.id) || !accounts.has(row.user_id)
        || !['game', 'plan'].includes(row.save_kind)
        || ![null, 'victory', 'defeat'].includes(row.run_outcome)
        || timestamp(row.created_at) > observed) throw new Error('Invalid profile');
    profiles.set(row.id, row);
  }
  const cohort = [...profiles.values()].filter(row => row.save_kind === 'game'
    && timestamp(row.created_at) >= start && timestamp(row.created_at) < end);
  const cohortIds = new Set(cohort.map(row => row.id));
  const userIds = new Set(cohort.map(row => row.user_id));
  const closes = new Map(cohort.map(row => [row.id, new Set()]));
  for (const row of snapshot.closings) {
    fields(row, ['game_profile_id', 'period_index', 'closed_at']);
    id(row.game_profile_id); id(row.period_index);
    const profile = profiles.get(row.game_profile_id);
    const closed = timestamp(row.closed_at);
    if (!profile || closed < timestamp(profile.created_at) || closed > observed) throw new Error('Invalid closing');
    closes.get(row.game_profile_id)?.add(row.period_index);
  }
  const submitted = new Set();
  let linked = 0, unlinked = 0;
  for (const row of snapshot.surveys) {
    fields(row, ['user_id', 'survey_key', 'submitted_at', 'game_profile_id']);
    id(row.user_id);
    if (!accounts.has(row.user_id) || row.survey_key !== 'first_turns_v2'
        || timestamp(row.submitted_at) > observed) throw new Error('Invalid survey');
    const profile = row.game_profile_id === null ? null : profiles.get(id(row.game_profile_id));
    if (row.game_profile_id !== null && (!profile || profile.user_id !== row.user_id
        || timestamp(row.submitted_at) < timestamp(profile.created_at))) throw new Error('Invalid survey link');
    if (submitted.has(row.user_id)) throw new Error('Duplicate survey for account/version');
    submitted.add(row.user_id);
    if (cohortIds.has(row.game_profile_id)) linked++;
    else if (userIds.has(row.user_id)) unlinked++;
  }
  const measure = count => ({ count, denominator: cohort.length,
    rate_pct: cohort.length ? Math.round(count / cohort.length * 1000) / 10 : null });
  return {
    schema_version: 1, build_revision: snapshot.build_revision,
    cohort: { from, to, observed_at: observedAt, profiles: cohort.length, accounts: userIds.size,
      youngest_observation_hours: cohort.length ? Math.round(Math.min(...cohort.map(row =>
        (observed - timestamp(row.created_at)) / 3600000)) * 10) / 10 : null },
    stages: {
      started: measure(cohort.length),
      first_close: measure([...closes.values()].filter(value => value.size >= 1).length),
      five_closes: measure([...closes.values()].filter(value => value.size >= 5).length),
      victory: measure(cohort.filter(row => row.run_outcome === 'victory').length),
      defeat: measure(cohort.filter(row => row.run_outcome === 'defeat').length),
    },
    account_status: { denominator: userIds.size,
      guidance_completed: [...userIds].filter(userId => accounts.get(userId).guidance_completed).length,
      survey_submitted: [...userIds].filter(userId => submitted.has(userId)).length,
      surveys_linked_to_cohort: linked, surveys_not_linked_to_cohort: unlinked },
    limitations: ['Account guidance is not per-run completion.',
      'Outcomes and guidance are snapshot state, not historical state at cohort end.',
      'Elapsed observation time is not active play time.',
      'No response or inactivity does not establish a reason for leaving.',
      'Build revision labels this snapshot; per-run content versions are not verified.',
      'Understanding and independent play require human observation.'],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [input, from, to, observedAt, ...extra] = process.argv.slice(2);
    if (!input || !observedAt || extra.length) throw new Error('Usage: node scripts/playtest-report.mjs snapshot.json from to observedAt');
    console.log(JSON.stringify(buildReport(JSON.parse(readFileSync(input, 'utf8')), { from, to, observedAt }), null, 2));
  } catch (error) {
    // Do not echo snapshot contents or field values in validation failures.
    console.error(error instanceof SyntaxError ? 'Invalid JSON snapshot' : error.message);
    process.exitCode = 1;
  }
}
