/**
 * Переключатель «Детали | Действия» — разделитель между потоками и контентом (lab v2).
 */
export function MqxCapitalPageModeSeg({ mode = 'details', onModeChange }) {
  return (
    <div className="mqx-cap-mode-seg-zone">
      <div className="mqx-cap-page-seg mqx-cap-mode-seg" role="tablist" aria-label="Режим страницы">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'details'}
          className={`mqx-cap-page-seg__btn${mode === 'details' ? ' is-active' : ''}`}
          onClick={() => onModeChange('details')}
        >
          Детали
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'actions'}
          className={`mqx-cap-page-seg__btn${mode === 'actions' ? ' is-active' : ''}`}
          onClick={() => onModeChange('actions')}
        >
          Действия
        </button>
      </div>
    </div>
  );
}
