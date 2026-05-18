import { InvestAmountControl } from './InvestAmountControl';
import { InvestRateChip } from './InvestRateChip';
import { MqxModeButton } from './mqx';

/** Форма депозита / облигаций — variant D (компактная строка) + chip ставки. */
export function InvestProductForm({
  productId,
  productTitle,
  amount,
  maxCash,
  annualRatePercent,
  onAmountChange,
  onSubmit,
  submitLabel = 'Открыть',
  amountLabel = 'Сумма',
  showTitle = false,
}) {
  const canSubmit = amount > 0 && amount <= maxCash;

  return (
    <article className={`mqx-invest-form mqx-invest-form--d mqx-invest-form--${productId}`}>
      <div className="mqx-invest-form__body">
        {showTitle && productTitle ? (
          <div className="mqx-invest-form__title">{productTitle}</div>
        ) : null}
        <InvestAmountControl
          id={`invest-amount-${productId}`}
          label={amountLabel}
          amount={amount}
          maxAmount={maxCash}
          onChange={onAmountChange}
          compact
          rateSlot={<InvestRateChip annualRatePercent={annualRatePercent} productId={productId} />}
        />
        <MqxModeButton
          active
          className="mqx-invest-form__submit"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {submitLabel}
        </MqxModeButton>
      </div>
    </article>
  );
}
