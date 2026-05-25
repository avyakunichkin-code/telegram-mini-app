import { Button, Cell, Input, List, Section, Select } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import { useEffect, useMemo, useState } from 'react';
import { filterFinanceTabs, getMechanicsFromOverview } from '../utils/starterMechanics';
import { CapitalLiabilitiesPanel, CapitalPropertyPanel } from './CapitalPortfolioPanels';
import { InvestProductForm } from './InvestProductForm';
import { InvestPositionRow } from './InvestPositionRow';
import { InvestPositionMetrics } from './InvestPositionMetrics';
import {
  AssetPositionMetrics,
  InsuranceSection,
  LiabilityPositionMetrics,
  MqxCapitalEmpty,
  MqxModeButton,
  MqxSectionSeg,
  MqxSubtab,
  useMqxConfirm,
} from './mqx';
import { CapitalPeriodFlowsBlock } from './mqx/layout/CapitalPeriodFlowsBlock';
import { MqxCapitalSectionAccordion } from './mqx/layout/MqxCapitalSectionAccordion';
import {
  BOND_ANNUAL_RATE_PERCENT,
  clampInvestAmount,
  DEPOSIT_ANNUAL_RATE_PERCENT,
} from '../constants/investProducts';

export const FINANCE_TABS_LEGACY = [
  { id: 'invest', label: 'Инвестиции' },
  { id: 'insurance', label: 'Страховки' },
  { id: 'portfolio', label: 'Активы · долги' },
];

/** Вкладки страницы «Управление капиталом» (premium, T2 wrap 3+2). */
export const FINANCE_TABS_CAPITAL = [
  { id: 'invest', label: 'Инвестиции' },
  { id: 'insurance', label: 'Страховки' },
  { id: 'property', label: 'Имущество' },
  { id: 'liabilities', label: 'Обязательства' },
];

