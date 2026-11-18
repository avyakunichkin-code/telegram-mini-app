/** Одна строка «подпись + значение» с иконкой — единый паттерн дашборда и аналитики */
export function MqStatRow({ icon, label, children, dense }) {
  return (
    <div className={`mq-stat-row ${dense ? 'mq-stat-row--dense' : ''}`}>
      <span className="mq-stat-row__ico" aria-hidden>{icon}</span>
      <div className="mq-stat-row__body">
        <span className="mq-stat-row__label">{label}</span>
        <span className="mq-stat-row__value">{children}</span>
      </div>
    </div>
  );
}
