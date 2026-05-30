import { MoneyText } from '../../MoneyText';
import { SafetyFundActionForm } from '../../SafetyFundActionForm';
import { MqxSubtab } from '../primitives/MqxSubtab';
import { SAFETY_FUND_BASELINE_HINT } from '../../../utils/safetyFundFill';

function TransferEndpoint({ label, value, accent, afterValue }) {
  const showAfter = afterValue != null && afterValue !== value;
  return (
    <div className={`mqx-safety-flow__node mqx-safety-flow__node--${accent}`}>
      <span className="mqx-safety-flow__node-label">{label}</span>
      <span className="mqx-safety-flow__node-value">
        <MoneyText value={value} decimals={0} />
      </span>
      {showAfter ? (
        <span className="mqx-safety-flow__node-after" aria-hidden="true">
          → <MoneyText value={afterValue} decimals={0} />
        </span>
      ) : null}
    </div>
  );
}

/** Bottom sheet: пополнение / снятие подушки. */
export function MqxSafetyFundSheet({
  open,
  mode,
  onModeChange,
  onClose,
  amount,
  onAmountChange,
  onSubmit,
  busy = false,
  cashBalance = 0,
  safetyBalance = 0,
  cushionFillPercent = null,
}) {
  if (!open) return null;

  const isIn = mode === 'in';
  const cash = Math.max(0, Math.floor(Number(cashBalance) || 0));
  const safety = Math.max(0, Math.floor(Number(safetyBalance) || 0));
  const maxAmount = isIn ? cash : safety;
  const amt = Math.max(0, Math.floor(Number(amount) || 0));

  const afterCash = isIn ? cash - amt : cash + amt;
  const afterSafety = isIn ? safety + amt : safety - amt;

  const submitLabel = isIn ? 'Перевести в подушку' : 'Снять на счёт';
  const titleId = 'mqx-safety-sheet-title';

  return (
    <div className="mqx-sheet-root" role="presentation">
      <button
        type="button"
        className="mqx-sheet-scrim"
        aria-label="Закрыть"
        onClick={busy ? undefined : onClose}
      />
      <section
        className="mqx-sheet mqx-sheet--safety"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="mqx-sheet__close"
          onClick={busy ? undefined : onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2 id={titleId} className="mqx-sheet__title">
          Фин.подушка
        </h2>
        <p className="mqx-sheet__sub">
          {cushionFillPercent != null
            ? `Запас ${cushionFillPercent}% от нормы (${SAFETY_FUND_BASELINE_HINT})`
            : 'Перевод между счётом и запасом на чёрный день'}
        </p>

        <div className="mqx-fin-subtabs-row mqx-safety-sheet__tabs" role="tablist" aria-label="Направление перевода">
          <MqxSubtab
            active={isIn}
            role="tab"
            aria-selected={isIn}
            disabled={busy}
            onClick={() => onModeChange?.('in')}
          >
            Пополнить
          </MqxSubtab>
          <MqxSubtab
            active={!isIn}
            role="tab"
            aria-selected={!isIn}
            disabled={busy}
            onClick={() => onModeChange?.('out')}
          >
            Снять
          </MqxSubtab>
        </div>

        <div className="mqx-sheet__body">
          <div className="mqx-safety-flow" aria-label={isIn ? 'Со счёта в подушку' : 'С подушки на счёт'}>
            {isIn ? (
              <>
                <TransferEndpoint label="Счёт" value={cash} accent="violet" afterValue={amt > 0 ? afterCash : null} />
                <span className="mqx-safety-flow__arrow" aria-hidden="true">
                  →
                </span>
                <TransferEndpoint
                  label="Подушка"
                  value={safety}
                  accent="emerald"
                  afterValue={amt > 0 ? afterSafety : null}
                />
              </>
            ) : (
              <>
                <TransferEndpoint
                  label="Подушка"
                  value={safety}
                  accent="emerald"
                  afterValue={amt > 0 ? afterSafety : null}
                />
                <span className="mqx-safety-flow__arrow" aria-hidden="true">
                  →
                </span>
                <TransferEndpoint label="Счёт" value={cash} accent="violet" afterValue={amt > 0 ? afterCash : null} />
              </>
            )}
          </div>

          <SafetyFundActionForm
            mode={mode}
            amount={amount}
            maxAmount={maxAmount}
            onAmountChange={onAmountChange}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
            busy={busy}
            autoFocus
            embedded
          />
        </div>
      </section>
    </div>
  );
}
