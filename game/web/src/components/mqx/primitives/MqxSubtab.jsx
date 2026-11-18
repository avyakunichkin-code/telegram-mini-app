/** Вкладка-сегмент (финансы / капитал). */
export function MqxSubtab({ active = false, capital = false, className = '', type = 'button', ...props }) {
  const base = capital ? 'mqx-capital-subtab' : 'mqx-fin-subtab';
  return (
    <button
      type={type}
      className={[base, active && `${base}--active`, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
