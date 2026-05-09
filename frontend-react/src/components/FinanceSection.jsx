import { Button, Cell, Input, List, Section, Select } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import { useEffect, useState } from 'react';

const FINANCE_TABS = [
  { id: 'invest', label: 'Инвестиции' },
  { id: 'insurance', label: 'Страховки' },
  { id: 'portfolio', label: 'Активы · долги' },
];

const DEPOSIT_HELP =
  'Депозит растёт в теле вклада. Увеличивается на 1/12 от ставки вклада каждый период.';

const BOND_HELP =
  'Облигации платят купон на счёт. 1/12 от ставки добавляется на счёт автоматически в начале каждого периода.';

export function FinanceSection({ overview, refreshOverview, premium = false }) {
  const [financeTab, setFinanceTab] = useState('invest');
  const [investPositions, setInvestPositions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [depositAmount, setDepositAmount] = useState(10000);
  const [depositRate, setDepositRate] = useState(12);
  const [bondAmount, setBondAmount] = useState(10000);
  const [bondRate, setBondRate] = useState(10);
  const [policyKind, setPolicyKind] = useState('health');
  const [policyPremium, setPolicyPremium] = useState(1500);
  const [policyCoverage, setPolicyCoverage] = useState(100000);
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
                  <div className="mq-fin-block-head">Депозит</div>
                  <div className="mq-fin-field-grid mq-fin-field-grid--with-cta">
                    <Input
                      header="Сумма (₽)"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                    />
                    <Input
                      header="% годовых"
                      type="number"
                      value={depositRate}
                      onChange={(e) => setDepositRate(Number(e.target.value))}
                    />
                    <Button
                      mode="filled"
                      onClick={async () => {
                        try {
                          await API.openDeposit({ amount: depositAmount, annual_rate_percent: depositRate });
                          showNotification('Депозит открыт', 'success');
                          await refreshOverview();
                          await reloadExtra();
                        } catch (e) {
                          showNotification(e?.detail || e?.message || 'Не удалось открыть депозит', 'error');
                        }
                      }}
                    >
                      Открыть
                    </Button>
                  </div>
                </Cell>

                <Cell multiline>
                  <div className="mq-fin-block-head">Облигации</div>
                  <div className="mq-slot-intro" style={{ marginBottom: 8 }}>
                    {BOND_HELP}
                  </div>
                  <div className="mq-fin-field-grid mq-fin-field-grid--with-cta">
                    <Input
                      header="Сумма (₽)"
                      type="number"
                      value={bondAmount}
                      onChange={(e) => setBondAmount(Number(e.target.value))}
                    />
                    <Input
                      header="% годовых"
                      type="number"
                      value={bondRate}
                      onChange={(e) => setBondRate(Number(e.target.value))}
                    />
                    <Button
                      mode="filled"
                      onClick={async () => {
                        try {
                          await API.buyBond({
                            amount: bondAmount,
                            annual_rate_percent: bondRate,
                            title: 'Облигации (easy)',
                          });
                          showNotification('Облигации куплены', 'success');
                          await refreshOverview();
                          await reloadExtra();
                        } catch (e) {
                          showNotification(e?.detail || e?.message || 'Не удалось купить облигации', 'error');
                        }
                      }}
                    >
                      Открыть
                    </Button>
                  </div>
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
                        <strong>{p.title}</strong> ({p.kind})
                      </div>
                      <div>
                        Сумма: <MoneyText value={p.principal} />
                      </div>
                      <div>Ставка: {p.annual_rate_percent}%</div>
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
                      <Select header="Тип полиса" value={policyKind} onChange={(e) => setPolicyKind(e.target.value)}>
                        <option value="health">Здоровье</option>
                        <option value="property">Имущество</option>
                        <option value="car">Авто</option>
                      </Select>
                    </div>
                    <Input
                      header="Премия в месяц (₽)"
                      type="number"
                      value={policyPremium}
                      onChange={(e) => setPolicyPremium(Number(e.target.value))}
                    />
                    <Input
                      header="Покрытие (лимит, ₽)"
                      type="number"
                      value={policyCoverage}
                      onChange={(e) => setPolicyCoverage(Number(e.target.value))}
                    />
                    <Button
                      mode="filled"
                      className="mq-fin-btn-span2"
                      stretched
                      onClick={async () => {
                        try {
                          await API.buyPolicy({
                            kind: policyKind,
                            monthly_premium: policyPremium,
                            coverage_limit: policyCoverage,
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
                        Покрытие: <MoneyText value={p.coverage_limit} decimals={0} />
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
                        <div>
                          Стоимость: <MoneyText value={asset.asset_value} />
                        </div>
                        <div>
                          Обслуживание: <MoneyText value={asset.monthly_maintenance_cost} /> / мес
                        </div>
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
                        <div>
                          Долг: <MoneyText value={liability.total_debt} />
                        </div>
                        <div>Ставка: {liability.annual_rate_percent}%</div>
                        <div>
                          Платёж: <MoneyText value={liability.monthly_payment} /> / мес
                        </div>
                        {(Number(liability.overdue_amount) > 0 || Number(liability.overdue_periods) > 0) && (
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
      await API.openDeposit({ amount: depositAmount, annual_rate_percent: depositRate });
      showNotification('Депозит открыт', 'success');
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
        annual_rate_percent: bondRate,
        title: 'Облигации (easy)',
      });
      showNotification('Облигации добавлены', 'success');
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

  return (
    <div className="mqx-fin">
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

      <div
        className="mqx-card mqx-fin-card"
        role="tabpanel"
        id={`finance-panel-${financeTab}`}
        aria-labelledby={`finance-tab-${financeTab}`}
      >
        <div className="mqx-card__title">{FINANCE_TABS.find((t) => t.id === financeTab)?.label || 'Финансы'}</div>

        {financeTab === 'invest' ? (
          <>
            <div className="mqx-fin-subtabs mqx-fin-subtabs-row" role="tablist" aria-label="Инструмент">
              <button
                type="button"
                role="tab"
                aria-selected={investProductTab === 'deposit'}
                className={`mqx-fin-subtab ${investProductTab === 'deposit' ? 'mqx-fin-subtab--active' : ''}`}
                onClick={() => setInvestProductTab('deposit')}
              >
                Депозиты
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={investProductTab === 'bond'}
                className={`mqx-fin-subtab ${investProductTab === 'bond' ? 'mqx-fin-subtab--active' : ''}`}
                onClick={() => setInvestProductTab('bond')}
              >
                Облигации
              </button>
            </div>

            <div className="mqx-fin-longhelp">{selectedInvestSubtitle}</div>

            {investUiMode === 'form' ? (
              <>
                <div className="mqx-fin-grid mqx-fin-grid-actions" style={{ marginTop: 12 }}>
                  <Input
                    header={investProductTab === 'deposit' ? 'Депозит · сумма' : 'Облигации · сумма'}
                    type="number"
                    value={investProductTab === 'deposit' ? depositAmount : bondAmount}
                    onChange={(e) =>
                      investProductTab === 'deposit'
                        ? setDepositAmount(Number(e.target.value))
                        : setBondAmount(Number(e.target.value))
                    }
                  />
                  <Input
                    header="Ставка (% годовых)"
                    type="number"
                    value={investProductTab === 'deposit' ? depositRate : bondRate}
                    onChange={(e) =>
                      investProductTab === 'deposit'
                        ? setDepositRate(Number(e.target.value))
                        : setBondRate(Number(e.target.value))
                    }
                  />
                  <Button mode="filled" onClick={() => void (investProductTab === 'deposit' ? openDeposit() : openBond())}>
                    Открыть
                  </Button>
                  <Button mode="outline" onClick={() => setInvestUiMode('positions')}>
                    Позиции
                  </Button>
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
                      <div key={p.id} className="mqx-fin-row mqx-fin-row--positions">
                        <div className="mqx-fin-row__l">
                          <div className="mqx-fin-row__title">{p.title}</div>
                          <div className="mqx-fin-row__sub">{p.kind} · ставка {p.annual_rate_percent}%</div>
                        </div>
                        <div className="mqx-fin-row__r">
                          <span className="mqx-fin-row__val"><MoneyText value={p.principal} /></span>
                          <button type="button" className="mqx-fin-icon-btn mqx-fin-icon-btn--minus" aria-label="Закрыть позицию" onClick={() => void closeInvest(p.id)}>
                            −
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        ) : null}

        {financeTab === 'insurance' ? (
          <>
            <div className="mqx-card__sub">Премия списывается в конце периода.</div>
            <div className="mqx-fin-grid mqx-fin-grid--2" style={{ marginTop: 12 }}>
              <div className="mqx-fin-span2">
                <Select header="Тип полиса" value={policyKind} onChange={(e) => setPolicyKind(e.target.value)}>
                  <option value="health">Здоровье</option>
                  <option value="property">Имущество</option>
                  <option value="car">Авто</option>
                </Select>
              </div>
              <Input
                header="Премия / мес"
                type="number"
                value={policyPremium}
                onChange={(e) => setPolicyPremium(Number(e.target.value))}
              />
              <Input
                header="Покрытие"
                type="number"
                value={policyCoverage}
                onChange={(e) => setPolicyCoverage(Number(e.target.value))}
              />
              <div className="mqx-fin-span2">
                <Button
                  mode="filled"
                  stretched
                  onClick={async () => {
                    try {
                      await API.buyPolicy({
                        kind: policyKind,
                        monthly_premium: policyPremium,
                        coverage_limit: policyCoverage,
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
                      <div className="mqx-fin-row__val"><MoneyText value={p.coverage_limit} decimals={0} /></div>
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

        {financeTab === 'portfolio' ? (
          <>
            <div className="mqx-fin-subtabs mqx-fin-subtabs-row" role="tablist" aria-label="Портфель">
              <button
                type="button"
                role="tab"
                aria-selected={portfolioTab === 'assets'}
                className={`mqx-fin-subtab ${portfolioTab === 'assets' ? 'mqx-fin-subtab--active' : ''}`}
                onClick={() => {
                  setPortfolioTab('assets');
                  setExpandedDebtTpl(null);
                }}
              >
                Активы
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={portfolioTab === 'debts'}
                className={`mqx-fin-subtab ${portfolioTab === 'debts' ? 'mqx-fin-subtab--active' : ''}`}
                onClick={() => {
                  setPortfolioTab('debts');
                  setExpandedAssetTpl(null);
                }}
              >
                Долги
              </button>
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
    </div>
  );
}
