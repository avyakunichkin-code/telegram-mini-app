import { investMonthlyAccrual } from '../../../constants/investProducts';
import { computeSalePreview } from '../../../utils/capitalDl1';

const NBSP = '\u00a0';

/** «120 000 ₽»; sign: '+' | '−' | '' — знак перед суммой. */
export function formatLotRub(amount, sign = '') {
  const n = Math.round(Math.abs(Number(amount) || 0)).toLocaleString('ru-RU');
  return `${sign}${n}${NBSP}₽`;
}

/** «2 · 170 000 ₽» или «пусто». */
export function lotMeta(count, total) {
  if (!count) return 'пусто';
  return `${count} · ${formatLotRub(total)}`;
}

/** Подписи строк карточек собственности ★ BG-2 («+93 ₽ за ход · 14% в год»). */
export const LOCKED_META = 'откроется по цели';

export function sumBy(items, field) {
  return (items || []).reduce((acc, it) => acc + (Number(it?.[field]) || 0), 0);
}

function joinNote(parts) {
  return parts.filter(Boolean).join(' · ');
}

export function formatSaleConfirmMessage(asset, liability) {
  const { payoff, cashNet, topUp } = computeSalePreview(asset, liability);
  let msg = `Погашение кредита: ${formatLotRub(payoff)}. На счёт: ${formatLotRub(cashNet)}.`;
  if (topUp > 0) msg += ` Доплата с счёта: ${formatLotRub(topUp)}.`;
  return msg;
}

export function investNote(p) {
  const monthly = investMonthlyAccrual(p.principal, p.annual_rate_percent);
  return joinNote([
    `${formatLotRub(monthly, '+')} за ход`,
    `${Number(p.annual_rate_percent) || 0}% в год`,
  ]);
}

export function policyNote(p) {
  const term =
    p.started_period_index && p.expires_period_index
      ? `ходы ${p.started_period_index}–${p.expires_period_index}`
      : null;
  return joinNote([`взнос ${formatLotRub(p.monthly_premium, '−')} за ход`, term]);
}

export function assetNote(a) {
  const income = Number(a.monthly_income) || 0;
  const upkeep = Number(a.monthly_maintenance_cost) || 0;
  return joinNote([
    income > 0 ? `${formatLotRub(income, '+')} за ход` : null,
    upkeep > 0 ? `содержание ${formatLotRub(upkeep, '−')} за ход` : null,
    a.acquisition_mode === 'secured' ? 'в кредит — продажа погасит долг' : null,
  ]);
}

export function liabilityNote(l, ownedAssets) {
  const left = Number(l.remaining_periods);
  const overdue = Number(l.overdue_amount) || 0;
  let secured = null;
  if (l.secured_asset_id) {
    const asset = (ownedAssets || []).find((a) => Number(a.id) === Number(l.secured_asset_id));
    secured = asset ? `под залог: ${asset.title}` : 'под залог';
  }
  return (
    <>
      {joinNote([
        `${formatLotRub(l.monthly_payment, '−')} за ход`,
        Number.isFinite(left) && left > 0 ? `ещё ${left} ${pluralTurns(left)}` : null,
        secured,
      ])}
      {overdue > 0 ? (
        <span className="mqx-cap-lot-row__risk"> · просрочка {formatLotRub(overdue)}</span>
      ) : null}
    </>
  );
}

function pluralTurns(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ход';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'хода';
  return 'ходов';
}
