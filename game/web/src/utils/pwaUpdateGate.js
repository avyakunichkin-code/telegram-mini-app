/**
 * Когда ставить новую версию PWA. Перезагрузка посреди карточки события или листа ломает доверие,
 * поэтому новый SW ждёт «безопасного момента»: экран меню или закрытие итогов хода.
 *
 * @param {{ apply: () => void, notify: () => void }} deps
 */
export function createPwaUpdateGate({ apply, notify }) {
  let ready = false;
  let safe = false;
  let applied = false;
  let notified = false;

  const applyOnce = () => {
    if (applied) return;
    applied = true;
    apply();
  };

  return {
    /** Новый SW установлен и ждёт активации. */
    needRefresh() {
      ready = true;
      if (safe) {
        applyOnce();
      } else if (!notified) {
        notified = true;
        notify();
      }
    },
    /** Экран без партии в процессе (меню): обновляемся сразу, как только версия готова. */
    setSafeZone(isSafe) {
      safe = Boolean(isSafe);
      if (safe && ready) applyOnce();
    },
    /** Граница хода: игрок закрыл итоги — состояние уже на сервере. */
    turnBoundary() {
      if (ready) applyOnce();
    },
    isReady() {
      return ready;
    },
  };
}
