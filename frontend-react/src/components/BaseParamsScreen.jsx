import { useState } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import { sanitizeIntInput, sanitizeDecimalInput, parseNumLoose } from '../utils/numberFields';
import { DEFAULT_PERIOD_DURATION_SECONDS } from '../config/gameDefaults';
import { PlanExpenseBudgetEditor } from './mqx/layout/PlanExpenseBudgetEditor';
import { defaultPlanExpenseBudget, sumExpenseBudget } from '../utils/planExpenseBudget';
import { MqxShell } from './MqxShell';
import { MqxTabHero } from './MqxTabHero';

/** Мастер старта Plan: cash, зарплата, статьи расходов (без game-шаблонов каталога). */
export function BaseParamsScreen({
  profileName,
  saveKind = 'game',
  templateKey = null,
  periodDuration = DEFAULT_PERIOD_DURATION_SECONDS,
  onBack,
  onGameStarted,
}) {
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
  const [expenseBudget, setExpenseBudget] = useState(() =>
    saveKind === 'plan' ? defaultPlanExpenseBudget(0) : {},
  );

  const useTemplate = Boolean(templateKey && saveKind === 'game');
  const isPlan = saveKind === 'plan';

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
    if (!useTemplate && (!salaryStr || salaryStr.trim() === '')) {
      showNotification('Укажите зарплату (в этом MVP она фиксированная)', 'error');
      return;
    }
    const cash_balance = parseNumLoose(cashStr, 0);
    const monthly_salary = parseNumLoose(salaryStr, 0);
    if (isPlan && sumExpenseBudget(expenseBudget) <= 0 && monthly_salary <= 0) {
      showNotification('Укажите зарплату или хотя бы одну статью бюджета', 'error');
      return;
    }
    setLoading(true);
    try {
      const basePayload = {
        profile_name: profileName,
        save_kind: saveKind || 'game',
        period_duration_seconds: periodDuration,
      };
      const manualPayload = {
        ...basePayload,
        cash_balance,
        monthly_salary,
        assets,
        liabilities,
      };
      if (isPlan) {
        const budget = Object.fromEntries(
          Object.entries(expenseBudget).filter(([, v]) => Number(v) > 0),
        );
        manualPayload.expense_budget = budget;
      }
      const result = useTemplate
        ? await API.startNewGame({
            ...basePayload,
            template_key: templateKey,
          })
        : await API.startNewGame(manualPayload);
      if (result) {
        onGameStarted(result);
      }
    } catch (error) {
      showNotification(error?.detail || error?.message || 'Не удалось запустить игру', 'error');
    } finally {
      setLoading(false);
    }
  };

  const heroRight = useTemplate ? 'Шаблон' : 'Шаг 2/2';
  const heroSub = useTemplate
    ? 'Зарплата, баланс и долги подставятся из каталога. Дальше — сразу период.'
    : saveKind === 'plan'
      ? 'План: только ваши цифры, без игровых стартов из каталога.'
      : 'Задайте кошелёк и расходы — в том же каркасе, что карточки на главной.';

  return (
    <MqxShell
      header={
        <MqxTabHero
          sectionLabel="Новая игра"
          rightPill={heroRight}
          title="Базовые параметры"
          subtitle={heroSub}
        />
      }
    >
      <div className="mq-stack mq-stack--tight mq-stack-animate">
        <div className="mq-enter-item mqx-card">
          <div className="mqx-card__kicker mqx-card__kicker--violet">Старт</div>
          <div className="mqx-card__title">Кошелёк и зарплата</div>
          {useTemplate ? (
            <>
              <p className="mqx-card__sub">
                Выбран старт из шаблона — баланс и обязательства подставятся автоматически.
              </p>
              <div className="mqx-fin-row" style={{ marginTop: 14 }}>
                <div className="mqx-fin-row__l">
                  <div className="mqx-fin-row__title">Шаблон</div>
                  <div className="mqx-fin-row__sub">{templateKey}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="mqx-card__sub">
                {saveKind === 'plan'
                  ? 'План: вводите свои цифры — без игровых шаблонов.'
                  : 'Стартовое состояние кошелька на первый месяц.'}
              </p>
              <div className="mqx-form" style={{ marginTop: 14 }}>
                <label className="mq-field">
                  <span className="mq-field__label">Стартовый баланс (₽)</span>
                  <span className="mq-field__hint">На карте наличными</span>
                  <input
                    className="mq-field__input"
                    name="cash_balance"
                    inputMode="numeric"
                    value={cashStr}
                    placeholder="0"
                    onChange={(e) => setCashStr(sanitizeIntInput(e.target.value))}
                  />
                </label>
                <label className="mq-field">
                  <span className="mq-field__label">Зарплата (₽)</span>
                  <span className="mq-field__hint">Начисляется кнопкой в игре</span>
                  <input
                    className="mq-field__input"
                    name="monthly_salary"
                    inputMode="numeric"
                    value={salaryStr}
                    placeholder="например 50000"
                    onChange={(e) => setSalaryStr(sanitizeIntInput(e.target.value))}
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {!useTemplate && isPlan ? (
          <div className="mq-enter-item mqx-card">
            <div className="mqx-card__kicker mqx-card__kicker--amber">Бюджет</div>
            <div className="mqx-card__title">Расходы на жизнь</div>
            <PlanExpenseBudgetEditor
              budget={expenseBudget}
              onChange={setExpenseBudget}
              monthlySalary={parseNumLoose(salaryStr, 0)}
            />
          </div>
        ) : null}

        {!useTemplate ? (
          <>
            <div className="mq-enter-item mqx-card">
              <div className="mqx-card__title">Активы</div>
              <p className="mqx-card__sub">Вещи с оценкой и обслуживанием каждый период.</p>

              <div className="mqx-fin-list" style={{ marginTop: 14 }}>
                {assets.map((asset, idx) => (
                  <div key={idx} className="mqx-fin-row mqx-fin-row--positions">
                    <div className="mqx-fin-row__l">
                      <div className="mqx-fin-row__title">{asset.title}</div>
                      <div className="mqx-fin-row__sub">
                        Стоимость: <MoneyText value={asset.asset_value} decimals={0} />
                      </div>
                      <div className="mqx-fin-row__sub">
                        Обслуживание / мес: <MoneyText value={asset.monthly_maintenance_cost} decimals={0} />
                      </div>
                    </div>
                    <div className="mqx-fin-row__r">
                      <Button mode="destructive" size="s" onClick={() => removeAsset(idx)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mq-add-block">
                <div className="mqx-fin-subcard" style={{ marginTop: 14 }}>
                  <div className="mqx-form">
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
                  </div>
                </div>
                <Button stretched mode="filled" size="s" className="mq-add-action" onClick={addAsset}>
                  + Добавить актив
                </Button>
              </div>
            </div>

            <div className="mq-enter-item mqx-card">
              <div className="mqx-card__title">Обязательства</div>
              <p className="mqx-card__sub">Кредит, рассрочка: долг, ставка и фиксированный платёж.</p>

              <div className="mqx-fin-list" style={{ marginTop: 14 }}>
                {liabilities.map((liab, idx) => (
                  <div key={idx} className="mqx-fin-row mqx-fin-row--positions">
                    <div className="mqx-fin-row__l">
                      <div className="mqx-fin-row__title">{liab.title}</div>
                      <div className="mqx-fin-row__sub">
                        Долг: <MoneyText value={liab.total_debt} />
                      </div>
                      <div className="mqx-fin-row__sub">Ставка: {liab.annual_rate_percent}%</div>
                      <div className="mqx-fin-row__sub">
                        Платёж / мес: <MoneyText value={liab.monthly_payment} />
                      </div>
                    </div>
                    <div className="mqx-fin-row__r">
                      <Button mode="destructive" size="s" onClick={() => removeLiability(idx)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mq-add-block">
                <div className="mqx-fin-subcard" style={{ marginTop: 14 }}>
                  <div className="mqx-form">
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
                    <label className="mq-field">
                      <span className="mq-field__label">Платёж в месяц (₽)</span>
                      <span className="mq-field__hint">Обязательный платёж каждый период</span>
                      <input
                        className="mq-field__input"
                        name="liability_monthly_payment"
                        inputMode="numeric"
                        placeholder="0"
                        value={newPaymentStr}
                        onChange={(e) => setNewPaymentStr(sanitizeIntInput(e.target.value))}
                      />
                    </label>
                  </div>
                </div>
                <Button stretched mode="filled" size="s" className="mq-add-action" onClick={addLiability}>
                  + Добавить обязательство
                </Button>
              </div>
            </div>
          </>
        ) : null}

        <div className="mq-enter-item mq-actions-stack">
          <Button stretched mode="filled" onClick={handleStart} disabled={loading}>
            {loading ? 'Запуск...' : isPlan ? 'Создать план' : 'Старт игры'}
          </Button>
          <Button stretched mode="outline" onClick={onBack}>
            Назад
          </Button>
        </div>
      </div>
    </MqxShell>
  );
}
