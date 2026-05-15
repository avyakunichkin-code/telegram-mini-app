import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';

const ASSET_KIND_LABELS = {
  residential: 'Недвижимость',
  rental: 'Арендный бизнес',
  vehicle: 'Транспорт',
  taxi: 'Арендный бизнес',
  generic: 'Актив',
};

function assetKindLabel(kind) {
  if (!kind || kind === 'generic') return 'Актив';
  return ASSET_KIND_LABELS[kind] || kind;
}

function assetTemplateMeta(t) {
  return (
    <>
      Стоимость: <MoneyText value={t.asset_value} decimals={0} />
      {' · '}
      Обслуживание: <MoneyText value={t.monthly_maintenance_cost} decimals={0} />
      /мес
      {Number(t.monthly_income) > 0 ? (
        <>
          {' · '}
          Доход: <MoneyText value={t.monthly_income} decimals={0} />
          /мес
        </>
      ) : null}
    </>
  );
}

function liabilityTemplateMeta(t) {
  return (
    <>
      Долг: <MoneyText value={t.total_debt} decimals={0} /> · Платёж:{' '}
      <MoneyText value={t.monthly_payment} decimals={0} />
      /мес · {t.annual_rate_percent}% годовых
    </>
  );
}

function PositionCard({ kicker, name, valueNode, onDelete }) {
  return (
    <div className="mqx-capital-position-card">
      <div>
        <div className="mqx-capital-position-card__kicker">{kicker}</div>
        <div className="mqx-capital-position-card__name">{name}</div>
        <div className="mqx-capital-position-card__value">{valueNode}</div>
      </div>
      <button type="button" className="mqx-capital-delete-btn" onClick={onDelete}>
        Удалить
      </button>
    </div>
  );
}

function PositionsBlock({ kicker, title, count, children }) {
  return (
    <section className="mqx-card mqx-capital-card mqx-capital-positions-block">
      <div className="mqx-capital-positions-block__head">
        <div>
          <div className="mqx-capital-positions-block__kicker">{kicker}</div>
          <h2 className="mqx-capital-positions-block__title">{title}</h2>
        </div>
        <div className="mqx-capital-positions-block__badge">
          {count} {count === 1 ? 'позиция' : 'позиции'}
        </div>
      </div>
      <div className="mqx-capital-position-list">{children}</div>
    </section>
  );
}

