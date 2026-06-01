import { catalogTileHint } from '../../../constants/insuranceProducts';

/** Сетка 2×2: выбор типа страховки (продукт × объект). */
export function InsuranceCatalogGrid({ items, selectedKind, onSelect }) {
  return (
    <div className="mqx-ins-catalog" role="listbox" aria-label="Тип страховки">
      {items.map((item) => {
        const hint = catalogTileHint(item);
        const isOn = item.kind === selectedKind;
        return (
          <button
            key={item.kind}
            type="button"
            role="option"
            aria-selected={isOn}
            className={`mqx-ins-catalog__item${isOn ? ' is-on' : ''}`}
            onClick={() => onSelect(item.kind)}
          >
            <div className="mqx-ins-catalog__product">{item.product_label}</div>
            <div className="mqx-ins-catalog__object">{item.object_label}</div>
            {hint ? <div className="mqx-ins-catalog__hint">{hint}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
