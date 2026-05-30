import { InvestAmountControl } from './InvestAmountControl';
import { MoneyText } from './MoneyText';
import { MqxModeButton } from './mqx';
import { safetyFundAmountPresets } from '../utils/safetyFundAmount';

/** Пополнение / снятие подушки — сумма, пресеты, подтверждение. */
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
  const max = Math.max(0, Math.floor(Number(maxAmount) || 0));
  const presets = safetyFundAmountPresets(max);
  const value = Math.max(0, Math.floor(Number(amount) || 0));

  return (
    <article
      className={[
        'mqx-invest-form',
        'mqx-invest-form--d',
        `mqx-invest-form--${productId}`,
        embedded && 'mqx-invest-form--embedded',
        'mqx-safety-form',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mqx-invest-form__body">
        {presets.length > 0 ? (
          <div className="mqx-safety-presets" role="group" aria-label="Быстрый выбор суммы">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`mqx-safety-preset${value === preset.value ? ' is-active' : ''}`}
                disabled={busy}
                aria-pressed={value === preset.value}
                onClick={() => onAmountChange(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        ) : null}

        <InvestAmountControl
          id={`safety-fund-amount-${mode}`}
          label="Сумма"
          amount={amount}
          maxAmount={maxAmount}
          onChange={onAmountChange}
          autoFocus={autoFocus}
          compact={false}
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
