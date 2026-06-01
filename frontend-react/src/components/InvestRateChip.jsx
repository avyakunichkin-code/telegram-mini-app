/** Годовая ставка: число без «%»; смысл — подпись «годовых» и цвет (получаем / платим). */
export function InvestRateChip({ annualRatePercent, productId = 'deposit', tone = 'pos' }) {
  const neg = tone === 'neg';
  return (
    <div
      className={`mqx-invest-rate mqx-invest-rate--chip mqx-invest-rate--${productId}${neg ? ' mqx-invest-rate--neg' : ''}`}
      aria-label={`Годовая ставка ${annualRatePercent}, ${neg ? 'платим' : 'получаем'} проценты`}
    >
      <span className={`mqx-invest-rate__val${neg ? ' mqx-invest-rate__val--neg' : ''}`}>{annualRatePercent}</span>
      <span className="mqx-invest-rate__hint">годовых</span>
    </div>
  );
}
