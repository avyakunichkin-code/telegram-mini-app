import { Button, Cell, Input, List, Section, Select } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import { useEffect, useState } from 'react';
import { CapitalPortfolioPanels } from './CapitalPortfolioPanels';
import { InvestProductForm } from './InvestProductForm';
import { InvestPositionRow } from './InvestPositionRow';
import { InvestPositionMetrics } from './InvestPositionMetrics';
import { AssetPositionMetrics, LiabilityPositionMetrics, MqxModeButton, MqxSubtab } from './mqx';
import {
  BOND_ANNUAL_RATE_PERCENT,
  clampInvestAmount,
  DEPOSIT_ANNUAL_RATE_PERCENT,
} from '../constants/investProducts';
import {
  DEFAULT_INSURANCE_CATALOG_KEY,
  findInsuranceCatalogItem,
  INSURANCE_CATALOG,
} from '../constants/insuranceProducts';

export const FINANCE_TABS = [
  { id: 'invest', label: 'Инвестиции' },
  { id: 'insurance', label: 'Страховки' },
  { id: 'portfolio', label: 'Активы · долги' },
];

const DEPOSIT_HELP =
  'Депозит растёт в теле вклада. Увеличивается на 1/12 от ставки вклада каждый период.';

const BOND_HELP =
  'Облигации платят купон на счёт. 1/12 от ставки добавляется на счёт автоматически в начале каждого периода.';

