/**
 * Единая «рамка» нового дизайна (light premium) для всех экранов.
 * Использует стили `.mqx-screen`, `.mqx-frame`, `.mqx-content` из `src/index.css`.
 */
export function MqxFrame({ children, contentClassName = '' }) {
  return (
    <div className="mqx-screen">
      <div className="mqx-frame">
        <div className={`mqx-content ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}

