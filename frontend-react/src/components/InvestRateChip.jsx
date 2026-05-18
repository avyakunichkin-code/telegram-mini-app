/** Фиксированная ставка: 12% / годовых (как variant B). */
export function InvestRateChip({ annualRatePercent, productId = 'deposit' }) {
  return (
    <div
      className={`mqx-invest-rate mqx-invest-rate--chip mqx-invest-rate--${productId}`}
      aria-label={`Ставка ${annualRatePercent} процентов годовых`}
    >
      <span className="mqx-invest-rate__val">{annualRatePercent}%</span>
      <span className="mqx-invest-rate__hint">годовых</span>
    </div>
  );
}