export function FinanceSection({
  overview,
  refreshOverview,
  premium = false,
  capitalLayout = false,
  financeTab: financeTabProp,
  onFinanceTabChange,
  hideSectionsCard = false,
}) {
  const [financeTabInternal, setFinanceTabInternal] = useState('invest');
  const financeTab = financeTabProp ?? financeTabInternal;
  const setFinanceTab = onFinanceTabChange ?? setFinanceTabInternal;
  const [investPositions, setInvestPositions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);
  const [bondAmount, setBondAmount] = useState(0);
  const [policyCatalogKey, setPolicyCatalogKey] = useState(DEFAULT_INSURANCE_CATALOG_KEY);
  const [policyPremium, setPolicyPremium] = useState(1500);
  const [policyPayout, setPolicyPayout] = useState(100000);
  const [policyTermPeriods, setPolicyTermPeriods] = useState(12);
  const selectedInsurance = findInsuranceCatalogItem(policyCatalogKey);
  const [assetTemplates, setAssetTemplates] = useState([]);
  const [liabilityTemplates, setLiabilityTemplates] = useState([]);

  const [investProductTab, setInvestProductTab] = useState('deposit');
  /** form — ввод суммы/ставки и «Открыть»; positions — только список соответствующего типа */
  const [investUiMode, setInvestUiMode] = useState('form');

  const [portfolioTab, setPortfolioTab] = useState('assets');
  const [portfolioAssetsMode, setPortfolioAssetsMode] = useState('add');
  const [portfolioDebtsMode, setPortfolioDebtsMode] = useState('add');
  const [expandedAssetTpl, setExpandedAssetTpl] = useState(null);
  const [expandedDebtTpl, setExpandedDebtTpl] = useState(null);

  const reloadExtra = async () => {
    try {
      const [pos, pol, tpl, ltpl] = await Promise.all([
        API.listInvestPositions(),
        API.listPolicies(),
        API.getAssetTemplates(),
        API.getLiabilityTemplates(),
      ]);
      if (Array.isArray(pos)) setInvestPositions(pos);
      if (Array.isArray(pol)) setPolicies(pol);
      if (Array.isArray(tpl)) setAssetTemplates(tpl);
      if (Array.isArray(ltpl)) setLiabilityTemplates(ltpl);
    } catch (e) {
      // не блокируем экран
    }
  };

  useEffect(() => {
    reloadExtra();
  }, []);

  useEffect(() => {
    if (premium) setInvestUiMode('form');
  }, [investProductTab, premium]);

  const maxCash = Math.max(0, Math.floor(Number(overview?.cash_balance) || 0));

  useEffect(() => {
    setDepositAmount((v) => clampInvestAmount(v, maxCash));
    setBondAmount((v) => clampInvestAmount(v, maxCash));
  }, [maxCash]);

  const handleDeleteLiability = async (id) => {
    try {
      await API.deleteLiability(id);
      await refreshOverview();
      showNotification('Обязательство удалено', 'success');
    } catch (err) {
      showNotification(err?.detail || err?.message || 'Ошибка соединения', 'error');
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await API.deleteAsset(id);
      await refreshOverview();
      showNotification('Актив удалён', 'success');
    } catch (err) {
      showNotification(err?.detail || err?.message || 'Ошибка соединения', 'error');
    }
  };

  const addLiabilityFromTemplate = async (t) => {
    try {
      await API.createLiabilityFromTemplate(t.key);
      showNotification('Обязательство добавлено: сумма зачислена на счёт', 'success');
      await refreshOverview();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось добавить долг', 'error');
    }
  };

  if (!overview) return null;

  const depositPositions = investPositions.filter((p) => p.kind === 'deposit');
  const bondPositions = investPositions.filter((p) => p.kind === 'bond');

  if (!premium) {
    return (
      <div className="mq-stack mq-stack-animate mq-stack--tight mq-fin-page">
        <div className="mq-enter-item">
          <div className="mq-slot-intro">Вкладки: инвестиции, страховки, активы и долги.</div>
          <div className="mq-tabs-wrap mq-fin-wrap">
            <div className="mq-tablist mq-tablist--2x2" role="tablist" aria-label="Разделы финансов">
              {FINANCE_TABS.map((t) => (
                <button
                  key={t.id}
                  id={`finance-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={financeTab === t.id}
                  aria-controls={`finance-panel-${t.id}`}
                  className={`mq-tab ${financeTab === t.id ? 'mq-tab--active' : ''}`}
                  onClick={() => setFinanceTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div key={financeTab} className="mq-enter-item mq-tab-panel-reveal mq-fin-shell">
          {financeTab === 'invest' && (
            <div role="tabpanel" id="finance-panel-invest" aria-labelledby="finance-tab-invest">
              <Section header="Инвестиции">
                <div className="mq-slot-intro">{DEPOSIT_HELP}</div>
                                <Cell multiline>
                  <InvestProductForm
                    productId="deposit"
                    productTitle="Депозит"
                    amount={depositAmount}
                    maxCash={maxCash}
                    annualRatePercent={DEPOSIT_ANNUAL_RATE_PERCENT}
                    onAmountChange={setDepositAmount}
                    submitLabel="Открыть депозит"
                    onSubmit={async () => {
                      try {
                        await API.openDeposit({
                          amount: depositAmount,
                          annual_rate_percent: DEPOSIT_ANNUAL_RATE_PERCENT,
                        });
                        showNotification('Депозит открыт', 'success');
                        setDepositAmount(0);
                        await refreshOverview();
                        await reloadExtra();
                      } catch (e) {
                        showNotification(e?.detail || e?.message || 'Не удалось открыть депозит', 'error');
                      }
                    }}
                  />
                </Cell>

                <Cell multiline>
                  <div className="mq-slot-intro" style={{ marginBottom: 4 }}>
                    {BOND_HELP}
                  </div>
                  <InvestProductForm
                    productId="bond"
                    productTitle="Облигации"
                    amount={bondAmount}
                    maxCash={maxCash}
                    annualRatePercent={BOND_ANNUAL_RATE_PERCENT}
                    onAmountChange={setBondAmount}
                    submitLabel="Купить облигации"
                    onSubmit={async () => {
                      try {
                        await API.buyBond({
                          amount: bondAmount,
                          annual_rate_percent: BOND_ANNUAL_RATE_PERCENT,
                          title: 'Облигации (easy)',
                        });
                        showNotification('Облигации куплены', 'success');
                        setBondAmount(0);
                        await refreshOverview();
                        await reloadExtra();
                      } catch (e) {
                        showNotification(e?.detail || e?.message || 'Не удалось купить облигации', 'error');
                      }
                    }}
                  />
                </Cell>

<List>
                  {investPositions.length === 0 && <Cell>Нет позиций</Cell>}
                  {investPositions.map((p) => (
                    <Cell
                      key={p.id}
                      multiline
                      after={
                        <Button
                          size="s"
                          mode="destructive"
                          onClick={async () => {
                            try {
                              await API.closeInvestPosition(p.id);
                              showNotification('Позиция закрыта', 'success');
                              await refreshOverview();
                              await reloadExtra();
                            } catch (e) {
                              showNotification(e?.detail || e?.message || 'Не удалось закрыть позицию', 'error');
                            }
                          }}
                        >
                          Закрыть
                        </Button>
                      }
                    >
                      <div>
                        <strong>{p.title}</strong>
                      </div>
                      <InvestPositionMetrics
                        principal={p.principal}
                        annualRatePercent={p.annual_rate_percent}
                      />
                    </Cell>
                  ))}
                </List>
              </Section>
            </div>
          )}

          {financeTab === 'insurance' && (
            <div role="tabpanel" id="finance-panel-insurance" aria-labelledby="finance-tab-insurance">
              <Section header="Страховки">
                <div className="mq-slot-intro">Выберите тип, задайте премию и лимит выплаты. Премия списывается в конце периода.</div>
                <Cell multiline>
                  <div className="mq-fin-field-grid mq-fin-field-grid--2">
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Select
                        header="Продукт"
                        value={policyCatalogKey}
                        onChange={(e) => setPolicyCatalogKey(e.target.value)}
                      >
                        {INSURANCE_CATALOG.map((item) => (
                          <option key={item.kind} value={item.kind}>
                            {item.product_label} — {item.object_label}
                          </option>
                        ))}
                      </Select>
                      <div className="mq-slot-intro" style={{ marginTop: 6 }}>
                        {selectedInsurance.title}
                      </div>
                    </div>
                    <Input
                      header="Оплата за период (₽)"
                      type="number"
                      value={policyPremium}
                      onChange={(e) => setPolicyPremium(Number(e.target.value))}
                    />
                    <Input
                      header="Сумма выплаты (₽)"
                      type="number"
                      value={policyPayout}
                      onChange={(e) => setPolicyPayout(Number(e.target.value))}
                    />
                    <Input
                      header="Срок (периодов)"
                      type="number"
                      value={policyTermPeriods}
                      onChange={(e) => setPolicyTermPeriods(Number(e.target.value))}
                    />
                    <Button
                      mode="filled"
                      className="mq-fin-btn-span2"
                      stretched
                      onClick={async () => {
                        try {
                          const item = findInsuranceCatalogItem(policyCatalogKey);
                          await API.buyPolicy({
                            product: item.product,
                            insured_object: item.insured_object,
                            monthly_premium: policyPremium,
                            payout_amount: policyPayout,
                            term_periods: policyTermPeriods,
                          });
                          showNotification('Полис оформлен', 'success');
                          await refreshOverview();
                          await reloadExtra();
                        } catch (e) {
                          showNotification(e?.detail || e?.message || 'Не удалось оформить полис', 'error');
                        }
                      }}
                    >
                      Оформить полис
                    </Button>
                  </div>
                </Cell>

                <List>
                  {policies.length === 0 && <Cell>Нет активных полисов</Cell>}
                  {policies.map((p) => (
                    <Cell
                      key={p.id}
                      multiline
                      after={
                        <Button
                          size="s"
                          mode="destructive"
                          onClick={async () => {
                            try {
                              await API.cancelPolicy(p.id);
                              showNotification('Полис отменён', 'success');
                              await reloadExtra();
                            } catch (e) {
                              showNotification(e?.detail || e?.message || 'Не удалось отменить полис', 'error');
                            }
                          }}
                        >
                          Отменить
                        </Button>
                      }
                    >
                      <div>
                        <strong>{p.title}</strong> ({p.kind})
                      </div>
                      <div>
                        Премия: <MoneyText value={p.monthly_premium} /> / мес
                      </div>
                      <div>
                        Выплата: <MoneyText value={p.payout_amount ?? p.coverage_limit} decimals={0} />
                      </div>
                      <div>
                        Срок: период {p.started_period_index ?? '—'} — {p.expires_period_index ?? '—'}
                      </div>
                    </Cell>
                  ))}
                </List>
              </Section>
            </div>
          )}

          {financeTab === 'portfolio' && (
            <div role="tabpanel" id="finance-panel-portfolio" aria-labelledby="finance-tab-portfolio">
              <>
                <Section header="Шаблоны активов">
                  <div className="mq-slot-intro">Список из каталога на сервере: покупка списывает стоимость; удаление из позиций зачисляет стоимость обратно.</div>
                  <List>
                    {assetTemplates.length === 0 && <Cell>Шаблоны не загружены</Cell>}
                    {assetTemplates.map((t) => (
                      <Cell
                        key={t.key}
                        multiline
                        after={
                          <Button
                            size="s"
                            onClick={async () => {
                              try {
                                await API.createAssetFromTemplate(t.key);
                                showNotification('Актив добавлен', 'success');
                                await refreshOverview();
                                await reloadExtra();
                              } catch (e) {
                                showNotification(e?.detail || e?.message || 'Не удалось добавить актив', 'error');
                              }
                            }}
                          >
                            Добавить
                          </Button>
                        }
                      >
                        <div>
                          <strong>{t.title}</strong>
                        </div>
                        <div>
                          Стоимость: <MoneyText value={t.asset_value} decimals={0} />
                        </div>
                        <div>
                          Обслуживание: <MoneyText value={t.monthly_maintenance_cost} decimals={0} /> / мес
                        </div>
                        {Number(t.monthly_income) > 0 ? (
                          <div>
                            Доход: <MoneyText value={t.monthly_income} decimals={0} /> / мес
                          </div>
                        ) : null}
                      </Cell>
                    ))}
                  </List>
                </Section>
                <Section header="Активы">
                  <List>
                    {overview.assets.length === 0 && <Cell>Нет активов</Cell>}
                    {overview.assets.map((asset) => (
                      <Cell
                        key={asset.id}
                        multiline
                        after={
                          <Button size="s" mode="destructive" onClick={() => handleDeleteAsset(asset.id)}>
                            Удалить
                          </Button>
                        }
                      >
                        <div>
                          <strong>{asset.title}</strong>
                          {asset.kind && asset.kind !== 'generic' ? (
                            <span style={{ opacity: 0.75 }}> · {asset.kind}</span>
                          ) : null}
                        </div>
                        <AssetPositionMetrics
                          assetValue={asset.asset_value}
                          monthlyMaintenanceCost={asset.monthly_maintenance_cost}
                          monthlyIncome={asset.monthly_income}
                        />
                      </Cell>
                    ))}
                  </List>
                </Section>
                <Section header="Шаблоны долгов">
                  <div className="mq-slot-intro">
                    Тело кредита зачисляется на счёт при добавлении. Закрыть долг (кнопка удалить) — вернуть тело и погасить
                    просрочку разом с баланса.
                  </div>
                  <List>
                    {liabilityTemplates.map((t) => (
                      <Cell
                        key={t.key}
                        multiline
                        after={
                          <Button size="s" onClick={() => addLiabilityFromTemplate(t)}>
                            Добавить
                          </Button>
                        }
                      >
                        <div>
                          <strong>{t.title}</strong>
                        </div>
                        <div>
                          Долг: <MoneyText value={t.total_debt} decimals={0} />
                        </div>
                        <div>Ставка: {t.annual_rate_percent}%</div>
                        <div>
                          Платёж: <MoneyText value={t.monthly_payment} decimals={0} /> / мес
                        </div>
                      </Cell>
                    ))}
                  </List>
                </Section>
                <Section header="Обязательства">
                  <List>
                    {overview.liabilities.length === 0 && <Cell>Нет обязательств</Cell>}
                    {overview.liabilities.map((liability) => (
                      <Cell
                        key={liability.id}
                        multiline
                        after={
                          <Button size="s" mode="destructive" onClick={() => handleDeleteLiability(liability.id)}>
                            Удалить
                          </Button>
                        }
                      >
                        <div>
                          <strong>{liability.title}</strong>
                        </div>
                        <LiabilityPositionMetrics
                          totalDebt={liability.total_debt}
                          monthlyPayment={liability.monthly_payment}
                          annualRatePercent={liability.annual_rate_percent}
                          overdueAmount={liability.overdue_amount}
                        />
                        {(Number(liability.overdue_periods) > 0) && (
                          <div style={{ color: 'var(--tg-theme-destructive-text-color, #c62828)' }}>
                            Просрочка: <MoneyText value={Number(liability.overdue_amount || 0)} />
                            {Number(liability.overdue_periods) > 0
                              ? ` (${liability.overdue_periods} пер. подряд)`
                              : ''}
                          </div>
                        )}
                      </Cell>
                    ))}
                  </List>
                </Section>
              </>
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedInvestSubtitle = investProductTab === 'deposit' ? DEPOSIT_HELP : BOND_HELP;
  const selectedInvestPositions = investProductTab === 'deposit' ? depositPositions : bondPositions;

  const openDeposit = async () => {
    try {
      await API.openDeposit({ amount: depositAmount, annual_rate_percent: DEPOSIT_ANNUAL_RATE_PERCENT });
      showNotification('Депозит открыт', 'success');
      setDepositAmount(0);
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось открыть депозит', 'error');
    }
  };

  const openBond = async () => {
    try {
      await API.buyBond({
        amount: bondAmount,
        annual_rate_percent: BOND_ANNUAL_RATE_PERCENT,
        title: 'Облигации (easy)',
      });
      showNotification('Облигации добавлены', 'success');
      setBondAmount(0);
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось добавить облигации', 'error');
    }
  };

  const closeInvest = async (id) => {
    try {
      await API.closeInvestPosition(id);
      showNotification('Позиция закрыта', 'success');
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось закрыть позицию', 'error');
    }
  };

  const activeTabLabel = FINANCE_TABS.find((t) => t.id === financeTab)?.label || 'Финансы';
  const ownedAssets = overview.assets || [];
  const ownedLiabilities = overview.liabilities || [];

  return (
    <div className={`mqx-fin ${capitalLayout ? 'mqx-fin--capital' : ''}`}>
      {!hideSectionsCard ? (
        <div className="mqx-card mqx-fin-card">
          <div className="mqx-card__title">Разделы</div>
          <div className="mqx-fin-tabs" role="tablist" aria-label="Разделы финансов">
          {FINANCE_TABS.map((t) => (
            <button
              key={t.id}
              id={`finance-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={financeTab === t.id}
              aria-controls={`finance-panel-${t.id}`}
              className={`mqx-fin-tab ${financeTab === t.id ? 'mqx-fin-tab--active' : ''}`}
              onClick={() => setFinanceTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          </div>
        </div>
      ) : null}

      {financeTab === 'portfolio' && capitalLayout ? (
        <CapitalPortfolioPanels
          activeTabLabel={activeTabLabel}
          portfolioTab={portfolioTab}
          setPortfolioTab={setPortfolioTab}
          setExpandedDebtTpl={setExpandedDebtTpl}
          setExpandedAssetTpl={setExpandedAssetTpl}
          portfolioAssetsMode={portfolioAssetsMode}
          setPortfolioAssetsMode={setPortfolioAssetsMode}
          portfolioDebtsMode={portfolioDebtsMode}
          setPortfolioDebtsMode={setPortfolioDebtsMode}
          assetTemplates={assetTemplates}
          liabilityTemplates={liabilityTemplates}
          ownedAssets={ownedAssets}
          ownedLiabilities={ownedLiabilities}
          refreshOverview={refreshOverview}
          reloadExtra={reloadExtra}
          handleDeleteAsset={handleDeleteAsset}
          handleDeleteLiability={handleDeleteLiability}
          addLiabilityFromTemplate={addLiabilityFromTemplate}
        />
      ) : (
      <div
        className={`mqx-card mqx-fin-card ${capitalLayout ? 'mqx-capital-card' : ''}`}
        role="tabpanel"
        id={`finance-panel-${financeTab}`}
        aria-labelledby={`finance-tab-${financeTab}`}
      >
        <h2 className={capitalLayout ? 'mqx-capital-card__title' : 'mqx-card__title'}>{activeTabLabel}</h2>

        {financeTab === 'invest' ? (
          <>
            <div className="mqx-fin-subtabs mqx-fin-subtabs-row" role="tablist" aria-label="Инструмент">
              <MqxSubtab
                role="tab"
                aria-selected={investProductTab === 'deposit'}
                active={investProductTab === 'deposit'}
                onClick={() => setInvestProductTab('deposit')}
              >
                Депозиты
              </MqxSubtab>
              <MqxSubtab
                role="tab"
                aria-selected={investProductTab === 'bond'}
                active={investProductTab === 'bond'}
                onClick={() => setInvestProductTab('bond')}
              >
                Облигации
              </MqxSubtab>
            </div>

            <div className="mqx-fin-longhelp">{selectedInvestSubtitle}</div>

            {investUiMode === 'form' ? (
              <>
                <InvestProductForm
                  productId={investProductTab}
                  productTitle={investProductTab === 'deposit' ? 'Депозит' : 'Облигации'}
                  amount={investProductTab === 'deposit' ? depositAmount : bondAmount}
                  maxCash={maxCash}
                  annualRatePercent={
                    investProductTab === 'deposit' ? DEPOSIT_ANNUAL_RATE_PERCENT : BOND_ANNUAL_RATE_PERCENT
                  }
                  onAmountChange={investProductTab === 'deposit' ? setDepositAmount : setBondAmount}
                  submitLabel={investProductTab === 'deposit' ? 'Открыть депозит' : 'Купить облигации'}
                  onSubmit={() => void (investProductTab === 'deposit' ? openDeposit() : openBond())}
                />
                <div className="mqx-invest-form-actions">
                  <MqxModeButton onClick={() => setInvestUiMode('positions')}>Позиции</MqxModeButton>
                </div>
              </>
            ) : (
              <>
                <div className="mqx-fin-actions-top" style={{ marginTop: 12 }}>
                  <Button mode="plain" size="s" onClick={() => setInvestUiMode('form')}>
                    ← К форме
                  </Button>
                </div>
                <div className="mqx-fin-list" style={{ marginTop: 8 }}>
                  {selectedInvestPositions.length === 0 ? (
                    <div className="mqx-fin-empty">
                      Нет позиций: {investProductTab === 'deposit' ? 'депозитов' : 'облигаций'}
                    </div>
                  ) : (
                    selectedInvestPositions.map((p) => (
                      <InvestPositionRow
                        key={p.id}
                        position={p}
                        onClose={() => void closeInvest(p.id)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </>
        ) : null}

        {financeTab === 'insurance' ? (
          <>
            <div className="mqx-card__sub">
              Премия списывается в конце периода. При страховом случае — полная сумма выплаты, полис закрывается.
            </div>
            <div className="mqx-fin-grid mqx-fin-grid--2" style={{ marginTop: 12 }}>
              <div className="mqx-fin-span2">
                <Select
                  header="Продукт"
                  value={policyCatalogKey}
                  onChange={(e) => setPolicyCatalogKey(e.target.value)}
                >
                  {INSURANCE_CATALOG.map((item) => (
                    <option key={item.kind} value={item.kind}>
                      {item.product_label} — {item.object_label}
                    </option>
                  ))}
                </Select>
                <div className="mqx-card__sub" style={{ marginTop: 6 }}>
                  {selectedInsurance.title}
                </div>
              </div>
              <Input
                header="Оплата за период"
                type="number"
                value={policyPremium}
                onChange={(e) => setPolicyPremium(Number(e.target.value))}
              />
              <Input
                header="Сумма выплаты"
                type="number"
                value={policyPayout}
                onChange={(e) => setPolicyPayout(Number(e.target.value))}
              />
              <Input
                header="Срок (периодов)"
                type="number"
                value={policyTermPeriods}
                onChange={(e) => setPolicyTermPeriods(Number(e.target.value))}
              />
              <div className="mqx-fin-span2">
                <Button
                  mode="filled"
                  stretched
                  onClick={async () => {
                    try {
                      const item = findInsuranceCatalogItem(policyCatalogKey);
                      await API.buyPolicy({
                        product: item.product,
                        insured_object: item.insured_object,
                        monthly_premium: policyPremium,
                        payout_amount: policyPayout,
                        term_periods: policyTermPeriods,
                      });
                      showNotification('Полис оформлен', 'success');
                      await refreshOverview();
                      await reloadExtra();
                    } catch (e) {
                      showNotification(e?.detail || e?.message || 'Не удалось оформить полис', 'error');
                    }
                  }}
                >
                  Оформить полис
                </Button>
              </div>
            </div>

            <div className="mqx-fin-list" style={{ marginTop: 12 }}>
              {policies.length === 0 ? (
                <div className="mqx-fin-empty">Нет активных полисов</div>
              ) : (
                policies.map((p) => (
                  <div key={p.id} className="mqx-fin-row">
                    <div className="mqx-fin-row__l">
                      <div className="mqx-fin-row__title">{p.title}</div>
                      <div className="mqx-fin-row__sub">
                        {p.kind} · <MoneyText value={p.monthly_premium} /> / мес
                      </div>
                    </div>
                    <div className="mqx-fin-row__r">
                      <div className="mqx-fin-row__val">
                        <MoneyText value={p.payout_amount ?? p.coverage_limit} decimals={0} />
                      </div>
                      <Button size="s" mode="destructive" onClick={async () => {
                        try {
                          await API.cancelPolicy(p.id);
                          showNotification('Полис отменён', 'success');
                          await reloadExtra();
                        } catch (e) {
                          showNotification(e?.detail || e?.message || 'Не удалось отменить полис', 'error');
                        }
                      }}>Отменить</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

        {financeTab === 'portfolio' && !capitalLayout ? (
          <>
            <div className="mqx-fin-subtabs mqx-fin-subtabs-row" role="tablist" aria-label="Портфель">
              <MqxSubtab
                role="tab"
                aria-selected={portfolioTab === 'assets'}
                active={portfolioTab === 'assets'}
                onClick={() => {
                  setPortfolioTab('assets');
                  setExpandedDebtTpl(null);
                }}
              >
                Активы
              </MqxSubtab>
              <MqxSubtab
                role="tab"
                aria-selected={portfolioTab === 'debts'}
                active={portfolioTab === 'debts'}
                onClick={() => {
                  setPortfolioTab('debts');
                  setExpandedAssetTpl(null);
                }}
              >
                Долги
              </MqxSubtab>
            </div>

            {portfolioTab === 'assets' ? (
              <>
                <div className="mqx-card__sub">
                  Покупка из шаблона списывает стоимость с текущего счёта; удаление возвращает сумму стоимости на баланс (продажа).
                </div>
                <div className="mqx-fin-bt-row" style={{ marginTop: 12 }}>
                  <Button
                    mode="filled"
                    size="s"
                    className={`mqx-fin-toggle-btn ${portfolioAssetsMode === 'add' ? 'mqx-fin-toggle-btn--active' : ''}`}
                    onClick={() => setPortfolioAssetsMode('add')}
                  >
                    Добавить актив
                  </Button>
                  <Button
                    mode="outline"
                    size="s"
                    className={`mqx-fin-toggle-btn ${portfolioAssetsMode === 'positions' ? 'mqx-fin-toggle-btn--active' : ''}`}
                    onClick={() => setPortfolioAssetsMode('positions')}
                  >
                    Позиции
                  </Button>
                </div>

                {portfolioAssetsMode === 'add' ? (
                  <div className="mqx-fin-acc-list" style={{ marginTop: 12 }}>
                    {assetTemplates.length === 0 ? (
                      <div className="mqx-fin-empty">Шаблоны не загружены</div>
                    ) : (
                      assetTemplates.map((t) => {
                        const expanded = expandedAssetTpl === t.key;
                        return (
                          <div key={t.key} className="mqx-fin-acc">
                            <button
                              type="button"
                              className="mqx-fin-acc-trigger"
                              aria-expanded={expanded}
                              onClick={() => setExpandedAssetTpl(expanded ? null : t.key)}
                            >
                              <span className="mqx-fin-acc-title">{t.title}</span>
                              <span className="mqx-fin-acc-chev" aria-hidden>{expanded ? '▾' : '▸'}</span>
                            </button>
                            {expanded ? (
                              <div className="mqx-fin-acc-body">
                                <div className="mqx-fin-acc-meta">
                                  Стоимость: <MoneyText value={t.asset_value} decimals={0} /> · Обслуживание:{' '}
                                  <MoneyText value={t.monthly_maintenance_cost} decimals={0} />/мес
                                  {Number(t.monthly_income) > 0 ? (
                                    <>
                                      {' '}
                                      · Доход: <MoneyText value={t.monthly_income} decimals={0} />/мес
                                    </>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  className="mqx-fin-icon-btn mqx-fin-icon-btn--plus"
                                  aria-label={`Добавить актив: ${t.title}`}
                                  onClick={async () => {
                                    try {
                                      await API.createAssetFromTemplate(t.key);
                                      showNotification('Актив добавлен', 'success');
                                      await refreshOverview();
                                      await reloadExtra();
                                    } catch (e) {
                                      showNotification(e?.detail || e?.message || 'Не удалось добавить актив', 'error');
                                    }
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="mqx-fin-list" style={{ marginTop: 12 }}>
                    {(overview.assets || []).length === 0 ? (
                      <div className="mqx-fin-empty">Нет активов</div>
                    ) : (
                      (overview.assets || []).map((a) => (
                        <div key={a.id} className="mqx-fin-row mqx-fin-row--positions">
                          <div className="mqx-fin-row__l">
                            <div className="mqx-fin-row__title">{a.title}</div>
                            <div className="mqx-fin-row__sub">
                              <MoneyText value={a.asset_value} decimals={0} /> · обслуж.{' '}
                              <MoneyText value={a.monthly_maintenance_cost} decimals={0} />/мес
                            </div>
                          </div>
                          <button
                            type="button"
                            className="mqx-fin-icon-btn mqx-fin-icon-btn--minus"
                            aria-label={`Удалить актив ${a.title}`}
                            onClick={() => void handleDeleteAsset(a.id)}
                          >
                            −
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : null}

            {portfolioTab === 'debts' ? (
              <>
                <div className="mqx-card__sub">
                  Новый долг заносит сумму на счёт; ежемесячный платёж считается как тело долга × (годовых %÷100) ÷ 12.
                  Закрытие — вернуть остаток долга и просрочку одним платежом.
                </div>
                <div className="mqx-fin-bt-row" style={{ marginTop: 12 }}>
                  <Button
                    mode="filled"
                    size="s"
                    className={`mqx-fin-toggle-btn ${portfolioDebtsMode === 'add' ? 'mqx-fin-toggle-btn--active' : ''}`}
                    onClick={() => setPortfolioDebtsMode('add')}
                  >
                    Добавить долг
                  </Button>
                  <Button
                    mode="outline"
                    size="s"
                    className={`mqx-fin-toggle-btn ${portfolioDebtsMode === 'positions' ? 'mqx-fin-toggle-btn--active' : ''}`}
                    onClick={() => setPortfolioDebtsMode('positions')}
                  >
                    Позиции
                  </Button>
                </div>

                {portfolioDebtsMode === 'add' ? (
                  <div className="mqx-fin-acc-list" style={{ marginTop: 12 }}>
                    {liabilityTemplates.map((t) => {
                      const expanded = expandedDebtTpl === t.key;
                      return (
                        <div key={t.key} className="mqx-fin-acc">
                          <button
                            type="button"
                            className="mqx-fin-acc-trigger"
                            aria-expanded={expanded}
                            onClick={() => setExpandedDebtTpl(expanded ? null : t.key)}
                          >
                            <span className="mqx-fin-acc-title">{t.title}</span>
                            <span className="mqx-fin-acc-chev" aria-hidden>{expanded ? '▾' : '▸'}</span>
                          </button>
                          {expanded ? (
                            <div className="mqx-fin-acc-body">
                              <div className="mqx-fin-acc-meta">
                                Долг: <MoneyText value={t.total_debt} decimals={0} /> · Ставка: {t.annual_rate_percent}% ·
                                платёж <MoneyText value={t.monthly_payment} decimals={0} />/мес
                              </div>
                              <button
                                type="button"
                                className="mqx-fin-icon-btn mqx-fin-icon-btn--plus"
                                aria-label={`Добавить долг: ${t.title}`}
                                onClick={() => void addLiabilityFromTemplate(t)}
                              >
                                +
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mqx-fin-list" style={{ marginTop: 12 }}>
                    {(overview.liabilities || []).length === 0 ? (
                      <div className="mqx-fin-empty">Нет обязательств</div>
                    ) : (
                      (overview.liabilities || []).map((l) => (
                        <div key={l.id} className="mqx-fin-row mqx-fin-row--positions">
                          <div className="mqx-fin-row__l">
                            <div className="mqx-fin-row__title">{l.title}</div>
                            <div className="mqx-fin-row__sub">
                              <MoneyText value={l.monthly_payment} decimals={0} />/мес · долг{' '}
                              <MoneyText value={l.total_debt} decimals={0} />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="mqx-fin-icon-btn mqx-fin-icon-btn--minus"
                            aria-label={`Удалить долг ${l.title}`}
                            onClick={() => void handleDeleteLiability(l.id)}
                          >
                            −
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : null}
          </>
        ) : null}
      </div>
      )}
    </div>
  );
}
