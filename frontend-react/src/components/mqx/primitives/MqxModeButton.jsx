/** Переключатель режима (добавить / позиции, CTA в формах). */
export function MqxModeButton({ active = false, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={['mqx-capital-mode-btn', active && 'mqx-capital-mode-btn--active', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
