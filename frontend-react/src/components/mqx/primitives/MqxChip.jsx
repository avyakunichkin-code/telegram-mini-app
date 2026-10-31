/** Чип-метка (тег). XP-вариант снят вместе с механикой опыта (ADR-003). */
export function MqxChip({ className = '', children, ...props }) {
  return (
    <span className={['mqx-chip', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  );
}
