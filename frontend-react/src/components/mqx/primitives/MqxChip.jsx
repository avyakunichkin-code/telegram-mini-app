/** Чип-метка (XP outline, тег). `xpAmount` → «+120 XP». */
export function MqxChip({ xp = false, xpAmount, className = '', children, ...props }) {
  const label =
    children ??
    (xp && xpAmount != null && Number(xpAmount) > 0 ? `+${Math.round(Number(xpAmount))} XP` : xp ? 'XP' : null);

  return (
    <span className={['mqx-chip', xp && 'mqx-chip--xp', className].filter(Boolean).join(' ')} {...props}>
      {label}
    </span>
  );
}
