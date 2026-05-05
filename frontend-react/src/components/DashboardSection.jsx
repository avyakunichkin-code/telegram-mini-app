import { Button, Cell, Section } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { showNotification } from './notifications';

export function DashboardSection({ overview, claimSalary, contributeToSafetyFund, withdrawFromSafetyFund, refreshOverview }) {
  const [contributionAmount, setContributionAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleContribute = async () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Введите корректную сумму', 'error');
      return;
    }
    setIsContributing(true);
    try {
      const result = await contributeToSafetyFund(amount);
      if (result && !result.error && result.status === 'success') {
        showNotification(result.message || `Подушка пополнена на ${amount} ₽`, 'success');
        setContributionAmount('');
      } else {
        const errorMsg = result?.detail || result?.message || 'Ошибка при пополнении подушки';
        showNotification(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Ошибка соединения с сервером', 'error');
    } finally {
      setIsContributing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Введите корректную сумму', 'error');
      return;
    }
    setIsWithdrawing(true);
    try {
      const result = await withdrawFromSafetyFund(amount);
      if (result && !result.error && result.status === 'success') {
        showNotification(result.message || `С подушки снято ${amount} ₽`, 'success');
        setWithdrawalAmount('');
      } else {
        const errorMsg = result?.detail || result?.message || 'Ошибка при снятии';
        showNotification(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Ошибка соединения с сервером', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!overview) return null;

  return (
    <>
      {/* Балансы */}
      <Section header="Финансы">
        <Cell multiline>
          <div>💰 Баланс: {overview.cash_balance.toFixed(2)} ₽</div>
          <div>🛡️ Подушка: {overview.safety_fund_balance.toFixed(2)} ₽</div>
          <div>📈 Чистый поток: {overview.net_monthly_cashflow.toFixed(2)} ₽</div>
        </Cell>
      </Section>

      {/* Действия периода */}
      <Section header="Действия периода">
        <Cell>
          <Button stretched onClick={claimSalary} disabled={isContributing || isWithdrawing}>
            Получить зарплату
          </Button>
        </Cell>
        <div style={{ margin: '12px 0' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="Сумма"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--tg-theme-hint-color)' }}
              disabled={isContributing}
            />
            <Button onClick={handleContribute} disabled={isContributing}>
              {isContributing ? '⏳' : 'В подушку'}
            </Button>
          </div>
        </div>
        <div style={{ margin: '12px 0' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="Сумма"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--tg-theme-hint-color)' }}
              disabled={isWithdrawing}
            />
            <Button onClick={handleWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? '⏳' : 'Снять с подушки'}
            </Button>
          </div>
        </div>
      </Section>

      {/* Финансовый обзор (сводка) */}
      <Section header="Финансовый обзор">
        <Cell multiline>
          <div>Уровень: {overview.gamification_level}</div>
          <div>Очки: {overview.score}/100</div>
          <div>Доход: {overview.total_monthly_income.toFixed(2)} ₽</div>
          <div>Платежи: {overview.total_monthly_liabilities_payment.toFixed(2)} ₽</div>
          <div>Обслуживание активов: {overview.total_monthly_assets_maintenance.toFixed(2)} ₽</div>
          <div>Долговая нагрузка: {overview.liabilities_to_income_ratio.toFixed(2)}%</div>
          <div>XP до след. уровня: {overview.xp_to_next_level}</div>
        </Cell>
      </Section>
    </>
  );
}