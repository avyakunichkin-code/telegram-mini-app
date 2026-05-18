import { API } from '../api';
import { showNotification } from './notifications';
import {
  AssetPositionMetrics,
  AssetTemplateMetrics,
  CapitalPositionCard,
  LiabilityPositionMetrics,
  LiabilityTemplateMetrics,
} from './mqx';

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
          className={`mqx-capital-subtab${portfolioTab === 'assets' ? ' mqx-capital-subtab--active' : ''}`}
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
          className={`mqx-capital-subtab${portfolioTab === 'debts' ? ' mqx-capital-subtab--active' : ''}`}
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
              className={`mqx-capital-mode-btn${portfolioAssetsMode === 'add' ? ' mqx-capital-mode-btn--active' : ''}`}
              onClick={() => setPortfolioAssetsMode('add')}
            >
              Добавить актив
            </button>
            <button
              type="button"
              className={`mqx-capital-mode-btn${portfolioAssetsMode === 'positions' ? ' mqx-capital-mode-btn--active' : ''}`}
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
                  <CapitalPositionCard
                    key={t.key}
                    variant="asset"
                    kicker={assetKindLabel(t.kind)}
                    title={t.title}
                    metrics={
                      <AssetTemplateMetrics
                        assetValue={t.asset_value}
                        monthlyMaintenanceCost={t.monthly_maintenance_cost}
                        monthlyIncome={t.monthly_income}
                      />
                    }
                    action={{
                      className: 'mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn',
                      onClick: async () => {
                        try {
                          await API.createAssetFromTemplate(t.key);
                          showNotification('Актив добавлен', 'success');
                          await refreshOverview();
                          await reloadExtra();
                        } catch (e) {
                          showNotification(e?.detail || e?.message || 'Не удалось добавить актив', 'error');
                        }
                      },
                    }}
                    actionLabel="+"
                    actionAriaLabel={`Добавить актив: ${t.title}`}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="mqx-capital-position-list">
              {ownedAssets.length === 0 ? (
                <div className="mqx-fin-empty">Нет активов</div>
              ) : (
                ownedAssets.map((a) => (
                  <CapitalPositionCard
                    key={a.id}
                    variant="asset"
                    kicker={assetKindLabel(a.kind)}
                    title={a.title}
                    metrics={
                      <AssetPositionMetrics
                        assetValue={a.asset_value}
                        monthlyMaintenanceCost={a.monthly_maintenance_cost}
                        monthlyIncome={a.monthly_income}
                      />
                    }
                    action={{
                      className: 'mqx-capital-delete-btn',
                      onClick: () => void handleDeleteAsset(a.id),
                    }}
                    actionLabel="Удалить"
                    actionAriaLabel={`Удалить актив ${a.title}`}
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
              className={`mqx-capital-mode-btn${portfolioDebtsMode === 'add' ? ' mqx-capital-mode-btn--active' : ''}`}
              onClick={() => setPortfolioDebtsMode('add')}
            >
              Добавить долг
            </button>
            <button
              type="button"
              className={`mqx-capital-mode-btn${portfolioDebtsMode === 'positions' ? ' mqx-capital-mode-btn--active' : ''}`}
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
                  <CapitalPositionCard
                    key={t.key}
                    variant="liability"
                    kicker="Долг"
                    title={t.title}
                    metrics={
                      <LiabilityTemplateMetrics
                        totalDebt={t.total_debt}
                        monthlyPayment={t.monthly_payment}
                        annualRatePercent={t.annual_rate_percent}
                      />
                    }
                    action={{
                      className: 'mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn',
                      onClick: () => void addLiabilityFromTemplate(t),
                    }}
                    actionLabel="+"
                    actionAriaLabel={`Добавить долг: ${t.title}`}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="mqx-capital-position-list">
              {ownedLiabilities.length === 0 ? (
                <div className="mqx-fin-empty">Нет обязательств</div>
              ) : (
                ownedLiabilities.map((l) => (
                  <CapitalPositionCard
                    key={l.id}
                    variant="liability"
                    kicker="Долг"
                    title={l.title}
                    metrics={
                      <LiabilityPositionMetrics
                        totalDebt={l.total_debt}
                        monthlyPayment={l.monthly_payment}
                        annualRatePercent={l.annual_rate_percent}
                        overdueAmount={l.overdue_amount}
                      />
                    }
                    action={{
                      className: 'mqx-capital-delete-btn',
                      onClick: () => void handleDeleteLiability(l.id),
                    }}
                    actionLabel="Удалить"
                    actionAriaLabel={`Удалить долг ${l.title}`}
                  />
                ))
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
