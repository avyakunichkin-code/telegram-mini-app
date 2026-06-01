import { AssetPositionMetrics } from '../metrics/AssetPositionMetrics';
import { InsurancePolicyMetrics } from '../metrics/InsurancePolicyMetrics';
import { LiabilityPositionMetrics } from '../metrics/LiabilityPositionMetrics';
import { MqxCapitalTextRowAction } from '../primitives/MqxCapitalTextRowAction';
import { MqxStateSkeleton } from '../primitives/MqxStateSkeleton';
import { useMqxConfirm } from '../hooks/useMqxConfirm';
import { InvestPositionRow } from './InvestPositionRow';
import { MqxCapitalDetailEmpty } from './MqxCapitalDetailEmpty';
import { MqxCapitalMechanicLocked } from './MqxCapitalMechanicLocked';
import { formatDebtCount, MqxCapitalMetaCount, MqxCapitalMetaLiab } from './MqxCapitalSectionMeta';
import { MqxCapitalSectionAccordion } from './MqxCapitalSectionAccordion';
import { MqxFinListRow } from './MqxFinListRow';

/** Панель «Детали» — только позиции и компактные row-actions. */
export function CapitalDetailsPanel({
  mechanics,
  insuranceSectionState,
  insuranceLockHint,
  investPositions,
  policies,
  ownedAssets,
  ownedLiabilities,
  extraLoading,
  onCloseInvest,
  onCancelPolicy,
  cancellingPolicyId,
  onDeleteAsset,
  onDeleteLiability,
  onGotoAction,
}) {
  const { confirm, dialog } = useMqxConfirm();

  const requestCloseInvest = async (position) => {
    const ok = await confirm({
      title: 'Закрыть позицию?',
      message: `«${position.title}» будет закрыта.`,
    });
    if (ok) await onCloseInvest(position.id);
  };

  const requestCancelPolicy = async (policyId) => {
    const policy = policies.find((p) => p.id === policyId);
    const ok = await confirm({
      title: 'Отменить полис?',
      message: policy ? `«${policy.title}» перестанет действовать.` : 'Полис перестанет действовать.',
    });
    if (ok) await onCancelPolicy(policyId);
  };

  const confirmDeleteAsset = async (asset) => {
    const ok = await confirm({
      title: 'Удалить актив?',
      message: `«${asset.title}» будет снят с учёта.`,
    });
    if (ok) await onDeleteAsset(asset.id);
  };

  const confirmDeleteLiability = async (liability) => {
    const ok = await confirm({
      title: 'Удалить обязательство?',
      message: `«${liability.title}» будет закрыто и снято с учёта.`,
    });
    if (ok) await onDeleteLiability(liability.id);
  };

  return (
    <>
      {dialog}
      {mechanics.capital_invest ? (
        <MqxCapitalSectionAccordion
          title="Инвестиции"
          meta={<MqxCapitalMetaCount count={investPositions.length} />}
          className="mqx-cap-sect--invest"
        >
          <div className="mqx-capital-position-list">
            {extraLoading ? (
              <MqxStateSkeleton variant="rows" rows={3} />
            ) : investPositions.length === 0 ? (
              <MqxCapitalDetailEmpty actionLabel="+ Добавить" onAction={() => onGotoAction('deposit')}>
                Здесь только <strong>открытые позиции</strong>. Новый инструмент — вкладка{' '}
                <strong>«Действия»</strong>.
              </MqxCapitalDetailEmpty>
            ) : (
              investPositions.map((p) => (
                <InvestPositionRow
                  key={p.id}
                  position={p}
                  useTextAction
                  onCloseRequest={() => void requestCloseInvest(p)}
                />
              ))
            )}
          </div>
        </MqxCapitalSectionAccordion>
      ) : null}

      {insuranceSectionState === 'open' ? (
        <MqxCapitalSectionAccordion
          title="Страховки"
          meta={<MqxCapitalMetaCount count={policies.length} />}
          className="mqx-cap-sect--insurance"
        >
          <div className="mqx-capital-position-list">
            {extraLoading ? (
              <MqxStateSkeleton variant="rows" rows={2} />
            ) : policies.length === 0 ? (
              <MqxCapitalDetailEmpty
                actionLabel="+ Добавить"
                onAction={() => onGotoAction('insurance')}
              >
                Здесь только <strong>оформленные полисы</strong>. Новый полис — вкладка{' '}
                <strong>«Действия»</strong>.
              </MqxCapitalDetailEmpty>
            ) : (
              policies.map((p) => (
                <MqxFinListRow
                  key={p.id}
                  className="mqx-fin-row--ins-policy"
                  title={p.title}
                  metrics={<InsurancePolicyMetrics policy={p} />}
                  trailing={
                    <MqxCapitalTextRowAction
                      variant="close"
                      disabled={cancellingPolicyId === p.id}
                      ariaLabel={`Отменить полис ${p.title}`}
                      onClick={() => void requestCancelPolicy(p.id)}
                    >
                      Отменить
                    </MqxCapitalTextRowAction>
                  }
                />
              ))
            )}
          </div>
        </MqxCapitalSectionAccordion>
      ) : null}

      {insuranceSectionState === 'locked' ? (
        <MqxCapitalSectionAccordion title="Страховки" meta="скоро" className="mqx-cap-sect--insurance">
          <MqxCapitalMechanicLocked hint={insuranceLockHint} />
        </MqxCapitalSectionAccordion>
      ) : null}

      {mechanics.capital_property ? (
        <MqxCapitalSectionAccordion
          title="Имущество"
          meta={<MqxCapitalMetaCount count={ownedAssets.length} />}
          className="mqx-cap-sect--property"
        >
          <div className="mqx-capital-position-list">
            {extraLoading ? (
              <MqxStateSkeleton variant="rows" rows={3} />
            ) : ownedAssets.length === 0 ? (
              <MqxCapitalDetailEmpty
                actionLabel="+ Добавить"
                onAction={() => onGotoAction('realestate')}
              >
                Здесь только <strong>купленные активы</strong>. Покупка — вкладка{' '}
                <strong>«Действия»</strong>.
              </MqxCapitalDetailEmpty>
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
                    <MqxCapitalTextRowAction
                      variant="sell"
                      ariaLabel={`Продать ${a.title}`}
                      onClick={() => void confirmDeleteAsset(a)}
                    >
                      Продать
                    </MqxCapitalTextRowAction>
                  }
                />
              ))
            )}
          </div>
        </MqxCapitalSectionAccordion>
      ) : null}

      {mechanics.capital_liabilities ? (
        <MqxCapitalSectionAccordion
          title="Обязательства"
          meta={
            <MqxCapitalMetaLiab
              label={ownedLiabilities.length ? formatDebtCount(ownedLiabilities.length) : '0'}
            />
          }
          className="mqx-cap-sect--liabilities"
        >
          <div className="mqx-capital-position-list">
            {extraLoading ? (
              <MqxStateSkeleton variant="rows" rows={3} />
            ) : ownedLiabilities.length === 0 ? (
              <MqxCapitalDetailEmpty
                actionLabel="+ Добавить"
                onAction={() => onGotoAction('mortgage')}
              >
                Здесь только <strong>активные долги</strong>. Новый долг — вкладка{' '}
                <strong>«Действия»</strong>.
              </MqxCapitalDetailEmpty>
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
                    <MqxCapitalTextRowAction
                      variant="close"
                      ariaLabel={`Закрыть ${l.title}`}
                      onClick={() => void confirmDeleteLiability(l)}
                    >
                      Закрыть
                    </MqxCapitalTextRowAction>
                  }
                />
              ))
            )}
          </div>
        </MqxCapitalSectionAccordion>
      ) : null}
    </>
  );
}
