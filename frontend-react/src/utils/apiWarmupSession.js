const SESSION_KEY = 'tvoy_hod_api_warm_v1';

/** До первого успешного «рабочего» ответа после полной перезагрузки вкладки — честный cold-start UI. */
let pageColdUiActive = true;

export function isPageColdUiActive() {
  return pageColdUiActive;
}

export function markPageColdUiComplete() {
  pageColdUiActive = false;
}

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

/** Пинг /api/health — не чаще одного раза за вкладку после успешного ответа. */
export function shouldRunApiWake() {
  return !isApiWarmedThisSession();
}
