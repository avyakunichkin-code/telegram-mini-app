import { useState } from 'react';
import { MqxStateSkeleton } from '../primitives/MqxStateSkeleton';
import { useMqxConfirm } from '../hooks/useMqxConfirm';
import { CapitalLot, CapitalLotAction, CapitalLotNote, CapitalLotRow } from './CapitalLot';
import {
  assetNote,
  formatLotRub,
  formatSaleConfirmMessage,
  investNote,
  liabilityNote,
  LOCKED_META,
  lotMeta,
  policyNote,
  sumBy,
} from './CapitalLotNotes';
import { MqxCapitalSheet } from './MqxCapitalSheet';
import { MqxLiabilityPrepayForm } from './MqxLiabilityPrepayForm';
import { canPrepayLiability, findSecuredLiabilityForAsset } from '../../../utils/capitalDl1';

/** Пусто: текст и переход во «Действия». */
function EmptyNote({ what, onGo }) {
  return (
    <CapitalLotNote>
      Пока ничего нет. {what} —{' '}
      <button type="button" className="mqx-bg-btn mqx-cap-lot-act mqx-cap-lot-act--inline" onClick={onGo}>
        во вкладке «Действия»
      </button>
      .
    </CapitalLotNote>
  );
}

/**
 * Панель «Детали» ★ BG-2: карточки собственности с цветной полосой.
 * sections: { invest, insurance, property, liabilities } → 'open' | 'locked' | 'hidden'.
 */
