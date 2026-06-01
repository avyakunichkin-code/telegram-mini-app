# Round: Dashboard Z-NEEDS

**UX:** [`docs/ux/screens/character-needs-dashboard.md`](../../../docs/ux/screens/character-needs-dashboard.md)

## Варианты (нарисовать 2–4)

| ID | Compact | Expanded | Заметка |
|----|---------|----------|---------|
| **A** | Одна полоска = min(4) | 4 labeled bars | Минимум высоты |
| **B** | 4 micro-bars 4×16px | 4 full bars | Скан осей без expand |
| **C** | Текст «Связи 28%» + icon row | 4 bars | Максимум читаемости |
| **D** | A + risk banner full-bleed | как A | Акцент на streak |

**Рекомендация продукта (pre-lab):** B compact + A expanded — уточнить на review.

## Lab (готово к review)

- [x] `index.html` + `styles.css` + `sync-lab.sh` + `lab.js`
- [x] Варианты A–D, переключатель состояний и темы
- [x] Collapsed / expanded на карточке

```powershell
.\sync-lab.sh
npx serve .
```

См. [`VARIANTS.md`](VARIANTS.md).
