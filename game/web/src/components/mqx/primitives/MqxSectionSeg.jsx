/**
 * Сегмент «Добавить | Мои (N)» внутри карточки раздела (канон capital-page lab B).
 */
export function MqxSectionSeg({
  mode = 'add',
  onModeChange,
  addLabel = 'Добавить',
  mineLabel = 'Мои',
  mineCount = 0,
  className = '',
}) {
  const mineText = mineCount > 0 ? `${mineLabel} (${mineCount})` : mineLabel;

  return (
    <div
      className={['mqx-section-seg', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label="Режим раздела"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'add'}
        className={`mqx-section-seg__btn${mode === 'add' ? ' mqx-section-seg__btn--active' : ''}`}
        onClick={() => onModeChange('add')}
      >
        {addLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'mine'}
        className={`mqx-section-seg__btn${mode === 'mine' ? ' mqx-section-seg__btn--active' : ''}`}
        onClick={() => onModeChange('mine')}
      >
        {mineText}
      </button>
    </div>
  );
}

