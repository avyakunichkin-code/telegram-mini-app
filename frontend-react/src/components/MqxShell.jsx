/**
 * Общий каркас нового дизайна: mqx-screen → mqx-frame → (hero) → mqx-content.
 * Нужен для экранов вне GameScreen, где hero должен быть "над" контентом.
 */
export function MqxShell({ header, children, contentClassName = '', frameClassName = '' }) {
  const frameCls = ['mqx-frame', frameClassName].filter(Boolean).join(' ');
  const contentCls = ['mqx-content', contentClassName].filter(Boolean).join(' ');

  return (
    <div className="mqx-screen">
      <div className={frameCls}>
        {header}
        <div className={contentCls}>{children}</div>
      </div>
    </div>
  );
}

