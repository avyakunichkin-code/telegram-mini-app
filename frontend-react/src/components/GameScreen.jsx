// src/components/GameScreen.jsx
import { useState } from 'react';
import {
  Button,
  Cell,
  Section,
  List,
  Spinner,
  AppRoot,
} from '@telegram-apps/telegram-ui';
import { useGame } from '../hooks/useGame';
import { formatTime } from '../utils';

export function GameScreen({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, finance, menu
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
  } = useGame();

  const [contributionAmount, setContributionAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  if (loading) return <Spinner />;
  if (error) return <div>Ошибка: {error}</div>;
  if (!overview || !timeStatus) return <div>Нет данных</div>;

  const remaining = timeStatus.remainingLocal ?? timeStatus.seconds_until_next_period;

  return (
    <div style={{ padding: '1rem' }}>
      {/* HUD */}
      <Section header="Игровое время">
        <Cell multiline>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Период #{timeStatus.period_index}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '1.5rem' }}>{formatTime(remaining)}</span>
            <div>
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
        <Cell>
          <Button stretched onClick={claimSalary}>Получить зарплату</Button>
        </Cell>
        <Cell>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="Сумма"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={() => {
              const amount = parseFloat(contributionAmount);
              if (!isNaN(amount) && amount > 0) contributeToSafetyFund(amount);
              setContributionAmount('');
            }}>В подушку</Button>
          </div>
        </Cell>
        <Cell>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="Сумма"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={() => {
              const amount = parseFloat(withdrawalAmount);
              if (!isNaN(amount) && amount > 0) withdrawFromSafetyFund(amount);
              setWithdrawalAmount('');
            }}>Снять с подушки</Button>
          </div>
        </Cell>
      </Section>

      {/* Вкладки */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <Button mode={activeTab === 'dashboard' ? 'filled' : 'outline'} onClick={() => setActiveTab('dashboard')}>Главная</Button>
        <Button mode={activeTab === 'finance' ? 'filled' : 'outline'} onClick={() => setActiveTab('finance')}>Финансы</Button>
        <Button mode={activeTab === 'menu' ? 'filled' : 'outline'} onClick={() => setActiveTab('menu')}>Меню</Button>
      </div>

      {/* Контент вкладок */}
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
                  <Button size="s" mode="destructive" onClick={() => API.deleteLiability(liability.id)}>Удалить</Button>
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
                  <Button size="s" mode="destructive" onClick={() => API.deleteAsset(asset.id)}>Удалить</Button>
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
            <Button stretched mode="plain" onClick={onLogout}>Выйти из аккаунта</Button>
          </Cell>
        </Section>
      )}
    </div>
  );
}