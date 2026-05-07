import { Button, Cell, Section } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import {
  IconFlowStat,
  IconOverdueStat,
  IconShieldStat,
  IconWalletStat,
  IconTargetStat,
  IconStreakStat,
  IconStarStat,
  IconBarsStat,
  IconDownStat,
  IconWrenchStat,
  IconPercentStat,
  IconXpStat,
} from './icons/StatIcons';
import { IconCoins } from './icons/NavIcons';
import { MqStatRow } from './MqStatRow';

function coinsStatIcon(colorClass) {
  return (
    <span className={`mq-stat-row__mqcoin ${colorClass ?? ''}`} aria-hidden>
      <IconCoins size={17} />
    </span>
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
    <div className="mq-stack mq-stack-animate mq-stack--tight">
      <div className="mq-enter-item">
      <Section header="Финансы">
        <div className="mq-slot-intro">Балансы и потоки текущего периода без лишней болтовни.</div>
        <Cell multiline>
          <MqStatRow icon={<IconWalletStat />} label="Баланс">
            <MoneyText value={overview.cash_balance} />
          </MqStatRow>
          <MqStatRow icon={<IconShieldStat />} label="Подушка">
            <MoneyText value={overview.safety_fund_balance} />
          </MqStatRow>
          <MqStatRow icon={<IconFlowStat />} label="Чистый поток (мес.)">
            <MoneyText value={overview.net_monthly_cashflow} />
          </MqStatRow>
          {typeof overview.total_overdue_amount === 'number' && overview.total_overdue_amount > 0 && (
            <MqStatRow icon={<IconOverdueStat />} label="Просрочки">
              <MoneyText value={overview.total_overdue_amount} />
            </MqStatRow>
          )}
          <MqStatRow icon={<IconStreakStat />} label="Чистых месяцев подряд">
            <strong>{streak}</strong>
          </MqStatRow>
        </Cell>
      </Section>
      </div>

      {typeof overview.win_target_safety_fund === 'number' && overview.win_target_safety_fund > 0 && (
      <div className="mq-enter-item">
        <Section header="Цель (победа)">
          <div className="mq-slot-intro">Подушка к сумме месячных обязательств без просрочек и с неотрицательным потоком.</div>
          <Cell multiline>
            <MqStatRow icon={<IconTargetStat />} label="Подушка к цели">
              <>
                <MoneyText value={overview.safety_fund_balance} /> / <MoneyText value={overview.win_target_safety_fund} />
              </>
            </MqStatRow>
            <div className="mq-caption-muted" style={{ marginTop: 8 }}>
              Условия: нет просрочек и чистый поток ≥ 0.
            </div>
            <div className="mq-caption-muted">
              Статус:{' '}
              <strong>
                {overview.win_reached
                  ? 'победа'
                  : overview.win_ready
                    ? 'можно финишировать — добейте подушку'
                    : 'пока не выполнено'}
              </strong>
            </div>
          </Cell>
        </Section>
      </div>
      )}

      <div className="mq-enter-item">
      <Section header="Действия периода">
        <div className="mq-slot-intro">Что нужно успеть или нажать в этом игровом месяце.</div>
        <Cell multiline subtitle="Зарплата только по кнопке за период. Подушка — сумма и действие справа.">
          <div className="mq-period-actions">
            <Button
              stretched
              mode="filled"
              onClick={handleClaimSalary}
              disabled={isClaiming || isContributing || isWithdrawing}
            >
              {isClaiming ? <div className="spinner" /> : 'Получить зарплату'}
            </Button>
            <div className="mq-period-actions__row">
              <input
                type="number"
                placeholder="В подушку, ₽"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="mq-input-inline mq-input-inline--dense"
                disabled={isContributing}
              />
              <Button mode="filled" size="s" onClick={handleContribute} disabled={isContributing}>
                {isContributing ? <div className="spinner" /> : 'В подушку'}
              </Button>
            </div>
            <div className="mq-period-actions__row">
              <input
                type="number"
                placeholder="С подушки, ₽"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="mq-input-inline mq-input-inline--dense"
                disabled={isWithdrawing}
              />
              <Button mode="outline" size="s" onClick={handleWithdraw} disabled={isWithdrawing}>
                {isWithdrawing ? <div className="spinner" /> : 'Снять'}
              </Button>
            </div>
          </div>
        </Cell>
      </Section>
      </div>

      <div className="mq-enter-item">
      <Section header="Финансовый обзор">
        <div className="mq-slot-intro">Структура доходов и расходов в модели месяца — те же строки и иконки, что и блок «Финансы».</div>
        <Cell multiline>
          <MqStatRow dense icon={<IconStarStat />} label="Уровень геймификации">
            {overview.gamification_level}
          </MqStatRow>
          <MqStatRow dense icon={<IconBarsStat />} label="Очки (из 100)">
            {overview.score}
          </MqStatRow>
          <MqStatRow dense icon={coinsStatIcon('mq-stat-row__mqcoin--emerald')} label="Ежемесячный доход">
            <MoneyText value={overview.total_monthly_income} />
          </MqStatRow>
          <MqStatRow dense icon={<IconDownStat />} label="Платежи по долгам (мес.)">
            <MoneyText value={overview.total_monthly_liabilities_payment} />
          </MqStatRow>
          <MqStatRow dense icon={<IconWrenchStat />} label="Обслуживание активов">
            <MoneyText value={overview.total_monthly_assets_maintenance} />
          </MqStatRow>
          <MqStatRow dense icon={<IconPercentStat />} label="Долговая нагрузка к доходу">
            {overview.liabilities_to_income_ratio.toFixed(1)}%
          </MqStatRow>
          <MqStatRow dense icon={<IconXpStat />} label="XP до следующего уровня">
            {overview.xp_to_next_level}
          </MqStatRow>
        </Cell>
      </Section>
      </div>
    </div>
  );
}
