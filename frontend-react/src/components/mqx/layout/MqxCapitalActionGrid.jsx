/** Порядок: инвестиции → имущество (cash / в кредит) → страховки → потреб. кредит. */
const ACTION_TILES = [
  { id: 'deposit', icon: '🏦', title: 'Депозит', iconClass: '' },
  { id: 'bond', icon: '📈', title: 'Облигации', iconClass: 'mqx-cap-act-row__icon--bond' },
  {
    id: 'realestate',
    icon: '🏡',
    title: 'Жильё',
    subtitle: 'Наличными',
    iconClass: 'mqx-cap-act-row__icon--prop',
  },
  {
    id: 'mortgage',
    icon: '🏠',
    title: 'Ипотека',
    subtitle: 'С взносом',
    iconClass: 'mqx-cap-act-row__icon--debt',
  },
  {
    id: 'car',
    icon: '🚗',
    title: 'Авто',
    subtitle: 'Cash · кредит',
    iconClass: 'mqx-cap-act-row__icon--car',
  },
  { id: 'insurance', icon: '🛡', title: 'Страховки', iconClass: 'mqx-cap-act-row__icon--ins' },
  {
    id: 'credit',
    icon: '💳',
    title: 'Кредит',
    subtitle: 'На счёт · до 2',
    iconClass: 'mqx-cap-act-row__icon--credit',
  },
];

/**
 * Сетка действий 3× (узкий экран — 2×).
 * @param {{ visibleIds?: Set<string>, onOpenSheet: (id: string) => void }} props
 */
export function MqxCapitalActionGrid({ visibleIds, onOpenSheet }) {
  const tiles = ACTION_TILES.filter((t) => !visibleIds || visibleIds.has(t.id));

  if (tiles.length === 0) return null;

  return (
    <div className="mqx-cap-act-list mqx-cap-act-list--wrap">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          className={[
            'mqx-cap-act-row',
            'mqx-cap-act-tile',
            tile.highlight && 'mqx-cap-act-tile--highlight',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onOpenSheet(tile.id)}
        >
          <span className={['mqx-cap-act-row__icon', tile.iconClass].filter(Boolean).join(' ')}>
            {tile.icon}
          </span>
          <span className="mqx-cap-act-tile__text">
            <span className="mqx-cap-act-row__title">{tile.title}</span>
            {tile.subtitle ? (
              <span className="mqx-cap-act-row__subtitle">{tile.subtitle}</span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}