export function CapitalDetailsPanel({
  sections,
  lockHint,
  investPositions,
  policies,
  ownedAssets,
  ownedLiabilities,
  extraLoading,
  maxCash,
  onCloseInvest,
  onCancelPolicy,
  cancellingPolicyId,
  onDeleteAsset,
  onDeleteLiability,
  onPrepayLiability,
  prepayBusy = false,
  onGotoAction,
}) {
  const { confirm, dialog } = useMqxConfirm();
  const [prepayTarget, setPrepayTarget] = useState(null);

  const requestCloseInvest = async (position) => {
    const ok = await confirm({
      title: 'Закрыть позицию?',
      message: `«${position.title}» будет закрыта.`,
      confirmLabel: 'Закрыть',
    });
    if (ok) await onCloseInvest(position.id);
  };

  const requestCancelPolicy = async (policy) => {
    const ok = await confirm({
      title: 'Отменить полис?',
      message: `«${policy.title}» перестанет действовать.`,
      confirmLabel: 'Отменить полис',
    });
    if (ok) await onCancelPolicy(policy.id);
  };

  const confirmDeleteAsset = async (asset) => {
    const secured = findSecuredLiabilityForAsset(ownedLiabilities, asset.id);
    const ok = await confirm({
      title: 'Продать?',
      message: secured
        ? formatSaleConfirmMessage(asset, secured)
        : `«${asset.title}» будет продан, выручка зачислится на счёт.`,
      confirmLabel: 'Продать',
    });
    if (ok) await onDeleteAsset(asset.id);
  };

  const confirmDeleteLiability = async (liability) => {
    const secured = Boolean(liability?.secured_asset_id);
    const ok = await confirm({
      title: 'Погасить долг целиком?',
      message: secured
        ? `«${liability.title}» будет закрыт: спишется остаток и просрочка. Имущество останется у тебя.`
        : `«${liability.title}» будет закрыт: остаток и просрочка спишутся со счёта.`,
      confirmLabel: 'Погасить',
    });
    if (ok) await onDeleteLiability(liability.id);
  };

  const submitPrepay = async (amount) => {
    if (!prepayTarget) return;
    await onPrepayLiability(prepayTarget.id, amount);
    setPrepayTarget(null);
  };

  /** Подсказка цели — только в первой закрытой карточке, остальные — пунктир и «откроется по цели». */
  const firstLocked = ['invest', 'insurance', 'property', 'liabilities'].find((k) => sections[k] === 'locked');
  const lockedLot = (key, tone, title) => (
    <CapitalLot tone={tone} title={title} meta={LOCKED_META} locked>
      {lockHint && key === firstLocked ? <CapitalLotNote>{lockHint}</CapitalLotNote> : null}
    </CapitalLot>
  );

  const skeleton = (rows) => (
    <div className="mqx-cap-lot-note">
      <MqxStateSkeleton variant="rows" rows={rows} />
    </div>
  );

  return (
    <div className="mqx-cap-lots" role="tabpanel" id="capital-panel-details" aria-labelledby="capital-tab-details">
      {dialog}
      {sections.invest === 'open' ? (
        <CapitalLot
          tone="invest"
          title="Вложения"
          meta={extraLoading ? null : lotMeta(investPositions.length, sumBy(investPositions, 'principal'))}
        >
          {extraLoading ? (
            skeleton(2)
          ) : investPositions.length === 0 ? (
            <EmptyNote what="Открыть вклад или купить облигации" onGo={() => onGotoAction('deposit')} />
          ) : (
            investPositions.map((p) => {
              const label = p.kind === 'bond' ? 'Продать' : 'Закрыть';
              return (
                <CapitalLotRow
                  key={p.id}
                  title={p.title}
                  value={formatLotRub(p.principal)}
                  note={investNote(p)}
                  actions={
                    <CapitalLotAction
                      ariaLabel={`${label} ${p.title}`}
                      onClick={() => void requestCloseInvest(p)}
                    >
                      {label}
                    </CapitalLotAction>
                  }
                />
              );
            })
          )}
        </CapitalLot>
      ) : null}
      {sections.invest === 'locked' ? lockedLot('invest', 'invest', 'Вложения') : null}

      {sections.insurance === 'open' ? (
        <CapitalLot
          tone="insure"
          title="Страховки"
          meta={extraLoading ? null : policies.length ? String(policies.length) : 'пусто'}
        >
          {extraLoading ? (
            skeleton(1)
          ) : policies.length === 0 ? (
            <EmptyNote what="Оформить полис" onGo={() => onGotoAction('insurance')} />
          ) : (
            policies.map((p) => (
              <CapitalLotRow
                key={p.id}
                title={p.title}
                value={`покрытие ${formatLotRub(p.payout_amount ?? p.coverage_limit ?? 0)}`}
                note={policyNote(p)}
                actions={
                  <CapitalLotAction
                    disabled={cancellingPolicyId === p.id}
                    ariaLabel={`Отменить полис ${p.title}`}
                    onClick={() => void requestCancelPolicy(p)}
                  >
                    Отменить
                  </CapitalLotAction>
                }
              />
            ))
          )}
        </CapitalLot>
      ) : null}
      {sections.insurance === 'locked' ? lockedLot('insurance', 'insure', 'Страховки') : null}

      {sections.property === 'open' ? (
        <CapitalLot
          tone="property"
          title="Имущество"
          meta={lotMeta(ownedAssets.length, sumBy(ownedAssets, 'asset_value'))}
        >
          {ownedAssets.length === 0 ? (
            <EmptyNote what="Купить квартиру или авто" onGo={() => onGotoAction('realestate')} />
          ) : (
            ownedAssets.map((a) => (
              <CapitalLotRow
                key={a.id}
                title={a.title}
                value={formatLotRub(a.asset_value)}
                note={assetNote(a)}
                actions={
                  <CapitalLotAction ariaLabel={`Продать ${a.title}`} onClick={() => void confirmDeleteAsset(a)}>
                    Продать
                  </CapitalLotAction>
                }
              />
            ))
          )}
        </CapitalLot>
      ) : null}
      {sections.property === 'locked' ? lockedLot('property', 'property', 'Имущество') : null}

      {sections.liabilities === 'open' ? (
        <CapitalLot
          tone="debt"
          title="Долги"
          meta={lotMeta(ownedLiabilities.length, sumBy(ownedLiabilities, 'total_debt'))}
        >
          {ownedLiabilities.length === 0 ? (
            <EmptyNote what="Взять кредит или ипотеку" onGo={() => onGotoAction('credit')} />
          ) : (
            ownedLiabilities.map((l) => (
              <CapitalLotRow
                key={l.id}
                title={l.title}
                value={formatLotRub(l.total_debt)}
                note={liabilityNote(l, ownedAssets)}
                actions={
                  <>
                    {canPrepayLiability(l) ? (
                      <CapitalLotAction
                        ariaLabel={`Погасить часть: ${l.title}`}
                        onClick={() => setPrepayTarget(l)}
                      >
                        Погасить часть
                      </CapitalLotAction>
                    ) : null}
                    <CapitalLotAction
                      ariaLabel={`Погасить целиком: ${l.title}`}
                      onClick={() => void confirmDeleteLiability(l)}
                    >
                      Погасить
                    </CapitalLotAction>
                  </>
                }
              />
            ))
          )}
        </CapitalLot>
      ) : null}
      {sections.liabilities === 'locked' ? lockedLot('liabilities', 'debt', 'Долги') : null}

      <MqxCapitalSheet
        open={Boolean(prepayTarget)}
        title="Погасить часть долга"
        subtitle={prepayTarget?.title}
        onClose={() => setPrepayTarget(null)}
      >
        {prepayTarget ? (
          <MqxLiabilityPrepayForm
            liability={prepayTarget}
            maxCash={maxCash}
            busy={prepayBusy}
            onSubmit={submitPrepay}
          />
        ) : null}
      </MqxCapitalSheet>
    </div>
  );
}
