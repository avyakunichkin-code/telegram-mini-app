/**
 * Экран «в партии» переживает перезагрузку вкладки (F5, обновление PWA на границе хода):
 * без этого игрок после reload оказывался в меню и жал «Продолжить игру».
 * Храним только `game` — меню, выбор жизни и подготовка партии начинаются заново.
 * sessionStorage: вкладка закрыта — следующий запуск честно с меню.
 */

const KEY = 'tvoy_hod_screen_v1';

function sessionStore() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

/** @returns {'game'|'start'} стартовый экран GameApp */
export function readResumeScreen(storage = sessionStore()) {
  try {
    return storage?.getItem(KEY) === 'game' ? 'game' : 'start';
  } catch {
    return 'start';
  }
}

/** @param {string} screen текущий экран GameApp */
export function rememberScreen(screen, storage = sessionStore()) {
  try {
    if (screen === 'game') storage?.setItem(KEY, 'game');
    else storage?.removeItem(KEY);
  } catch {
    /* private mode / заблокированное хранилище — просто без восстановления */
  }
}
