# details-actions-round — «Детали | Действия» + sheet

Гибрид **V3 + V7** по решению в чате (2026-06).

## Решения

| Тема | Значение |
|------|----------|
| Сегмент страницы | **Детали \| Действия** (не «Разобраться») |
| Поток | Sticky: health + mini Доходы/Расходы + deep-link `#capital-flows-*` |
| Заголовки flows | **Доходы**, **Расходы** — без суффикса «— детали» |
| Meta разделов | Pill: **● 2** / **Пусто** / сумма для flows |
| Empty в «Детали» | Подсказка + **+ Добавить** → «Действия» + sheet |
| Sheet | Только **оформление** — без «Оформить \| Мои» |

## Открытые выборы (смотреть в lab)

| ID | Вопрос | Варианты |
|----|--------|----------|
| **D1–D3** | Список позиций в «Детали» | D1 строки (★ prod-like), D2 группы, D3 chips |
| **F1–F2** | Форма в sheet | F1 форма сразу (инвест), F2 каталог→форма (страховки) |

## Запуск

```powershell
cd design-lab/capital-page/details-actions-round
.\sync-lab.ps1
npx serve .
```

## Интерактив ★

1. Раскройте **Страховки** (пусто) → **+ Добавить**
2. **Действия** → строка → sheet
3. Deep-link **Доходы** с полоски симуляции

## Prod mapping (после утверждения)

- `MqxSectionSeg` → page-level «Детали | Действия»
- `MqxCapitalSectionAccordion` → meta pill component
- Sheet → новый `MqxCapitalActionSheet` или аналог
- Удалить `CapitalMonetkaGuidance` (O2)
