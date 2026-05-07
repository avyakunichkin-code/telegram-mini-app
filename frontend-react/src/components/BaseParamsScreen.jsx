import { useState } from 'react';
import { Button, Input, Cell, Section, List } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';

export function BaseParamsScreen({ profileName, mode, periodDuration, onBack, onGameStarted }) {
  const [cashBalance, setCashBalance] = useState(0);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);

  // Состояния для формы добавления актива
  const [newAsset, setNewAsset] = useState({
    title: '',
    asset_value: 0,
    monthly_maintenance_cost: 0,
  });

  // Состояния для формы добавления обязательства
  const [newLiability, setNewLiability] = useState({
    title: '',
    total_debt: 0,
    annual_rate_percent: 0,
    monthly_payment: 0,
  });

  const [loading, setLoading] = useState(false);

  // Добавление актива
  const addAsset = () => {
    if (!newAsset.title.trim()) return;
    setAssets([...assets, { ...newAsset }]);
    setNewAsset({ title: '', asset_value: 0, monthly_maintenance_cost: 0 });
  };

  const removeAsset = (index) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  // Добавление обязательства
  const addLiability = () => {
    if (!newLiability.title.trim()) return;
    setLiabilities([...liabilities, { ...newLiability }]);
    setNewLiability({ title: '', total_debt: 0, annual_rate_percent: 0, monthly_payment: 0 });
  };

  const removeLiability = (index) => {
    setLiabilities(liabilities.filter((_, i) => i !== index));
  };

  const handleStart = async () => {
    if (!profileName) {
      showNotification('Не задано название профиля. Вернитесь назад и введите его.', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await API.startNewGame({
        profile_name: profileName,
        mode,
        period_duration_seconds: periodDuration,
        cash_balance: cashBalance,
        monthly_salary: monthlySalary,
        assets,
        liabilities,
      });
      if (result) {
        onGameStarted(result);
      }
    } catch (error) {
      showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mq-page mq-stack mq-stack-animate mq-stack--tight"
      style={{ padding: '12px 12px calc(24px + env(safe-area-inset-bottom, 0))' }}
    >
      <div className="mq-page__decor" aria-hidden />
      <div className="mq-enter-item">
      <Section header="Базовые параметры">
        <Cell>
          <Input
            header="Стартовый баланс (₽)"
            type="number"
            value={cashBalance}
            onChange={(e) => setCashBalance(Number(e.target.value))}
          />
        </Cell>
        <Cell>
          <Input
            header="Ежемесячная зарплата (₽)"
            type="number"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(Number(e.target.value))}
          />
        </Cell>
      </Section>
      </div>

      {/* Активы */}
      <div className="mq-enter-item">
      <Section header="Активы (расходы на обслуживание)">
        <List>
          {assets.map((asset, idx) => (
            <Cell
              key={idx}
              multiline
              after={<Button mode="destructive" size="s" onClick={() => removeAsset(idx)}>Удалить</Button>}
            >
              <div><strong>{asset.title}</strong></div>
              <div>Стоимость: <MoneyText value={asset.asset_value} decimals={0} /></div>
              <div>Обслуживание: <MoneyText value={asset.monthly_maintenance_cost} decimals={0} /> / мес</div>
            </Cell>
          ))}
          <Cell>
            <div className="mq-inline-field-row">
              <Input
                placeholder="Название"
                value={newAsset.title}
                onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                style={{ flex: 2 }}
              />
              <Input
                placeholder="Стоимость"
                type="number"
                value={newAsset.asset_value}
                onChange={(e) => setNewAsset({ ...newAsset, asset_value: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <Input
                placeholder="Обслуживание"
                type="number"
                value={newAsset.monthly_maintenance_cost}
                onChange={(e) => setNewAsset({ ...newAsset, monthly_maintenance_cost: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <Button className="mq-chip-btn" onClick={addAsset}>+</Button>
            </div>
          </Cell>
        </List>
      </Section>
      </div>

      {/* Обязательства */}
      <div className="mq-enter-item">
      <Section header="Обязательства (кредиты, ипотека)">
        <List>
          {liabilities.map((liab, idx) => (
            <Cell
              key={idx}
              multiline
              after={<Button mode="destructive" size="s" onClick={() => removeLiability(idx)}>Удалить</Button>}
            >
              <div><strong>{liab.title}</strong></div>
              <div>Долг: <MoneyText value={liab.total_debt} /></div>
              <div>Ставка: {liab.annual_rate_percent}%</div>
              <div>Платёж: <MoneyText value={liab.monthly_payment} /> / мес</div>
            </Cell>
          ))}
          <Cell>
            <div className="mq-inline-field-row">
              <Input
                placeholder="Название"
                value={newLiability.title}
                onChange={(e) => setNewLiability({ ...newLiability, title: e.target.value })}
                style={{ flex: 2 }}
              />
              <Input
                placeholder="Сумма долга"
                type="number"
                value={newLiability.total_debt}
                onChange={(e) => setNewLiability({ ...newLiability, total_debt: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <Input
                placeholder="Годовой %"
                type="number"
                value={newLiability.annual_rate_percent}
                onChange={(e) => setNewLiability({ ...newLiability, annual_rate_percent: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <Input
                placeholder="Платёж"
                type="number"
                value={newLiability.monthly_payment}
                onChange={(e) => setNewLiability({ ...newLiability, monthly_payment: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <Button className="mq-chip-btn" onClick={addLiability}>+</Button>
            </div>
          </Cell>
        </List>
      </Section>
      </div>

      <div className="mq-enter-item mq-actions-stack" style={{ marginTop: '0.75rem' }}>
        <Button stretched onClick={handleStart} disabled={loading}>
          {loading ? 'Запуск...' : 'Старт игры'}
        </Button>
        <Button stretched mode="plain" onClick={onBack}>
          Назад
        </Button>
      </div>
    </div>
  );
}