import { useState } from 'react';
import { Button, Cell, Section, List } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import { sanitizeIntInput, sanitizeDecimalInput, parseNumLoose } from '../utils/numberFields';
import { MqxFrame } from './MqxFrame';

export function BaseParamsScreen({ profileName, saveKind = 'game', templateKey = null, periodDuration, onBack, onGameStarted }) {
  const [cashStr, setCashStr] = useState('');
  const [salaryStr, setSalaryStr] = useState('');

  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);

  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetValueStr, setNewAssetValueStr] = useState('');
  const [newAssetMaintStr, setNewAssetMaintStr] = useState('');

  const [newLiabTitle, setNewLiabTitle] = useState('');
  const [newDebtStr, setNewDebtStr] = useState('');
  const [newRateStr, setNewRateStr] = useState('');
  const [newPaymentStr, setNewPaymentStr] = useState('');

  const [loading, setLoading] = useState(false);

  const addAsset = () => {
    if (!newAssetTitle.trim()) {
      showNotification('Укажите название актива', 'error');
      return;
    }
    setAssets([
      ...assets,
      {
        title: newAssetTitle.trim(),
        asset_value: parseNumLoose(newAssetValueStr, 0),
        monthly_maintenance_cost: parseNumLoose(newAssetMaintStr, 0),
      },
    ]);
    setNewAssetTitle('');
    setNewAssetValueStr('');
    setNewAssetMaintStr('');
  };

  const removeAsset = (index) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const addLiability = () => {
    if (!newLiabTitle.trim()) {
      showNotification('Укажите название обязательства', 'error');
      return;
    }
    setLiabilities([
      ...liabilities,
      {
        title: newLiabTitle.trim(),
        total_debt: parseNumLoose(newDebtStr, 0),
        annual_rate_percent: parseNumLoose(newRateStr, 0),
        monthly_payment: parseNumLoose(newPaymentStr, 0),
      },
    ]);
    setNewLiabTitle('');
    setNewDebtStr('');
    setNewRateStr('');
    setNewPaymentStr('');
  };

  const removeLiability = (index) => {
    setLiabilities(liabilities.filter((_, i) => i !== index));
  };

  const handleStart = async () => {
    if (!profileName) {
      showNotification('Не задано название профиля. Вернитесь назад и введите его.', 'error');
      return;
    }
    if (!templateKey && (!salaryStr || salaryStr.trim() === '')) {
      showNotification('Укажите зарплату (в этом MVP она фиксированная)', 'error');
      return;
    }
    const cash_balance = parseNumLoose(cashStr, 0);
    const monthly_salary = parseNumLoose(salaryStr, 0);
    setLoading(true);
    try {
      const basePayload = {
        profile_name: profileName,
        save_kind: saveKind || 'game',
        period_duration_seconds: periodDuration,
      };
      const result = templateKey
        ? await API.startNewGame({
            ...basePayload,
            template_key: templateKey,
          })
        : await API.startNewGame({
            ...basePayload,
            cash_balance,
            monthly_salary,
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
    <MqxFrame>
      <div className="mq-stack mq-stack-animate mq-stack--tight">
      <div className="mq-enter-item">
      <Section header="Базовые параметры">
          {templateKey ? (
            <>
              <div className="mq-screen-intro">
                Выбран старт из шаблона каталога — зарплата, баланс и обязательства подставятся автоматически. Лишний шаг можно будет убрать в следующих версиях потока.
              </div>
              <Cell multiline subtitle={`Шаблон: ${templateKey}`} />
            </>
          ) : (
            <>
              <div className="mq-screen-intro">Стартовое состояние кошелька на первый месяц.</div>
              <Cell multiline subtitle="На карте наличными">
                <label className="mq-field">
                  <span className="mq-field__label">Стартовый баланс (₽)</span>
                  <input
                    className="mq-field__input"
                    name="cash_balance"
                    inputMode="numeric"
                    value={cashStr}
                    placeholder="0"
                    onChange={(e) => setCashStr(sanitizeIntInput(e.target.value))}
                  />
                </label>
              </Cell>
              <Cell multiline subtitle="Начисляется кнопкой «Получить зарплату» в игре">
                <label className="mq-field">
                  <span className="mq-field__label">Зарплата (₽)</span>
                  <input
                    className="mq-field__input"
                    name="monthly_salary"
                    inputMode="numeric"
                    value={salaryStr}
                    placeholder="например 50000"
                    onChange={(e) => setSalaryStr(sanitizeIntInput(e.target.value))}
                  />
                </label>
              </Cell>
            </>
          )}
        </Section>
      </div>

      {!templateKey ? (
        <>
      <div className="mq-enter-item">
        <Section header="Активы">
          <div className="mq-screen-intro">
            Вещи с оценкой стоимости и регулярным платежом за обслуживание (аренда, авто, дача).
          </div>
          <List>
            {assets.map((asset, idx) => (
              <Cell
                key={idx}
                multiline
                className="mq-base-item-cell"
                after={
                  <Button mode="destructive" size="s" onClick={() => removeAsset(idx)}>
                    Удалить
                  </Button>
                }
              >
                <div className="mq-li-title">{asset.title}</div>
                <div className="mq-li-meta">
                  Стоимость: <MoneyText value={asset.asset_value} decimals={0} />
                </div>
                <div className="mq-li-meta">
                  Обслуживание / мес: <MoneyText value={asset.monthly_maintenance_cost} decimals={0} />
                </div>
              </Cell>
            ))}
          </List>

          <div className="mq-add-block">
            <Cell>
              <label className="mq-field">
                <span className="mq-field__label">Название</span>
                <input
                  className="mq-field__input"
                  name="asset_title"
                  value={newAssetTitle}
                  placeholder="Машина"
                  onChange={(e) => setNewAssetTitle(e.target.value)}
                />
              </label>
            </Cell>
            <Cell>
              <div className="mq-fin-field-grid mq-fin-field-grid--2">
                <label className="mq-field">
                  <span className="mq-field__label">Стоимость (₽)</span>
                  <input
                    className="mq-field__input"
                    name="asset_value"
                    inputMode="numeric"
                    placeholder="0"
                    value={newAssetValueStr}
                    onChange={(e) => setNewAssetValueStr(sanitizeIntInput(e.target.value))}
                  />
                </label>
                <label className="mq-field">
                  <span className="mq-field__label">Обслуживание / месяц (₽)</span>
                  <input
                    className="mq-field__input"
                    name="asset_maintenance"
                    inputMode="numeric"
                    placeholder="0"
                    value={newAssetMaintStr}
                    onChange={(e) => setNewAssetMaintStr(sanitizeIntInput(e.target.value))}
                  />
                </label>
              </div>
            </Cell>
            <Button stretched mode="filled" size="s" className="mq-add-action" onClick={addAsset}>
              + Добавить
            </Button>
          </div>
        </Section>
      </div>

      <div className="mq-enter-item">
        <Section header="Обязательства">
          <div className="mq-screen-intro">
            Кредит, рассрочка, ипотека: тело долга, проценты и фиксированный платёж каждый период.
          </div>
          <List>
            {liabilities.map((liab, idx) => (
              <Cell
                key={idx}
                multiline
                className="mq-base-item-cell"
                after={
                  <Button mode="destructive" size="s" onClick={() => removeLiability(idx)}>
                    Удалить
                  </Button>
                }
              >
                <div className="mq-li-title">{liab.title}</div>
                <div className="mq-li-meta">
                  Долг: <MoneyText value={liab.total_debt} />
                </div>
                <div className="mq-li-meta">
                  Ставка: {liab.annual_rate_percent}%
                </div>
                <div className="mq-li-meta">
                  Платёж / мес: <MoneyText value={liab.monthly_payment} />
                </div>
              </Cell>
            ))}
          </List>

          <div className="mq-add-block">
            <Cell>
              <label className="mq-field">
                <span className="mq-field__label">Название</span>
                <input
                  className="mq-field__input"
                  name="liability_title"
                  value={newLiabTitle}
                  placeholder="Ипотека"
                  onChange={(e) => setNewLiabTitle(e.target.value)}
                />
              </label>
            </Cell>
            <Cell>
              <div className="mq-fin-field-grid mq-fin-field-grid--2">
                <label className="mq-field">
                  <span className="mq-field__label">Тело долга (₽)</span>
                  <input
                    className="mq-field__input"
                    name="liability_total_debt"
                    inputMode="numeric"
                    placeholder="0"
                    value={newDebtStr}
                    onChange={(e) => setNewDebtStr(sanitizeIntInput(e.target.value))}
                  />
                </label>
                <label className="mq-field">
                  <span className="mq-field__label">Ставка, % годовых</span>
                  <input
                    className="mq-field__input"
                    name="liability_rate_percent"
                    inputMode="decimal"
                    placeholder="0"
                    value={newRateStr}
                    onChange={(e) => setNewRateStr(sanitizeDecimalInput(e.target.value))}
                  />
                </label>
              </div>
            </Cell>
            <Cell multiline subtitle="Обязательный платёж каждый период">
              <label className="mq-field">
                <span className="mq-field__label">Платёж в месяц (₽)</span>
                <input
                  className="mq-field__input"
                  name="liability_monthly_payment"
                  inputMode="numeric"
                  placeholder="0"
                  value={newPaymentStr}
                  onChange={(e) => setNewPaymentStr(sanitizeIntInput(e.target.value))}
                />
              </label>
            </Cell>
            <Button stretched mode="filled" size="s" className="mq-add-action" onClick={addLiability}>
              + Добавить
            </Button>
          </div>
        </Section>
      </div>
        </>
      ) : null}

      <div className="mq-enter-item mq-actions-stack" style={{ marginTop: '0.75rem' }}>
        <Button stretched mode="filled" onClick={handleStart} disabled={loading}>
          {loading ? 'Запуск...' : 'Старт игры'}
        </Button>
        <Button stretched mode="plain" onClick={onBack}>
          Назад
        </Button>
      </div>
      </div>
    </MqxFrame>
  );
}
