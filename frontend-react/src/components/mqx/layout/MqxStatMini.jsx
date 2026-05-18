/**
 * Мини-стат в сетке 2×2 (дашборд: баланс, подушка, поток, стрик).
 */
export function MqxStatMini({ title, value, icon, accent = 'mqx-accent--violet' }) {
  return (
    <div className="mqx-mini" role="group" aria-label={title}>
      <div className={`mqx-mini__icon ${accent}`} aria-hidden>
        {icon}
      </div>
      <div className="mqx-mini__label">{title}</div>
      <div className="mqx-mini__value">{value}</div>
    </div>
  );
}
