import { useId } from 'react';

import coinsIcon from '../../../assets/actions/action-coins.png';
import investIcon from '../../../assets/actions/action-invest.png';
import shieldIcon from '../../../assets/actions/action-shield.png';
import withdrawIcon from '../../../assets/actions/action-withdraw.png';
import { ACTIONS_OF_TURN } from '../../../constants/turnCopy';
import { MoneyText } from '../../MoneyText';
import { MqxButton } from '../primitives/MqxButton';

function ActionButton({ label, icon, className = '', ...buttonProps }) {
  return (
    <button type="button" className={['mqx-bg-btn', 'mqx-bg-act', className].filter(Boolean).join(' ')} {...buttonProps}>
      <span className="mqx-bg-act__ico" aria-hidden="true">
        {icon}
      </span>
      <span className="mqx-bg-act__label">{label}</span>
    </button>
  );
}

function ActionIcon({ src }) {
  return <img className="mqx-bg-action-icon" src={src} alt="" />;
}

/**
 * Кнопка зарплаты ★ BG-3: пока не забрана — главная золотая на всю ширину с суммой;
 * после выплаты — спокойная пунктирная строка «Зарплата получена».
 */
function SalaryButton({ hot, claimed, celebrate, amount, disabled, onClick }) {
  const cls = [
    'mqx-bg-btn',
    'mqx-bg-salary',
    hot && !claimed ? 'mqx-bg-salary--hot' : 'mqx-bg-salary--quiet',
    celebrate ? 'mqx-juice-chip--celebrate' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const label = claimed ? 'Зарплата получена' : 'Зарплата';
  const showAmount = !claimed && Number(amount) > 0;

  return (
    <MqxButton
      variant={hot && !claimed ? "turn" : "secondary"}
      className={cls}
      disabled={disabled}
      data-onboarding-anchor="salary"
      title={claimed ? 'Зарплата за этот ход уже получена' : hot ? 'Получить зарплату за текущий ход' : 'Зарплата в этом ходе недоступна'}
      aria-label={claimed ? 'Зарплата, уже получена' : hot ? 'Зарплата, получить' : 'Зарплата, недоступна'}
      onClick={onClick}
    >
      <ActionIcon src={coinsIcon} />
      <span className="mqx-bg-salary__label">{label}</span>
      {showAmount ? (
        <span className="mqx-bg-salary__sum">
          +<MoneyText value={amount} decimals={0} />
        </span>
      ) : claimed ? (
        <span className="mqx-bg-salary__sum" aria-hidden="true">
          ✓
        </span>
      ) : null}
    </MqxButton>
  );
}

/** Четыре действия хода в сетке 2 × 2. */
export function MqxPeriodActions({
  salaryDisabled = false,
  salaryHot = false,
  salaryClaimed = false,
  salaryCelebrate = false,
  salaryAmount = 0,
  busy = false,
  activeMoneyMode = null,
  onSalary,
  onContribute,
  onWithdraw,
  onInvest,
}) {
  const titleId = useId();

  return (
    <section className="mqx-bg-acts" aria-labelledby={titleId}>
      <h2 id={titleId} className="mqx-bg-sr-only">
        {ACTIONS_OF_TURN}
      </h2>
      <div className="mqx-bg-acts__row">
        <SalaryButton
          hot={salaryHot}
          claimed={salaryClaimed}
          celebrate={salaryCelebrate}
          amount={salaryAmount}
          disabled={busy || salaryDisabled}
          onClick={onSalary}
        />
        <ActionButton
          label="Вложить"
          disabled={busy || !onInvest}
          title="Открыть раздел инвестиций"
          aria-label="Вложить"
          onClick={onInvest}
          icon={<ActionIcon src={investIcon} />}
        />
        <ActionButton
          label="В подушку"
          disabled={busy}
          className={activeMoneyMode === 'in' ? 'mqx-bg-act--active' : ''}
          data-onboarding-anchor="cushion"
          data-money-trigger="in"
          title="Перевести деньги со счёта в подушку"
          aria-label="Положить в подушку"
          onClick={onContribute}
          icon={<ActionIcon src={shieldIcon} />}
        />

        <ActionButton
          label="Из подушки"
          disabled={busy}
          className={activeMoneyMode === 'out' ? 'mqx-bg-act--active' : ''}
          data-money-trigger="out"
          title="Снять деньги с подушки на счёт"
          aria-label="Снять из подушки"
          onClick={onWithdraw}
          icon={<ActionIcon src={withdrawIcon} />}
        />

      </div>
    </section>
  );
}
