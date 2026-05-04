import { useState } from 'react';
import { Button, Input, Cell, Section, List } from '@telegram-apps/telegram-ui';
import { API } from '../api';

export function BaseParamsScreen({ profileName, mode, periodDuration, onBack, onGameStarted }) {
  console.log('BaseParamsScreen props:', { profileName, mode, periodDuration });
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
    console.log('Starting game with profileName:', profileName); // тут должно быть значение
    if (!profileName) {
        console.error('profileName is empty!');
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
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

      {/* Активы */}
      <Section header="Активы (расходы на обслуживание)">
        <List>
          {assets.map((asset, idx) => (
            <Cell
              key={idx}
              multiline
              after={<Button mode="destructive" size="s" onClick={() => removeAsset(idx)}>Удалить</Button>}
            >
              <div><strong>{asset.title}</strong></div>
              <div>Стоимость: {asset.asset_value} ₽</div>
              <div>Обслуживание: {asset.monthly_maintenance_cost} ₽/мес</div>
            </Cell>
          ))}
          <Cell>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              <Button onClick={addAsset}>+</Button>
            </div>
          </Cell>
        </List>
      </Section>

      {/* Обязательства */}
      <Section header="Обязательства (кредиты, ипотека)">
        <List>
          {liabilities.map((liab, idx) => (
            <Cell
              key={idx}
              multiline
              after={<Button mode="destructive" size="s" onClick={() => removeLiability(idx)}>Удалить</Button>}
            >
              <div><strong>{liab.title}</strong></div>
              <div>Долг: {liab.total_debt} ₽</div>
              <div>Ставка: {liab.annual_rate_percent}%</div>
              <div>Платёж: {liab.monthly_payment} ₽/мес</div>
            </Cell>
          ))}
          <Cell>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              <Button onClick={addLiability}>+</Button>
            </div>
          </Cell>
        </List>
      </Section>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
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