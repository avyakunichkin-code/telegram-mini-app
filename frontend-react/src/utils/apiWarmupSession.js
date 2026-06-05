const SESSION_KEY = 'tvoy_hod_api_warm_v1';

export function isApiWarmedThisSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markApiWarmedThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function shouldShowApiColdStart() {
  return !isApiWarmedThisSession();
}
