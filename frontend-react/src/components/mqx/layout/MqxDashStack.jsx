/**
 * Утверждённый flat-стек дашборда (D′): секции без рамок, разделители между блоками.
 */
export function MqxDashStack({ children, className = '' }) {
  const cls = ['mqx-dash-stack', className].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}
