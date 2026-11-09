import { MoneyText } from '../../MoneyText';
import { pluralRu } from '../utils/boardDashDisplay';

export function MqxNeedsRecovery({ axis, needsMeta, treatSelf, cash, busy, onTreatSelf }) {
  if (!axis || axis.value >= 40) return null;
  const forecast = needsMeta?.model === 'set_point' ? needsMeta.periods_to_zero_if_idle?.[axis.key] : null;
  const options = (treatSelf?.options || []).filter(o => Number(o.needs_delta?.[axis.key]) > 0);
  const affordableOptions = options.filter(o => Number.isFinite(Number(cash)) && Number(cash) >= Number(o.cost));
  const option = [...(affordableOptions.length ? affordableOptions : options)].sort((a, b) => Number(b.needs_delta[axis.key]) - Number(a.needs_delta[axis.key]))[0];
  const affordable = option && Number.isFinite(Number(cash)) && Number(cash) >= Number(option.cost);
  const available = Boolean(treatSelf?.available && affordable && onTreatSelf);
  const cooldown = Number(treatSelf?.cooldown_periods_remaining) || 0;
  return <div className="mqx-next-step mqx-needs-recovery" data-testid="needs-recovery">
    <div className="mqx-needs-recovery__risk" role="status"><strong>{axis.label}: {Math.round(axis.value)} / 100</strong>
      <p>{axis.value <= 0 ? 'Уже на нуле — важно восстановить потребность.' : forecast != null && Number.isFinite(Number(forecast)) ? `Если ничего не менять: примерно ${forecast} ${pluralRu(Number(forecast), 'ход', 'хода', 'ходов')} до нуля.` : 'Прогноз до нуля сейчас недоступен.'}</p>
      <p>Оценка без новых действий. События и покупки могут её изменить.</p>
    </div>
    {option ? <div className="mqx-next-step__suggestion"><h3>{option.title}</h3><p><MoneyText value={-Number(option.cost)} decimals={0} /> · {axis.label} ≈ +{Math.round(option.needs_delta[axis.key])}</p><p>После действия потребность может остаться низкой. Цена и эффекты — в окне подтверждения.</p></div> : <p>Доступный отдых не повышает эту потребность. Ищите подходящие варианты в событиях, если они появятся.</p>}
    {option && <button type="button" className="mqx-bg-btn mqx-bg-cta mqx-next-step__button" disabled={busy || !available} onClick={onTreatSelf}>Порадовать себя</button>}
    {option && !available && <p>{cooldown > 0 ? `Можно снова через ${cooldown} ${pluralRu(cooldown, 'ход', 'хода', 'ходов')}.` : !affordable ? 'Недостаточно денег на счёте для этого отдыха.' : 'Отдых сейчас недоступен.'} Пока можно выбирать события с ростом «{axis.label}», если они появятся.</p>}
    <details><summary>Что влияет на потребность</summary><p>События, уровень жизни и стартовое имущество. Продажа стартового имущества может снизить уровень потребности. Подушка сама потребности не пополняет.</p><p>Прогноз относится к бездействию, а не к точному результату следующего закрытия. Нужное событие не гарантируется.</p></details>
  </div>;
}
