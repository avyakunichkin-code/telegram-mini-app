import { MoneyText } from './MoneyText';
import { clampInvestAmount, investAmountStep } from '../constants/investProducts';

/**
 * Сумма: подчёркнутый ввод + ползунок 0 … maxAmount.
 * compact + rateSlot — строка D: сумма слева, chip ставки справа.
 */
export function InvestAmountControl({
  id,
  label = 'Сумма',
  amount,
  maxAmount,
  onChange,
  compact = false,
  rateSlot = null,
}) {
  const max = Math.max(0, Math.floor(Number(maxAmount) || 0));
  const value = clampInvestAmount(amount, max);
  const step = investAmountStep(max);
  const disabled = max <= 0;

  const setValue = (next) => {
    onChange(clampInvestAmount(next, max));
  };

  const field = (
    <div className="mqx-invest-amount__field">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="mqx-invest-amount__input"
        value={value === 0 ? '' : String(value)}
        placeholder="0"
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          setValue(raw === '' ? 0 : Number(raw));
        }}
      />
      <span className="mqx-invest-amount__unit" aria-hidden="true">
        ₽
      </span>
    </div>
  );

  return (
    <div className={`mqx-invest-amount${compact ? ' mqx-invest-amount--compact' : ''}`}>
      {compact ? (
        <div className="mqx-invest-amount__row">
          <div className="mqx-invest-amount__row-main">
            {!rateSlot ? (
              <label className="mqx-invest-amount__label" htmlFor={id}>
                {label}
              </label>
            ) : null}
            {field}
          </div>
          {rateSlot}
        </div>
      ) : (
        <>
          <label className="mqx-invest-amount__label" htmlFor={id}>
            {label}
          </label>
          {field}
        </>
      )}
      <input
        type="range"
        className="mqx-invest-slider"
        min={0}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={`${label}: от 0 до ${max}`}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div className="mqx-invest-amount__range-hint">
        <span>0</span>
        <span className="mqx-invest-amount__max">
          {disabled ? (
            'Нет средств на счёте'
          ) : (
            <>
              На счёте: <MoneyText value={max} decimals={0} />
            </>
          )}
        </span>
      </div>
    </div>
  );
}
