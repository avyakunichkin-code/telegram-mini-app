import { API } from '../api';
import { showNotification } from './notifications';
import { MoneyText } from './MoneyText';
import {
  AssetPositionMetrics,
  AssetTemplateMetrics,
  CapitalPositionCard,
  LiabilityPositionMetrics,
  LiabilityTemplateMetrics,
  MqxFinListRow,
  MqxModeButton,
  MqxRowAction,
  MqxSubtab,
  useMqxConfirm,
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
  const { confirm, dialog } = useMqxConfirm();

  const confirmDeleteAsset = async (asset) => {
    const ok = await confirm({
      title: 'Удалить актив?',
      message: `«${asset.title}» будет снят с учёта.`,
    });
    if (ok) await handleDeleteAsset(asset.id);
  };

  const confirmDeleteLiability = async (liability) => {
    const ok = await confirm({
      title: 'Удалить обязательство?',
      message: `«${liability.title}» будет закрыто и снято с учёта.`,
    });
    if (ok) await handleDeleteLiability(liability.id);
  };

  return (
    <section
      className="mqx-card mqx-capital-card"
      role="tabpanel"
      id="finance-panel-portfolio"
      aria-labelledby="finance-tab-portfolio"
    >
      {dialog}

      <h2 className="mqx-capital-card__title">{activeTabLabel}</h2>

      <div className="mqx-fin-subtabs mqx-capital-subtabs" role="tablist" aria-label="Портфель">
        <MqxSubtab
          capital
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
          capital
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
          <p className="mqx-capital-lead">Покупка из шаблона списывает стоимость с текущего счёта.</p>
          <div className="mqx-capital-mode-grid">
            <MqxModeButton active={portfolioAssetsMode === 'add'} onClick={() => setPortfolioAssetsMode('add')}>
              Добавить актив
            </MqxModeButton>
            <MqxModeButton
              active={portfolioAssetsMode === 'positions'}
              onClick={() => setPortfolioAssetsMode('positions')}
            >
              Позиции
            </MqxModeButton>
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
                  <MqxFinListRow
                    key={a.id}
                    title={a.title}
                    subtitle={
                      <>
                        <MoneyText value={a.asset_value} decimals={0} /> · обслуж.{' '}
                        <MoneyText value={a.monthly_maintenance_cost} decimals={0} />
                        /мес
                      </>
                    }
                    metrics={
                      <AssetPositionMetrics
                        assetValue={a.asset_value}
                        monthlyMaintenanceCost={a.monthly_maintenance_cost}
                        monthlyIncome={a.monthly_income}
                      />
                    }
                    trailing={
                      <MqxRowAction
                        variant="remove"
                        ariaLabel={`Удалить актив ${a.title}`}
                        onClick={() => void confirmDeleteAsset(a)}
                      />
                    }
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
            <MqxModeButton active={portfolioDebtsMode === 'add'} onClick={() => setPortfolioDebtsMode('add')}>
              Добавить долг
            </MqxModeButton>
            <MqxModeButton
              active={portfolioDebtsMode === 'positions'}
              onClick={() => setPortfolioDebtsMode('positions')}
            >
              Позиции
            </MqxModeButton>
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
                  <MqxFinListRow
                    key={l.id}
                    title={l.title}
                    subtitle={
                      <>
                        <MoneyText value={l.monthly_payment} decimals={0} />
                        /мес · долг <MoneyText value={l.total_debt} decimals={0} />
                      </>
                    }
                    metrics={
                      <LiabilityPositionMetrics
                        totalDebt={l.total_debt}
                        monthlyPayment={l.monthly_payment}
                        annualRatePercent={l.annual_rate_percent}
                        overdueAmount={l.overdue_amount}
                      />
                    }
                    trailing={
                      <MqxRowAction
                        variant="remove"
                        ariaLabel={`Удалить долг ${l.title}`}
                        onClick={() => void confirmDeleteLiability(l)}
                      />
                    }
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
