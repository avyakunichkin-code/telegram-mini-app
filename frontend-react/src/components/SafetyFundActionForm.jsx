import { InvestAmountControl } from './InvestAmountControl';
import { MoneyText } from './MoneyText';
import { MqxModeButton } from './mqx';

/** Пополнение / снятие подушки — компактная форма (как депозит / облигации). */
export function SafetyFundActionForm({
  mode,
  amount,
  maxAmount,
  onAmountChange,
  onSubmit,
  submitLabel,
  busy = false,
  autoFocus = false,
  embedded = false,
}) {
  const productId = mode === 'in' ? 'safety-in' : 'safety-out';
  const canSubmit = amount > 0 && amount <= maxAmount && !busy;
  const isIn = mode === 'in';

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
        <InvestAmountControl
          id={`safety-fund-amount-${mode}`}
          label="Сумма"
          amount={amount}
          maxAmount={maxAmount}
          onChange={onAmountChange}
          autoFocus={autoFocus}
          compact
          maxHint={
            <>
              {isIn ? 'На счёте' : 'В подушке'}: <MoneyText value={maxAmount} decimals={0} />
            </>
          }
          emptyHint={isIn ? 'Нет средств на счёте' : 'Подушка пуста'}
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
