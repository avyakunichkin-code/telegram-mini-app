/** Тексты полноэкранного bootstrap (auth + первая загрузка данных). */
export const BOOTSTRAP_COPY = {
  cold_start: {
    title: 'Разбудим сервер',
    subtitle: (
      <>
        Первый запуск после паузы может занять{' '}
        <span className="mqx-voice-em">20–30 секунд</span> — всё в порядке, просто
        подождите. Дальше обычно быстрее.
      </>
    ),
    hintDefault: 'Подключаемся к игре…',
    hintSlow: 'Сервер просыпается — ещё немного, не закрывайте вкладку',
  },
  session: {
    title: 'Секунду, листаю полки',
    subtitle: 'Подтягиваю твои сохранения…',
    hintDefault: 'Проверяем вход…',
    hintSlow: 'Сервер отвечает дольше обычного — подождите ещё немного',
  },
};

export function getBootstrapCopy(mode = 'session') {
  return BOOTSTRAP_COPY[mode] ?? BOOTSTRAP_COPY.session;
}