export function CapitalPortfolioPanels({
  activeTabLabel,
  portfolioTab,
  setPortfolioTab,
  setExpandedDebtTpl,
  setExpandedAssetTpl,
  portfolioAssetsMode,
  setPortfolioAssetsMode,
  portfolioDebtsMode,
  setPortfolioDebtsMode,
  assetTemplates,
  liabilityTemplates,
  ownedAssets,
  ownedLiabilities,
  refreshOverview,
  reloadExtra,
  handleDeleteAsset,
  handleDeleteLiability,
  addLiabilityFromTemplate,
}) {
  return (
    <>
      <section
        className="mqx-card mqx-capital-card"
        role="tabpanel"
        id="finance-panel-portfolio"
        aria-labelledby="finance-tab-portfolio"
      >
        <h2 className="mqx-capital-card__title">{activeTabLabel}</h2>

        <div className="mqx-fin-subtabs mqx-capital-subtabs" role="tablist" aria-label="Портфель">
          <button
            type="button"
            role="tab"
            aria-selected={portfolioTab === 'assets'}
            className={`mqx-capital-subtab ${portfolioTab === 'assets' ? 'mqx-capital-subtab--active' : ''}`}
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
            className={`mqx-capital-subtab ${portfolioTab === 'debts' ? 'mqx-capital-subtab--active' : ''}`}
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
            <p className="mqx-capital-lead">Покупка из шаблона списывает стоимость с текущего счёта.</p>
            <div className="mqx-capital-mode-grid">
              <button
                type="button"
                className={`mqx-capital-mode-btn ${portfolioAssetsMode === 'add' ? 'mqx-capital-mode-btn--active' : ''}`}
                onClick={() => setPortfolioAssetsMode('add')}
              >
                Добавить актив
              </button>
              <button
                type="button"
                className={`mqx-capital-mode-btn mqx-capital-mode-btn--ghost ${portfolioAssetsMode === 'positions' ? 'mqx-capital-mode-btn--ghost-active' : ''}`}
                onClick={() => setPortfolioAssetsMode('positions')}
              >
                Позиции
              </button>
            </div>

            {portfolioAssetsMode === 'add' ? (
              <div className="mqx-capital-template-list">
                {assetTemplates.length === 0 ? (
                  <div className="mqx-fin-empty">Шаблоны не загружены</div>
                ) : (
                  assetTemplates.map((t) => (
                    <div key={t.key} className="mqx-capital-template-row">
                      <div className="mqx-capital-template-row__body">
                        <div className="mqx-capital-template-row__title">{t.title}</div>
                        <div className="mqx-capital-template-row__meta">{assetTemplateMeta(t)}</div>
                      </div>
                      <button
                        type="button"
                        className="mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn"
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
                  ))
                )}
              </div>
            ) : (
              <div className="mqx-capital-position-list">
                {ownedAssets.length === 0 ? (
                  <div className="mqx-fin-empty">Нет активов</div>
                ) : (
                  ownedAssets.map((a) => (
                    <PositionCard
                      key={a.id}
                      kicker={assetKindLabel(a.kind)}
                      name={a.title}
                      valueNode={<MoneyText value={a.asset_value} decimals={0} />}
                      onDelete={() => void handleDeleteAsset(a.id)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        ) : null}

        {portfolioTab === 'debts' ? (
          <>
            <p className="mqx-capital-lead">
              Новый долг зачисляет сумму на счёт; закрытие возвращает тело и гасит просрочку.
            </p>
            <div className="mqx-capital-mode-grid">
              <button
                type="button"
                className={`mqx-capital-mode-btn ${portfolioDebtsMode === 'add' ? 'mqx-capital-mode-btn--active' : ''}`}
                onClick={() => setPortfolioDebtsMode('add')}
              >
                Добавить долг
              </button>
              <button
                type="button"
                className={`mqx-capital-mode-btn mqx-capital-mode-btn--ghost ${portfolioDebtsMode === 'positions' ? 'mqx-capital-mode-btn--ghost-active' : ''}`}
                onClick={() => setPortfolioDebtsMode('positions')}
              >
                Позиции
              </button>
            </div>

            {portfolioDebtsMode === 'add' ? (
              <div className="mqx-capital-template-list">
                {liabilityTemplates.length === 0 ? (
                  <div className="mqx-fin-empty">Шаблоны не загружены</div>
                ) : (
                  liabilityTemplates.map((t) => (
                    <div key={t.key} className="mqx-capital-template-row">
                      <div className="mqx-capital-template-row__body">
                        <div className="mqx-capital-template-row__title">{t.title}</div>
                        <div className="mqx-capital-template-row__meta">{liabilityTemplateMeta(t)}</div>
                      </div>
                      <button
                        type="button"
                        className="mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn"
                        aria-label={`Добавить долг: ${t.title}`}
                        onClick={() => void addLiabilityFromTemplate(t)}
                      >
                        +
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="mqx-capital-position-list">
                {ownedLiabilities.length === 0 ? (
                  <div className="mqx-fin-empty">Нет обязательств</div>
                ) : (
                  ownedLiabilities.map((l) => (
                    <PositionCard
                      key={l.id}
                      kicker="Долг"
                      name={l.title}
                      valueNode={<MoneyText value={l.total_debt} decimals={0} />}
                      onDelete={() => void handleDeleteLiability(l.id)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        ) : null}
      </section>

      {portfolioTab === 'assets' && portfolioAssetsMode === 'add' && ownedAssets.length > 0 ? (
        <PositionsBlock kicker="Positions" title="Ваши активы" count={ownedAssets.length}>
          {ownedAssets.map((a) => (
            <PositionCard
              key={a.id}
              kicker={assetKindLabel(a.kind)}
              name={a.title}
              valueNode={<MoneyText value={a.asset_value} decimals={0} />}
              onDelete={() => void handleDeleteAsset(a.id)}
            />
          ))}
        </PositionsBlock>
      ) : null}

      {portfolioTab === 'debts' && portfolioDebtsMode === 'add' && ownedLiabilities.length > 0 ? (
        <PositionsBlock kicker="Positions" title="Ваши долги" count={ownedLiabilities.length}>
          {ownedLiabilities.map((l) => (
            <PositionCard
              key={l.id}
              kicker="Долг"
              name={l.title}
              valueNode={<MoneyText value={l.total_debt} decimals={0} />}
              onDelete={() => void handleDeleteLiability(l.id)}
            />
          ))}
        </PositionsBlock>
      ) : null}
    </>
  );
}
