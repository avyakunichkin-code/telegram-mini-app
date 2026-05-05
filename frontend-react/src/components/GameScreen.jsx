// src/components/GameScreen.jsx
import { useState } from 'react';
import {
  Button,
  Cell,
  Section,
  List,
  Spinner,
} from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { API } from '../api';
import { formatTime } from '../utils';
import { showNotification } from './notifications';

export function GameScreen({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingAction, setLoadingAction] = useState(false); // для блокировки кнопок
  // Дополнительные состояния
  const [isContributing, setIsContributing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const {
    overview,
    timeStatus,
    loading,
    error,
    setPlay,
    setPause,
    nextPeriod,
    claimSalary,
    contributeToSafetyFund,
    withdrawFromSafetyFund,
    refreshOverview,     // <-- добавлено
  } = useGame();

  const [contributionAmount, setContributionAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  if (loading) return <Spinner />;
  if (error) return <div>Ошибка: {error}</div>;
  if (!overview || !timeStatus) return <div>Нет данных</div>;

  const remaining = timeStatus.remainingLocal ?? timeStatus.seconds_until_next_period;

  const handleDeleteLiability = async (id) => {
    setLoadingAction(true);
    try {
      await API.deleteLiability(id);
      await refreshOverview();
    } catch (err) {
      console.error(err);
      showNotification('Ошибка при удалении', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    setLoadingAction(true);
    try {
      await API.deleteAsset(id);
      await refreshOverview();
    } catch (err) {
      console.error(err);
      showNotification('Ошибка при удалении', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Обработчик взноса в подушку
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
      } else {
        // Извлекаем детали ошибки
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

  // Обработчик снятия с подушки
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

  return (
    <div style={{ padding: '1rem', paddingBottom: '80px' }}> {/* отступ для меню */}
      {/* HUD */}
      <Section header="Игровое время">
        <Cell multiline>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Период #{timeStatus.period_index}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '1.5rem' }}>{formatTime(remaining)}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="s" onClick={setPlay} disabled={timeStatus.time_state === 'play'}>Play</Button>
              <Button size="s" onClick={setPause} disabled={timeStatus.time_state === 'pause'}>Pause</Button>
              <Button size="s" onClick={nextPeriod}>Next</Button>
            </div>
          </div>
        </Cell>
      </Section>

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
        {/* Зарплата – можно оставить в Cell, так как это одна кнопка */}
        <Cell>
          <Button stretched onClick={claimSalary} disabled={loadingAction}>
            Получить зарплату
          </Button>
        </Cell>

        {/* Взнос в подушку */}
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

        {/* Снятие с подушки */}
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

      {/* Дополнительный контент (вкладки) будет внутри основного потока, а меню снизу – фиксированное */}
      <div className="game-content" style={{ marginBottom: '80px' }}>
        {activeTab === 'dashboard' && (
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
        )}

        {activeTab === 'finance' && (
          <>
            <Section header="Обязательства">
              <List>
                {overview.liabilities.length === 0 && <Cell>Нет обязательств</Cell>}
                {overview.liabilities.map(liability => (
                  <Cell key={liability.id} multiline after={
                    <Button size="s" mode="destructive" onClick={() => handleDeleteLiability(liability.id)} disabled={loadingAction}>Удалить</Button>
                  }>
                    <div><strong>{liability.title}</strong></div>
                    <div>Долг: {liability.total_debt.toFixed(2)} ₽</div>
                    <div>Ставка: {liability.annual_rate_percent}%</div>
                    <div>Платёж: {liability.monthly_payment.toFixed(2)} ₽</div>
                  </Cell>
                ))}
              </List>
            </Section>
            <Section header="Активы">
              <List>
                {overview.assets.length === 0 && <Cell>Нет активов</Cell>}
                {overview.assets.map(asset => (
                  <Cell key={asset.id} multiline after={
                    <Button size="s" mode="destructive" onClick={() => handleDeleteAsset(asset.id)} disabled={loadingAction}>Удалить</Button>
                  }>
                    <div><strong>{asset.title}</strong></div>
                    <div>Стоимость: {asset.asset_value.toFixed(2)} ₽</div>
                    <div>Обслуживание: {asset.monthly_maintenance_cost.toFixed(2)} ₽</div>
                  </Cell>
                ))}
              </List>
            </Section>
          </>
        )}

        {activeTab === 'menu' && (
          <Section header="Меню">
            <Cell>
              <Button stretched mode="plain" onClick={onLogout} disabled={loadingAction}>Выйти из аккаунта</Button>
            </Cell>
          </Section>
        )}
      </div>

      {/* Фиксированное нижнее меню */}
      <div className="bottom-nav">
        <Button mode={activeTab === 'dashboard' ? 'filled' : 'outline'} onClick={() => setActiveTab('dashboard')}>Главная</Button>
        <Button mode={activeTab === 'finance' ? 'filled' : 'outline'} onClick={() => setActiveTab('finance')}>Финансы</Button>
        <Button mode={activeTab === 'menu' ? 'filled' : 'outline'} onClick={() => setActiveTab('menu')}>Меню</Button>
      </div>
    </div>
  );
}