const SESSION_DISMISS_KEY = 'tvoy_hod_guidance_session_dismiss';

export function getGuidanceSessionDismissCount() {
  try {
    const raw = sessionStorage.getItem(SESSION_DISMISS_KEY);
    const n = parseInt(raw ?? '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function bumpGuidanceSessionDismissCount() {
  const next = getGuidanceSessionDismissCount() + 1;
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, String(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}

export function resetGuidanceSessionDismissCount() {
  try {
    sessionStorage.removeItem(SESSION_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
