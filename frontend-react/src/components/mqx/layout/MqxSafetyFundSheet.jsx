import { InvestProductForm } from '../../InvestProductForm';
import { MoneyText } from '../../MoneyText';
import { MqxCapitalSheet } from './MqxCapitalSheet';

const SHEET_COPY = {
  in: {
    title: 'Пополнить подушку',
    subtitle: 'Перевод со счёта в фин.подушку — запас на неожиданные расходы.',
    submitLabel: 'Перевести в подушку',
    productId: 'safety-in',
    maxHintLabel: 'На счёте',
    emptyHint: 'Нет средств на счёте',
  },
  out: {
    title: 'Снять с подушки',
    subtitle: 'Перевод с подушки на счёт для трат в этом периоде.',
    submitLabel: 'Снять на счёт',
    productId: 'safety-out',
    maxHintLabel: 'В подушке',
    emptyHint: 'Подушка пуста',
  },
};

/** Bottom sheet: пополнение / снятие (режим задаётся кнопкой на дашборде). */
export function MqxSafetyFundSheet({
  open,
  mode,
  onClose,
  amount,
  onAmountChange,
  onSubmit,
  busy = false,
  cashBalance = 0,
  safetyBalance = 0,
}) {
  const isIn = mode === 'in';
  const copy = isIn ? SHEET_COPY.in : SHEET_COPY.out;
  const maxAmount = isIn
    ? Math.max(0, Math.floor(Number(cashBalance) || 0))
    : Math.max(0, Math.floor(Number(safetyBalance) || 0));

  return (
    <MqxCapitalSheet
      open={open}
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={onClose}
      busy={busy}
      portal
      lockScroll
      titleId="mqx-safety-sheet-title"
      sheetClassName="mqx-sheet--amount"
    >
      <InvestProductForm
        embedded
        productId={copy.productId}
        amount={amount}
        maxCash={maxAmount}
        onAmountChange={onAmountChange}
        onSubmit={onSubmit}
        submitLabel={copy.submitLabel}
        busy={busy}
        autoFocus
        maxHint={
          <>
            {copy.maxHintLabel}: <MoneyText value={maxAmount} decimals={0} />
          </>
        }
        emptyHint={copy.emptyHint}
      />
    </MqxCapitalSheet>
  );
}