/** @deprecated Используйте FINANCE_TABS_LEGACY или FINANCE_TABS_CAPITAL */
export const FINANCE_TABS = FINANCE_TABS_LEGACY;

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
  capitalInline = false,
  capitalAccordion = false,
  openFlowsSection = null,
  mechanics: mechanicsProp = null,
}) {
  const [financeTabInternal, setFinanceTabInternal] = useState('invest');
  const financeTab = financeTabProp ?? financeTabInternal;
  const setFinanceTab = onFinanceTabChange ?? setFinanceTabInternal;
  const { confirm, dialog } = useMqxConfirm();
  const [investPositions, setInvestPositions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);
  const [bondAmount, setBondAmount] = useState(0);
  const [buyingPlanKey, setBuyingPlanKey] = useState(null);
  const [cancellingPolicyId, setCancellingPolicyId] = useState(null);
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

  const mechanics = useMemo(
    () => mechanicsProp ?? getMechanicsFromOverview(overview),
    [mechanicsProp, overview],
  );

  const tabsCatalog = useMemo(() => {
    const base = capitalInline ? FINANCE_TABS_CAPITAL : FINANCE_TABS_LEGACY;
    return filterFinanceTabs(base, mechanics);
  }, [capitalInline, mechanics]);

  useEffect(() => {
    if (!tabsCatalog.length) return;
    if (!tabsCatalog.some((t) => t.id === financeTab)) {
      setFinanceTab(tabsCatalog[0].id);
    }
  }, [tabsCatalog, financeTab, setFinanceTab]);

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

  const buyInsurancePlan = async (plan) => {
    setBuyingPlanKey(plan.plan_key);
    try {
      await API.buyPolicy({ plan_key: plan.plan_key });
      showNotification('Полис оформлен', 'success');
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось оформить полис', 'error');
    } finally {
      setBuyingPlanKey(null);
    }
  };

  const cancelInsurancePolicy = async (policyId) => {
    const policy = policies.find((p) => p.id === policyId);
    const ok = await confirm({
      title: 'Отменить полис?',
      message: policy ? `«${policy.title}» перестанет действовать.` : 'Полис перестанет действовать.',
    });
    if (!ok) return;

    setCancellingPolicyId(policyId);
    try {
      await API.cancelPolicy(policyId);
      showNotification('Полис отменён', 'success');
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось отменить полис', 'error');
    } finally {
      setCancellingPolicyId(null);
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
              {tabsCatalog.map((t) => (
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
          {financeTab === 'invest' && mechanics.capital_invest && (
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

          {financeTab === 'insurance' && mechanics.capital_insurance && (
            <div role="tabpanel" id="finance-panel-insurance" aria-labelledby="finance-tab-insurance">
              <Section header="Страховки">
                <Cell multiline>
                  <InsuranceSection
                    policies={policies}
                    buyingPlanKey={buyingPlanKey}
                    cancellingPolicyId={cancellingPolicyId}
                    onBuy={buyInsurancePlan}
                    onCancel={cancelInsurancePolicy}
                  />
                </Cell>
              </Section>
            </div>
          )}

          {financeTab === 'portfolio' &&
            (mechanics.capital_property || mechanics.capital_liabilities) && (
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

  const requestCloseInvest = async (position) => {
    const ok = await confirm({
      title: 'Закрыть позицию?',
      message: `«${position.title}» будет закрыта.`,
    });
    if (ok) await closeInvest(position.id);
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

  const activeTabLabel = tabsCatalog.find((t) => t.id === financeTab)?.label || 'Финансы';
  const ownedAssets = overview.assets || [];
  const ownedLiabilities = overview.liabilities || [];
  const investSegMode = investUiMode === 'form' ? 'add' : 'mine';
  const propertySegMode = portfolioAssetsMode === 'positions' ? 'mine' : portfolioAssetsMode;
  const liabilitiesSegMode = portfolioDebtsMode === 'positions' ? 'mine' : portfolioDebtsMode;

  const investCapitalBlock = (
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
      <MqxSectionSeg
        mode={investSegMode}
        onModeChange={(m) => setInvestUiMode(m === 'add' ? 'form' : 'positions')}
        addLabel="Оформить"
        mineLabel="Позиции"
        mineCount={selectedInvestPositions.length}
      />
      {investUiMode === 'form' ? (
        <InvestProductForm
          embedded
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
      ) : (
        <div className="mqx-capital-position-list">
          {selectedInvestPositions.length === 0 ? (
            <MqxCapitalEmpty
              message={`Нет позиций: ${investProductTab === 'deposit' ? 'депозитов' : 'облигаций'}`}
              actionLabel="Оформить"
              onAction={() => setInvestUiMode('form')}
            />
          ) : (
            selectedInvestPositions.map((p) => (
              <InvestPositionRow
                key={p.id}
                position={p}
                onCloseRequest={() => void requestCloseInvest(p)}
              />
            ))
          )}
        </div>
      )}
    </>
  );

  if (capitalLayout && capitalAccordion) {
    const investMeta = `${investPositions.length} поз.`;
    const insuranceMeta = `${policies.length} полис.`;
    const propertyMeta = `${ownedAssets.length} поз.`;
    const liabilitiesMeta = `${ownedLiabilities.length} долг.`;

    return (
      <div className="mqx-fin mqx-fin--capital">
        {dialog}
        <div className="mqx-capital-accordion-stack">
          <CapitalPeriodFlowsBlock
            overview={overview}
            investPositions={investPositions}
            policies={policies}
            openFlowsSection={openFlowsSection}
          />
          {mechanics.capital_invest ? (
            <MqxCapitalSectionAccordion title="Инвестиции" meta={investMeta}>
              {investCapitalBlock}
            </MqxCapitalSectionAccordion>
          ) : null}
          {mechanics.capital_insurance ? (
            <MqxCapitalSectionAccordion title="Страховки" meta={insuranceMeta}>
              <InsuranceSection
                policies={policies}
                buyingPlanKey={buyingPlanKey}
                cancellingPolicyId={cancellingPolicyId}
                onBuy={buyInsurancePlan}
                onCancel={cancelInsurancePolicy}
                intro="Премия списывается в конце периода. При страховом случае — полная сумма выплаты, полис закрывается."
                useSectionSeg
              />
            </MqxCapitalSectionAccordion>
          ) : null}
          {mechanics.capital_property ? (
            <MqxCapitalSectionAccordion title="Имущество" meta={propertyMeta}>
              <CapitalPropertyPanel
                assetTemplates={assetTemplates}
                ownedAssets={ownedAssets}
                sectionMode={propertySegMode}
                setSectionMode={(m) => setPortfolioAssetsMode(m === 'mine' ? 'positions' : m)}
                refreshOverview={refreshOverview}
                reloadExtra={reloadExtra}
                handleDeleteAsset={handleDeleteAsset}
              />
            </MqxCapitalSectionAccordion>
          ) : null}
          {mechanics.capital_liabilities ? (
            <MqxCapitalSectionAccordion title="Обязательства" meta={liabilitiesMeta}>
              <CapitalLiabilitiesPanel
                liabilityTemplates={liabilityTemplates}
                ownedLiabilities={ownedLiabilities}
                sectionMode={liabilitiesSegMode}
                setSectionMode={(m) => setPortfolioDebtsMode(m === 'mine' ? 'positions' : m)}
                addLiabilityFromTemplate={addLiabilityFromTemplate}
                handleDeleteLiability={handleDeleteLiability}
              />
            </MqxCapitalSectionAccordion>
          ) : null}
        </div>
      </div>
    );
  }

  if (capitalLayout && capitalInline) {
    return (
      <div className="mqx-fin mqx-fin--capital">
        {dialog}
        <div
          className="mqx-capital-card__panel"
          role="tabpanel"
          id={`finance-panel-${financeTab}`}
          aria-labelledby={`finance-tab-${financeTab}`}
        >
          {financeTab === 'invest' && mechanics.capital_invest ? investCapitalBlock : null}
          {financeTab === 'insurance' && mechanics.capital_insurance ? (
            <InsuranceSection
              policies={policies}
              buyingPlanKey={buyingPlanKey}
              cancellingPolicyId={cancellingPolicyId}
              onBuy={buyInsurancePlan}
              onCancel={cancelInsurancePolicy}
              intro="Премия списывается в конце периода. При страховом случае — полная сумма выплаты, полис закрывается."
              useSectionSeg
            />
          ) : null}
          {financeTab === 'property' && mechanics.capital_property ? (
            <CapitalPropertyPanel
              assetTemplates={assetTemplates}
              ownedAssets={ownedAssets}
              sectionMode={propertySegMode}
              setSectionMode={(m) => setPortfolioAssetsMode(m === 'mine' ? 'positions' : m)}
              refreshOverview={refreshOverview}
              reloadExtra={reloadExtra}
              handleDeleteAsset={handleDeleteAsset}
            />
          ) : null}
          {financeTab === 'liabilities' && mechanics.capital_liabilities ? (
            <CapitalLiabilitiesPanel
              liabilityTemplates={liabilityTemplates}
              ownedLiabilities={ownedLiabilities}
              sectionMode={liabilitiesSegMode}
              setSectionMode={(m) => setPortfolioDebtsMode(m === 'mine' ? 'positions' : m)}
              addLiabilityFromTemplate={addLiabilityFromTemplate}
              handleDeleteLiability={handleDeleteLiability}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`mqx-fin ${capitalLayout ? 'mqx-fin--capital' : ''}`}>
      {dialog}
      {!hideSectionsCard ? (
        <div className="mqx-card mqx-fin-card">
          <div className="mqx-card__title">Разделы</div>
          <div className="mqx-fin-tabs" role="tablist" aria-label="Разделы финансов">
          {tabsCatalog.map((t) => (
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

      {financeTab === 'portfolio' && capitalLayout ? null : (
      <div
        className={`mqx-card mqx-fin-card ${capitalLayout ? 'mqx-capital-card' : ''}`}
        role="tabpanel"
        id={`finance-panel-${financeTab}`}
        aria-labelledby={`finance-tab-${financeTab}`}
      >
        <h2 className={capitalLayout ? 'mqx-capital-card__title' : 'mqx-card__title'}>{activeTabLabel}</h2>

        {financeTab === 'invest' && mechanics.capital_invest ? (
          capitalLayout ? (
            investCapitalBlock
          ) : (
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
                        onCloseRequest={() => void requestCloseInvest(p)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </>
          )
        ) : null}

        {financeTab === 'insurance' && mechanics.capital_insurance ? (
          <InsuranceSection
            policies={policies}
            buyingPlanKey={buyingPlanKey}
            cancellingPolicyId={cancellingPolicyId}
            onBuy={buyInsurancePlan}
            onCancel={cancelInsurancePolicy}
            intro="Премия списывается в конце периода. При страховом случае — полная сумма выплаты, полис закрывается."
            useSectionSeg={capitalLayout}
          />
        ) : null}

        {financeTab === 'portfolio' &&
          !capitalLayout &&
          (mechanics.capital_property || mechanics.capital_liabilities) ? (
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
                                <div
                                  className="mqx-fin-acc-meta"
                                  title="Суммы в модели совпадают с помесячным списанием и начислением в конце каждого периода"
                                >
                                  Стоимость: <MoneyText value={t.asset_value} decimals={0} /> · Обслуживание:{' '}
                                  <MoneyText value={t.monthly_maintenance_cost} decimals={0} />
                                  {Number(t.monthly_income) > 0 ? (
                                    <>
                                      {' '}
                                      · Доход: <MoneyText value={t.monthly_income} decimals={0} />
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
                            <div className="mqx-fin-row__sub" title="Суммы за период (в модели — как ежемесячные)">
                              <MoneyText value={a.asset_value} decimals={0} /> · обслуж.{' '}
                              <MoneyText value={a.monthly_maintenance_cost} decimals={0} />
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
                              <div className="mqx-fin-acc-meta" title="Платёж и ставка за период (в модели — ежемесячный платёж)">
                                Долг: <MoneyText value={t.total_debt} decimals={0} /> · Ставка: {t.annual_rate_percent} · платёж{' '}
                                <MoneyText value={t.monthly_payment} decimals={0} />
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
                            <div
                              className="mqx-fin-row__sub"
                              title="Остаток долга и платёж за период (в модели — ежемесячный платёж)"
                            >
                              Долг <MoneyText value={l.total_debt} decimals={0} /> · платёж{' '}
                              <MoneyText value={l.monthly_payment} decimals={0} />
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
