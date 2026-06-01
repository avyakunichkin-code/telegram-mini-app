import { Button } from '@telegram-apps/telegram-ui';

/**
 * Панель поиска + чипы-фильтры для Watchtower / каталогов.
 *
 * @param {object} props
 * @param {string} [props.searchLabel]
 * @param {string} [props.searchPlaceholder]
 * @param {string} props.searchValue
 * @param {(value: string) => void} props.onSearchChange
 * @param {(e: React.FormEvent) => void} props.onSubmit
 * @param {boolean} [props.showSearchReset]
 * @param {() => void} [props.onSearchReset]
 * @param {Array<{ id: string, label: string }>} [props.chips]
 * @param {string} [props.activeChipId]
 * @param {(id: string) => void} [props.onChipSelect]
 * @param {string} [props.chipAriaLabel]
 * @param {import('react').ReactNode} [props.children] — чекбоксы, доп. кнопки
 * @param {boolean} [props.asCard] — обёртка mq-card (по умолчанию да)
 */
export function AdminFilterBar({
  asCard = true,
  className = '',
  searchLabel = 'Поиск',
  searchPlaceholder = 'Введите запрос…',
  searchValue,
  onSearchChange,
  onSubmit,
  showSearchReset = false,
  onSearchReset,
  chips,
  activeChipId = '',
  onChipSelect,
  chipAriaLabel = 'Фильтры',
  children,
}) {
  const hasChips = chips?.length > 0 && onChipSelect;

  const rootClass = ['admin-filter-bar', asCard ? 'mq-card' : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={rootClass} onSubmit={onSubmit}>
      <label className="admin-filter-bar__search">
        <span className="admin-filter-bar__search-label">{searchLabel}</span>
        <input
          className="mq-field__input"
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>

      {hasChips ? (
        <div className="admin-filter-bar__chips" role="toolbar" aria-label={chipAriaLabel}>
          {chips.map((chip) => (
            <button
              key={chip.id || '__all'}
              type="button"
              className={[
                'admin-watchtower__filter-chip',
                activeChipId === chip.id ? 'admin-watchtower__filter-chip--active' : null,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChipSelect(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      {children ? <div className="admin-filter-bar__extra">{children}</div> : null}

      <div className="admin-filter-bar__actions">
        <Button size="s" type="submit">
          Найти
        </Button>
        {showSearchReset && onSearchReset ? (
          <Button size="s" mode="plain" type="button" onClick={onSearchReset}>
            Сброс
          </Button>
        ) : null}
      </div>
    </form>
  );
}
