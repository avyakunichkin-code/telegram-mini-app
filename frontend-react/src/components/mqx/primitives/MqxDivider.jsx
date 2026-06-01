/**
 * Горизонтальный разделитель (inset по умолчанию — как D′ dash).
 */
export function MqxDivider({ inset = true, className = '' }) {
  const cls = ['mqx-dash-divider', inset && 'mqx-dash-divider--inset', className].filter(Boolean).join(' ');
  return <hr className={cls} />;
}
