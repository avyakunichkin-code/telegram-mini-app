/**
 * Спокойная кнопка ★ BG-2: подпись слева, пояснение справа, лёгкий объём снизу.
 * variant="link" — текстовая («Выйти из аккаунта», «Назад»).
 */
export function MqxBoardButton({ children, hint = null, variant = 'plain', className = '', type = 'button', ...rest }) {
  const base = variant === 'link' ? 'mqx-pg-link' : 'mqx-pg-btn';
  return (
    <button type={type} className={['mqx-bg-btn', base, className].filter(Boolean).join(' ')} {...rest}>
      <span>{children}</span>
      {hint && variant !== 'link' ? <small>{hint}</small> : null}
    </button>
  );
}
