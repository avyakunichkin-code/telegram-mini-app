import { Button, Cell, Section } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import { IconFlowStat, IconOverdueStat, IconShieldStat, IconWalletStat, IconTargetStat, IconStreakStat } from './icons/StatIcons';

function StatRow({ icon, label, children }) {
  return (
    <div className="mq-stat-row">
      <span className="mq-stat-row__ico" aria-hidden>{icon}</span>
      <div className="mq-stat-row__body">
        <span className="mq-stat-row__label">{label}</span>
        <span className="mq-stat-row__value">{children}</span>
      </div>
    </div>
  );
}

export function DashboardSection({ overview, claimSalary, contributeToSafetyFund, withdrawFromSafetyFund, refreshOverview }) {
  const [contributionAmount, setContributionAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleClaimSalary = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const result = await claimSalary();
      if (result && result.status === 'success') {
        showNotification(result.message || 'Зарплата получена!', 'success');
        await refreshOverview();
      } else {
        showNotification('Неизвестная ошибка', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification(err?.detail || err?.message || 'Ошибка соединения с сервером', 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleContribute = async () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Введите корректную сумму', 'error');
      return;
    }
    setIsContributing(true);
    try {
      const result = await contributeToSafetyFund(amount);
      if (result && result.status === 'success') {
        showNotification(result.message || `Подушка пополнена на ${amount} ₽`, 'success');
        setContributionAmount('');
        await refreshOverview();
      } else {
        const errorMsg = result?.detail || result?.message || 'Ошибка при пополнении подушки';
        showNotification(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification(err?.detail || err?.message || 'Ошибка соединения с сервером', 'error');
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
      if (result && result.status === 'success') {
        showNotification(result.message || `С подушки снято ${amount} ₽`, 'success');
        setWithdrawalAmount('');
        await refreshOverview();
      } else {
        const errorMsg = result?.detail || result?.message || 'Ошибка при снятии';
        showNotification(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification(err?.detail || err?.message || 'Ошибка соединения с сервером', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!overview) return null;

  const streak = overview.clean_period_streak ?? 0;

  return (
    <>
      <Section header="Финансы">
        <Cell multiline>
          <StatRow icon={<IconWalletStat />} label="Баланс">
            <MoneyText value={overview.cash_balance} />
          </StatRow>
          <StatRow icon={<IconShieldStat />} label="Подушка">
            <MoneyText value={overview.safety_fund_balance} />
          </StatRow>
          <StatRow icon={<IconFlowStat />} label="Чистый поток (мес.)">
            <MoneyText value={overview.net_monthly_cashflow} />
          </StatRow>
          {typeof overview.total_overdue_amount === 'number' && overview.total_overdue_amount > 0 && (
            <StatRow icon={<IconOverdueStat />} label="Просрочки">
              <MoneyText value={overview.total_overdue_amount} />
            </StatRow>
          )}
          <StatRow icon={<IconStreakStat />} label="Чистых месяцев подряд">
            <strong>{streak}</strong>
          </StatRow>
        </Cell>
      </Section>

      {typeof overview.win_target_safety_fund === 'number' && overview.win_target_safety_fund > 0 && (
        <Section header="Цель (победа)">
          <Cell multiline>
            <StatRow icon={<IconTargetStat />} label="Подушка к цели">
              <>
                <MoneyText value={overview.safety_fund_balance} /> / <MoneyText value={overview.win_target_safety_fund} />
              </>
            </StatRow>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.42 }}>
              Условия: нет просрочек и чистый поток ≥ 0.
            </div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>
              Статус:{' '}
              {overview.win_reached
                ? 'победа'
                : overview.win_ready
                  ? 'можно финишировать — добейте подушку'
                  : 'пока не выполнено'}
            </div>
          </Cell>
        </Section>
      )}

      <Section header="Действия периода">
        <Cell>
          <Button stretched onClick={handleClaimSalary} disabled={isClaiming || isContributing || isWithdrawing}>
            {isClaiming ? <div className="spinner" /> : 'Получить зарплату'}
          </Button>
        </Cell>
        <div style={{ margin: '12px 0' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="Сумма"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="mq-input-inline"
              disabled={isContributing}
            />
            <Button onClick={handleContribute} disabled={isContributing}>
              {isContributing ? <div className="spinner" /> : 'В подушку'}
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
              className="mq-input-inline"
              disabled={isWithdrawing}
            />
            <Button onClick={handleWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? <div className="spinner" /> : 'Снять с подушки'}
            </Button>
          </div>
        </div>
      </Section>

      <Section header="Финансовый обзор">
        <Cell multiline>
          <div>Уровень: {overview.gamification_level}</div>
          <div>Очки: {overview.score}/100</div>
          <div>
            Доход: <MoneyText value={overview.total_monthly_income} />
          </div>
          <div>
            Платежи: <MoneyText value={overview.total_monthly_liabilities_payment} />
          </div>
          <div>
            Обслуживание активов: <MoneyText value={overview.total_monthly_assets_maintenance} />
          </div>
          <div>Долговая нагрузка: {overview.liabilities_to_income_ratio.toFixed(2)}%</div>
          <div>XP до след. уровня: {overview.xp_to_next_level}</div>
        </Cell>
      </Section>
    </>
  );
}
