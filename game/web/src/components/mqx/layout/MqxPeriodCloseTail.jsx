import { periodCloseEventsSpawnFailed, periodCloseTitle } from '../../../utils/periodCloseDisplay';

/**
 * Хвостик «Итоги периода #N» — с периода 4+, когда авто-лист выключен.
 */
export function MqxPeriodCloseTail({ summary, onOpen }) {
  if (!summary) return null;

  const title = periodCloseTitle(summary);
  const spawnFailed = periodCloseEventsSpawnFailed(summary);

  return (
    <button type="button" className="mqx-pclose-tail" onClick={onOpen}>
      <span className="mqx-pclose-tail__dot" aria-hidden />
      <span className="mqx-pclose-tail__text">
        {title}
        {spawnFailed ? ' · карточки не собрались' : ''}
      </span>
    </button>
  );
}
