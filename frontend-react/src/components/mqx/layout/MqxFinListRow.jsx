/**
 * Компактная строка списка позиций (актив, долг, депозит).
 * Trailing — обычно MqxRowAction.
 */
export function MqxFinListRow({ title, subtitle, metrics, trailing, className = '' }) {
  return (
    <div className={['mqx-fin-row', 'mqx-fin-row--positions', className].filter(Boolean).join(' ')}>
      <div className="mqx-fin-row__l">
        <div className="mqx-fin-row__title">{title}</div>
        {subtitle ? <div className="mqx-fin-row__sub">{subtitle}</div> : null}
        {metrics}
      </div>
      {trailing ? <div className="mqx-fin-row__r">{trailing}</div> : null}
    </div>
  );
}
