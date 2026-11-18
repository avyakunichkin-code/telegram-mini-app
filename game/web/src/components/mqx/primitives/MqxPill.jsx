/** Пилюля hero (события, навигация). */
export function MqxPill({ events = false, badge, className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={['mqx-pill', events && 'mqx-pill--events', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
      {badge != null ? <span className="mqx-pill__badge">{badge}</span> : null}
    </button>
  );
}
