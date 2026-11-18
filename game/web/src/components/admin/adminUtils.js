/** Общие хелперы Admin Watchtower. */

export function notificationProfileId(row) {
  if (row?.game_profile_id) return row.game_profile_id;
  const payload = row?.payload;
  if (!payload || typeof payload !== 'object') return null;
  return payload.game_profile_id ?? payload.profile_id ?? null;
}

export function buildAttentionQueue({ profiles = [], runFeedback = [] }) {
  const items = [];
  const seen = new Set();

  const push = (item) => {
    const key = `${item.kind}:${item.profileId ?? item.feedbackId}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  for (const p of profiles) {
    if (p.stuck_kind) {
      push({
        kind: 'stuck',
        label: p.stuck_kind === 'onboarding_stuck' ? 'Застрял: онбординг' : 'Застрял: игра',
        profileId: p.id,
        name: p.name,
        username: p.username,
      });
    }
    if (p.run_outcome === 'defeat') {
      push({
        kind: 'defeat',
        label: 'Поражение',
        profileId: p.id,
        name: p.name,
        username: p.username,
      });
    }
  }

  for (const fb of runFeedback.slice(0, 8)) {
    push({
      kind: 'feedback',
      label: `Отзыв · ${fb.outcome_label || fb.outcome}`,
      profileId: fb.game_profile_id,
      name: fb.profile_name,
      username: fb.username,
      feedbackId: fb.id,
      preview: fb.comment_preview || fb.comment,
    });
  }

  return items.slice(0, 12);
}
