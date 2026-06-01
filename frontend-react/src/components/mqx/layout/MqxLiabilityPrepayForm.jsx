import { useEffect, useState } from 'react';
import { InvestAmountControl } from '../../InvestAmountControl';
import { MqxModeButton } from '../primitives/MqxModeButton';
import { MoneyText } from '../../MoneyText';

/** Частичное досрочное погашение (DL1). */
export function MqxLiabilityPrepayForm({
  liability,
  maxCash,
  onSubmit,
  busy = false,
}) {
  const maxPrepay = Math.max(
    0,
    Math.min(
      maxCash,
      Number(liability?.overdue_amount || 0) + Number(liability?.total_debt || 0),
    ),
  );
  const [amount, setAmount] = useState(maxPrepay > 0 ? Math.min(50_000, maxPrepay) : 0);

  useEffect(() => {
    setAmount((v) => Math.min(Math.max(0, v), maxPrepay));
  }, [maxPrepay, liability?.id]);

  const canSubmit = amount > 0 && amount <= maxPrepay && !busy;

  return (
    <article className="mqx-invest-form mqx-invest-form--d mqx-invest-form--embedded mqx-liab-prepay-form">
      <p className="mqx-liab-prepay-form__hint">
        Сначала гасится просрочка, затем тело долга. Платёж пересчитается по оставшемуся сроку.
      </p>
      <div className="mqx-liab-prepay-form__debt">
        Остаток тела: <MoneyText value={liability?.total_debt} decimals={0} />
        {Number(liability?.overdue_amount) > 0 ? (
          <>
            {' '}
            · просрочка: <MoneyText value={liability.overdue_amount} decimals={0} />
          </>
        ) : null}
      </div>
      <div className="mqx-invest-form__body">
        <InvestAmountControl
          id={`prepay-${liability?.id}`}
          label="Сумма досрочного погашения"
          amount={amount}
          maxAmount={maxPrepay}
          onChange={setAmount}
          compact
        />
        <MqxModeButton
          active
          className="mqx-invest-form__submit"
          disabled={!canSubmit}
          onClick={() => void onSubmit(amount)}
        >
          {busy ? 'Списание…' : 'Погасить досрочно'}
        </MqxModeButton>
      </div>
    </article>
  );
}
