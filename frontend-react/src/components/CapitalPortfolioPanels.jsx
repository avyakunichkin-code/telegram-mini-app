import { API } from '../api';
import { showNotification } from './notifications';
import {
  AssetPositionMetrics,
  AssetTemplateMetrics,
  CapitalPositionCard,
  LiabilityPositionMetrics,
  LiabilityTemplateMetrics,
  MqxFinListRow,
  MqxRowAction,
  MqxCapitalEmpty,
  MqxStateError,
  MqxStateSkeleton,
  MqxSectionSeg,
  useMqxConfirm,
} from './mqx';

function usePortfolioConfirm() {
  const { confirm, dialog } = useMqxConfirm();
  return { confirm, dialog };
}

/** Вкладка «Имущество»: каталог шаблонов и мои активы (сегмент B). */
export function CapitalPropertyPanel({
  assetTemplates,
  ownedAssets,
  sectionMode,
  setSectionMode,
  refreshOverview,
  reloadExtra,
  handleDeleteAsset,
  extraLoading = false,
}) {
  const { confirm, dialog } = usePortfolioConfirm();

  const confirmDeleteAsset = async (asset) => {
    const ok = await confirm({
      title: 'Удалить актив?',
      message: `«${asset.title}» будет снят с учёта.`,
    });
    if (ok) await handleDeleteAsset(asset.id);
  };

  return (
    <>
      {dialog}
      <p className="mqx-capital-lead">Покупка из шаблона списывает стоимость с текущего счёта.</p>
      <MqxSectionSeg
        mode={sectionMode}
        onModeChange={setSectionMode}
        addLabel="Добавить"
        mineLabel="Мои"
        mineCount={ownedAssets.length}
      />
      {sectionMode === 'add' ? (
        <div className="mqx-capital-template-list">
          {extraLoading ? (
            <MqxStateSkeleton variant="rows" rows={2} />
          ) : assetTemplates.length === 0 ? (
            <MqxStateError
              title="Шаблоны не загружены"
              message="Проверьте сеть и попробуйте снова"
              onRetry={() => void reloadExtra?.()}
            />
          ) : (
            assetTemplates.map((t) => (
              <CapitalPositionCard
                key={t.key}
                variant="asset"
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
          {extraLoading ? (
            <MqxStateSkeleton variant="rows" rows={3} />
          ) : ownedAssets.length === 0 ? (
            <MqxCapitalEmpty
              message="Нет активов в портфеле"
              actionLabel="Добавить из каталога"
              onAction={() => setSectionMode('add')}
            />
          ) : (
            ownedAssets.map((a) => (
              <MqxFinListRow
                key={a.id}
                title={a.title}
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
  );
}

/** Вкладка «Обязательства»: каталог долгов и мои обязательства (сегмент B). */
export function CapitalLiabilitiesPanel({
  liabilityTemplates,
  ownedLiabilities,
  sectionMode,
  setSectionMode,
  addLiabilityFromTemplate,
  handleDeleteLiability,
  reloadExtra,
  extraLoading = false,
}) {
  const { confirm, dialog } = usePortfolioConfirm();

  const confirmDeleteLiability = async (liability) => {
    const ok = await confirm({
      title: 'Удалить обязательство?',
      message: `«${liability.title}» будет закрыто и снято с учёта.`,
    });
    if (ok) await handleDeleteLiability(liability.id);
  };

  return (
    <>
      {dialog}
      <p className="mqx-capital-lead">
        Новый долг зачисляет сумму на счёт; закрытие возвращает тело и гасит просрочку.
      </p>
      <MqxSectionSeg
        mode={sectionMode}
        onModeChange={setSectionMode}
        addLabel="Добавить"
        mineLabel="Мои"
        mineCount={ownedLiabilities.length}
      />
      {sectionMode === 'add' ? (
        <div className="mqx-capital-template-list">
          {extraLoading ? (
            <MqxStateSkeleton variant="rows" rows={2} />
          ) : liabilityTemplates.length === 0 ? (
            <MqxStateError
              title="Шаблоны не загружены"
              message="Проверьте сеть и попробуйте снова"
              onRetry={() => void reloadExtra?.()}
            />
          ) : (
            liabilityTemplates.map((t) => (
              <CapitalPositionCard
                key={t.key}
                variant="liability"
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
          {extraLoading ? (
            <MqxStateSkeleton variant="rows" rows={3} />
          ) : ownedLiabilities.length === 0 ? (
            <MqxCapitalEmpty
              message="Нет обязательств"
              actionLabel="Добавить из каталога"
              onAction={() => setSectionMode('add')}
            />
          ) : (
            ownedLiabilities.map((l) => (
              <MqxFinListRow
                key={l.id}
                title={l.title}
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
  );
}

