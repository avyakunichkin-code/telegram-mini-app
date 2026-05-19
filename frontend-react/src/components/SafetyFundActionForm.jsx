import { InvestAmountControl } from './InvestAmountControl';
import { MoneyText } from './MoneyText';
import { MqxModeButton } from './mqx';

function formatChipAmount(value) {
  const n = Math.floor(Number(value) || 0);
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}М`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}к`;
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function SafetyFundBalanceChip({ value, hint, variant }) {
  return (
    <div
      className={`mqx-invest-rate mqx-invest-rate--chip mqx-invest-rate--${variant}`}
      aria-label={`${hint}: ${value}`}
    >
      <span className="mqx-invest-rate__val">{formatChipAmount(value)}</span>
      <span className="mqx-invest-rate__hint">{hint}</span>
    </div>
  );
}

/** Пополнение / снятие подушки — тот же каркас, что депозит / облигации (variant D). */
export function SafetyFundActionForm({
  mode,
  amount,
  maxAmount,
  chipValue,
  chipHint,
  onAmountChange,
  onSubmit,
  submitLabel,
  busy = false,
}) {
  const productId = mode === 'in' ? 'safety-in' : 'safety-out';
  const canSubmit = amount > 0 && amount <= maxAmount && !busy;
  const isIn = mode === 'in';

  return (
    <article className={`mqx-invest-form mqx-invest-form--d mqx-invest-form--${productId}`}>
      <div className="mqx-invest-form__body">
        <InvestAmountControl
          id={`safety-fund-amount-${mode}`}
          amount={amount}
          maxAmount={maxAmount}
          onChange={onAmountChange}
          compact
          rateSlot={<SafetyFundBalanceChip value={chipValue} hint={chipHint} variant={productId} />}
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
          {submitLabel}
        </MqxModeButton>
      </div>
    </article>
  );
}
