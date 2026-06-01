import { InvestAmountControl } from './InvestAmountControl';
import { InvestRateChip } from './InvestRateChip';
import { MoneyText } from './MoneyText';
import { MqxModeButton } from './mqx';

/** Форма суммы: депозит / облигации / подушка (variant D, compact). */
export function InvestProductForm({
  productId,
  productTitle,
  amount,
  maxCash,
  annualRatePercent,
  rateSlot: rateSlotProp,
  onAmountChange,
  onSubmit,
  submitLabel = 'Открыть',
  amountLabel = 'Сумма',
  showTitle = false,
  embedded = false,
  maxHint = null,
  emptyHint = 'Нет средств на счёте',
  busy = false,
  autoFocus = false,
}) {
  const canSubmit = amount > 0 && amount <= maxCash && !busy;

  const rateSlot =
    rateSlotProp !== undefined
      ? rateSlotProp
      : annualRatePercent != null
        ? <InvestRateChip annualRatePercent={annualRatePercent} productId={productId} />
        : null;

  return (
    <article
      className={[
        'mqx-invest-form',
        'mqx-invest-form--d',
        `mqx-invest-form--${productId}`,
        embedded && 'mqx-invest-form--embedded',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
          autoFocus={autoFocus}
          rateSlot={rateSlot}
          maxHint={
            maxHint ?? (
              <>
                На счёте: <MoneyText value={maxCash} decimals={0} />
              </>
            )
          }
          emptyHint={emptyHint}
        />
        <MqxModeButton
          active
          className="mqx-invest-form__submit"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {busy ? '…' : submitLabel}
        </MqxModeButton>
      </div>
    </article>
  );
}
