import { periodCloseTitle } from '../../../utils/periodCloseDisplay';

/**
 * Хвостик «Итоги периода #N» — с периода 4+, когда авто-лист выключен.
 */
export function MqxPeriodCloseTail({ summary, onOpen }) {
  if (!summary) return null;

  const title = periodCloseTitle(summary);
  const totalXp = Number(summary.xp_earned) || 0;

  return (
    <button type="button" className="mqx-pclose-tail" onClick={onOpen}>
      <span className="mqx-pclose-tail__dot" aria-hidden />
      <span className="mqx-pclose-tail__text">{title}</span>
      {totalXp > 0 ? <span className="mqx-pclose-tail__xp">+{totalXp} XP</span> : null}
    </button>
  );
}
