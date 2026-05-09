import { Button, Cell, Input, List, Section, Select } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import { useEffect, useState } from 'react';

const FINANCE_TABS = [
  { id: 'invest', label: 'Инвестиции' },
  { id: 'insurance', label: 'Страховки' },
  { id: 'templates', label: 'Шаблоны' },
  { id: 'lists', label: 'Долги · активы' },
];

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

  const reloadExtra = async () => {
    try {
      const [pos, pol, tpl] = await Promise.all([
        API.listInvestPositions(),
        API.listPolicies(),
        API.getAssetTemplates(),
      ]);
      if (Array.isArray(pos)) setInvestPositions(pos);
      if (Array.isArray(pol)) setPolicies(pol);
      if (Array.isArray(tpl)) setAssetTemplates(tpl);
    } catch (e) {
      // не блокируем экран
    }
  };

  useEffect(() => {
    reloadExtra();
  }, []);

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

  if (!overview) return null;

  if (!premium) {
    return (
      <div className="mq-stack mq-stack-animate mq-stack--tight mq-fin-page">
      <div className="mq-enter-item">
        <div className="mq-slot-intro">Вкладки ниже — те же четыре задачи: вложения, страховки, шаблоны, списки долгов и активов.</div>
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
        <div className="mq-slot-intro">Easy MVP: депозит растёт в теле вклада, облигации платят купон на счёт каждый период.</div>
        <Cell multiline>
          <div className="mq-fin-block-head">Депозит</div>
          <div className="mq-fin-field-grid mq-fin-field-grid--with-cta">
            <Input header="Сумма (₽)" type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} />
            <Input header="% годовых" type="number" value={depositRate} onChange={(e) => setDepositRate(Number(e.target.value))} />
            <Button mode="filled" onClick={async () => {
              try {
                await API.openDeposit({ amount: depositAmount, annual_rate_percent: depositRate });
                showNotification('Депозит открыт', 'success');
                await refreshOverview();
                await reloadExtra();
              } catch (e) {
                showNotification(e?.detail || e?.message || 'Не удалось открыть депозит', 'error');
              }
            }}>Открыть</Button>
          </div>
        </Cell>

        <Cell multiline>
          <div className="mq-fin-block-head">Облигации</div>
          <div className="mq-fin-field-grid mq-fin-field-grid--with-cta">
            <Input header="Сумма (₽)" type="number" value={bondAmount} onChange={(e) => setBondAmount(Number(e.target.value))} />
            <Input header="% годовых" type="number" value={bondRate} onChange={(e) => setBondRate(Number(e.target.value))} />
            <Button mode="filled" onClick={async () => {
              try {
                await API.buyBond({ amount: bondAmount, annual_rate_percent: bondRate, title: 'Облигации (easy)' });
                showNotification('Облигации куплены', 'success');
                await refreshOverview();
                await reloadExtra();
              } catch (e) {
                showNotification(e?.detail || e?.message || 'Не удалось купить облигации', 'error');
              }
            }}>Купить</Button>
          </div>
        </Cell>

        <List>
          {investPositions.length === 0 && <Cell>Нет инвестиций</Cell>}
          {investPositions.map((p) => (
            <Cell key={p.id} multiline after={
              <Button size="s" mode="destructive" onClick={async () => {
                try {
                  await API.closeInvestPosition(p.id);
                  showNotification('Позиция закрыта', 'success');
                  await refreshOverview();
                  await reloadExtra();
                } catch (e) {
                  showNotification(e?.detail || e?.message || 'Не удалось закрыть позицию', 'error');
                }
              }}>Закрыть</Button>
            }>
              <div><strong>{p.title}</strong> ({p.kind})</div>
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
            <Input header="Премия в месяц (₽)" type="number" value={policyPremium} onChange={(e) => setPolicyPremium(Number(e.target.value))} />
            <Input header="Покрытие (лимит, ₽)" type="number" value={policyCoverage} onChange={(e) => setPolicyCoverage(Number(e.target.value))} />
            <Button mode="filled" className="mq-fin-btn-span2" stretched onClick={async () => {
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
            }}>Оформить полис</Button>
          </div>
        </Cell>

        <List>
          {policies.length === 0 && <Cell>Нет активных полисов</Cell>}
          {policies.map((p) => (
            <Cell key={p.id} multiline after={
              <Button size="s" mode="destructive" onClick={async () => {
                try {
                  await API.cancelPolicy(p.id);
                  showNotification('Полис отменён', 'success');
                  await reloadExtra();
                } catch (e) {
                  showNotification(e?.detail || e?.message || 'Не удалось отменить полис', 'error');
                }
              }}>Отменить</Button>
            }>
              <div><strong>{p.title}</strong> ({p.kind})</div>
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

      {financeTab === 'templates' && (
      <div role="tabpanel" id="finance-panel-templates" aria-labelledby="finance-tab-templates">
      <Section header="Типовые активы">
        <div className="mq-slot-intro">Готовые пресеты: добавляются в игру один тапом, с заданными стоимостью и обслуживанием.</div>
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
              <div><strong>{t.title}</strong></div>
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
      </div>
      )}

      {financeTab === 'lists' && (
      <div role="tabpanel" id="finance-panel-lists" aria-labelledby="finance-tab-lists">
      <>
      <Section header="Обязательства">
        <div className="mq-slot-intro">Живые платежи и просрочки по уже заведённым кредитам и займам.</div>
        <List>
          {overview.liabilities.length === 0 && <Cell>Нет обязательств</Cell>}
          {overview.liabilities.map(liability => (
            <Cell key={liability.id} multiline after={
              <Button size="s" mode="destructive" onClick={() => handleDeleteLiability(liability.id)}>
                Удалить
              </Button>
            }>
              <div><strong>{liability.title}</strong></div>
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
                  {Number(liability.overdue_periods) > 0 ? ` (${liability.overdue_periods} пер. подряд)` : ''}
                </div>
              )}
            </Cell>
          ))}
        </List>
      </Section>
      <Section header="Активы">
        <div className="mq-slot-intro">Обслуживание и опциональный доход по объектам уже в этом профиле.</div>
        <List>
          {overview.assets.length === 0 && <Cell>Нет активов</Cell>}
          {overview.assets.map(asset => (
            <Cell key={asset.id} multiline after={
              <Button size="s" mode="destructive" onClick={() => handleDeleteAsset(asset.id)}>
                Удалить
              </Button>
            }>
              <div><strong>{asset.title}</strong>{asset.kind && asset.kind !== 'generic' ? <span style={{ opacity: 0.75 }}> · {asset.kind}</span> : null}</div>
              <div>
                Стоимость: <MoneyText value={asset.asset_value} />
              </div>
              <div>
                Обслуживание: <MoneyText value={asset.monthly_maintenance_cost} /> / мес
              </div>
              <div>
                Доход:{' '}
                {typeof asset.monthly_income === 'number' && asset.monthly_income > 0 ? (
                  <>
                    <MoneyText value={asset.monthly_income} /> / мес
                  </>
                ) : (
                  '—'
                )}
              </div>
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
        <div className="mqx-fin-note">Сетка 2×2 — равномерно заполняет ширину и не «крошит» подписи.</div>
      </div>

      <div className="mqx-card mqx-fin-card" role="tabpanel" id={`finance-panel-${financeTab}`} aria-labelledby={`finance-tab-${financeTab}`}>
        <div className="mqx-card__title">
          {FINANCE_TABS.find(t => t.id === financeTab)?.label || 'Финансы'}
        </div>

        {financeTab === 'invest' ? (
          <>
            <div className="mqx-card__sub">Депозит растёт в теле вклада, облигации платят купон на счёт.</div>

            <div className="mqx-fin-grid" style={{ marginTop: 12 }}>
              <Input header="Депозит · сумма" type="number" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} />
              <Input header="Ставка" type="number" value={depositRate} onChange={(e) => setDepositRate(Number(e.target.value))} />
              <Button mode="filled" onClick={async () => {
                try {
                  await API.openDeposit({ amount: depositAmount, annual_rate_percent: depositRate });
                  showNotification('Депозит открыт', 'success');
                  await refreshOverview();
                  await reloadExtra();
                } catch (e) {
                  showNotification(e?.detail || e?.message || 'Не удалось открыть депозит', 'error');
                }
              }}>Открыть</Button>
              <Button mode="outline" onClick={reloadExtra}>Позиции</Button>
            </div>

            <div className="mqx-fin-list" style={{ marginTop: 12 }}>
              {investPositions.length === 0 ? (
                <div className="mqx-fin-empty">Нет инвестиций</div>
              ) : (
                investPositions.map((p) => (
                  <div key={p.id} className="mqx-fin-row">
                    <div className="mqx-fin-row__l">
                      <div className="mqx-fin-row__title">{p.title}</div>
                      <div className="mqx-fin-row__sub">{p.kind} · {p.annual_rate_percent}%</div>
                    </div>
                    <div className="mqx-fin-row__r">
                      <div className="mqx-fin-row__val"><MoneyText value={p.principal} /></div>
                      <Button size="s" mode="destructive" onClick={async () => {
                        try {
                          await API.closeInvestPosition(p.id);
                          showNotification('Позиция закрыта', 'success');
                          await refreshOverview();
                          await reloadExtra();
                        } catch (e) {
                          showNotification(e?.detail || e?.message || 'Не удалось закрыть позицию', 'error');
                        }
                      }}>Закрыть</Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mqx-fin-divider" />

            <div className="mqx-fin-grid" style={{ marginTop: 12 }}>
              <Input header="Облигации · сумма" type="number" value={bondAmount} onChange={(e) => setBondAmount(Number(e.target.value))} />
              <Input header="Ставка" type="number" value={bondRate} onChange={(e) => setBondRate(Number(e.target.value))} />
              <Button mode="filled" onClick={async () => {
                try {
                  await API.buyBond({ amount: bondAmount, annual_rate_percent: bondRate, title: 'Облигации (easy)' });
                  showNotification('Облигации куплены', 'success');
                  await refreshOverview();
                  await reloadExtra();
                } catch (e) {
                  showNotification(e?.detail || e?.message || 'Не удалось купить облигации', 'error');
                }
              }}>Купить</Button>
              <div />
            </div>
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
              <Input header="Премия / мес" type="number" value={policyPremium} onChange={(e) => setPolicyPremium(Number(e.target.value))} />
              <Input header="Покрытие" type="number" value={policyCoverage} onChange={(e) => setPolicyCoverage(Number(e.target.value))} />
              <div className="mqx-fin-span2">
                <Button mode="filled" stretched onClick={async () => {
                  try {
                    await API.buyPolicy({ kind: policyKind, monthly_premium: policyPremium, coverage_limit: policyCoverage });
                    showNotification('Полис оформлен', 'success');
                    await refreshOverview();
                    await reloadExtra();
                  } catch (e) {
                    showNotification(e?.detail || e?.message || 'Не удалось оформить полис', 'error');
                  }
                }}>Оформить полис</Button>
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
                      <div className="mqx-fin-row__sub">{p.kind} · <MoneyText value={p.monthly_premium} /> / мес</div>
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

        {financeTab === 'templates' ? (
          <>
            <div className="mqx-card__sub">Готовые пресеты активов — добавляются одним тапом.</div>
            <div className="mqx-fin-list" style={{ marginTop: 12 }}>
              {assetTemplates.length === 0 ? (
                <div className="mqx-fin-empty">Шаблоны не загружены</div>
              ) : (
                assetTemplates.map((t) => (
                  <div key={t.key} className="mqx-fin-row">
                    <div className="mqx-fin-row__l">
                      <div className="mqx-fin-row__title">{t.title}</div>
                      <div className="mqx-fin-row__sub">
                        Стоимость: <MoneyText value={t.asset_value} decimals={0} /> · Обслуживание: <MoneyText value={t.monthly_maintenance_cost} decimals={0} />/мес
                      </div>
                    </div>
                    <div className="mqx-fin-row__r">
                      <Button size="s" onClick={async () => {
                        try {
                          await API.createAssetFromTemplate(t.key);
                          showNotification('Актив добавлен', 'success');
                          await refreshOverview();
                          await reloadExtra();
                        } catch (e) {
                          showNotification(e?.detail || e?.message || 'Не удалось добавить актив', 'error');
                        }
                      }}>Добавить</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

        {financeTab === 'lists' ? (
          <>
            <div className="mqx-card__sub">Управление списками активов и обязательств.</div>
            <div className="mqx-fin-pair" style={{ marginTop: 12 }}>
              <div className="mqx-fin-subcard">
                <div className="mqx-fin-subhead">Активы</div>
                <div className="mqx-fin-list">
                  {(overview.assets || []).length === 0 ? (
                    <div className="mqx-fin-empty">Нет активов</div>
                  ) : (
                    (overview.assets || []).map((a) => (
                      <div key={a.id} className="mqx-fin-row">
                        <div className="mqx-fin-row__l">
                          <div className="mqx-fin-row__title">{a.title}</div>
                          <div className="mqx-fin-row__sub">
                            Стоимость: <MoneyText value={a.asset_value} decimals={0} /> · Обслуживание: <MoneyText value={a.monthly_maintenance_cost} decimals={0} />/мес
                          </div>
                        </div>
                        <div className="mqx-fin-row__r">
                          <Button size="s" mode="destructive" onClick={() => handleDeleteAsset(a.id)}>Удалить</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mqx-fin-subcard">
                <div className="mqx-fin-subhead">Обязательства</div>
                <div className="mqx-fin-list">
                  {(overview.liabilities || []).length === 0 ? (
                    <div className="mqx-fin-empty">Нет обязательств</div>
                  ) : (
                    (overview.liabilities || []).map((l) => (
                      <div key={l.id} className="mqx-fin-row">
                        <div className="mqx-fin-row__l">
                          <div className="mqx-fin-row__title">{l.title}</div>
                          <div className="mqx-fin-row__sub">
                            Долг: <MoneyText value={l.total_debt} decimals={0} /> · Платёж: <MoneyText value={l.monthly_payment} decimals={0} />/мес
                          </div>
                        </div>
                        <div className="mqx-fin-row__r">
                          <Button size="s" mode="destructive" onClick={() => handleDeleteLiability(l.id)}>Удалить</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}