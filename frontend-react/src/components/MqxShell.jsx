/**
 * Общий каркас нового дизайна: mqx-screen → mqx-frame → (hero) → mqx-content.
 * Нужен для экранов вне GameScreen, где hero должен быть "над" контентом.
 */
export function MqxShell({ header, children, contentClassName = '' }) {
  return (
    <div className="mqx-screen">
      <div className="mqx-frame">
        {header}
        <div className={`mqx-content ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}

