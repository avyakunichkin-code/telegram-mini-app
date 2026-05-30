# Dashboard Z-NEEDS v5 — утверждено ★

**Раунд:** `design-lab/character-needs/dashboard-needs-v5-round/`  
**Дата:** 2026-05-30  
**Prod:** `MqxNeedsDash` · порядок в `DashboardPremium`

## Порядок на главной (UX-01, обновлено)

```text
Z0 Hero → Z-NEEDS → Z1 Финансы → Z2 Цель → Z3 Действия
```

Самочувствие **сразу после hero**, до финансового снимка.

## Collapsed (default)

- Bleed-баннер риска при `needs_zero_periods_streak > 0`
- Маскот слева + заголовок **Самочувствие** (H2 как у других секций)
- Строка статуса: «Всё в норме» / «Есть просадка» / «Истощение» / «Критично»
- Одна шкала **min-оси** (без chip «Улучшить»)
- Ссылка **«как улучшить →»** (help sheet)

## Expanded

- 4 горизонтальные шкалы (подпись · бар · цветной статус)
- Footer справа: **`Порадовать себя`** (pill, ≥44px) + **`?`** (круг, help)
- Без дубля help-ссылки в шапке

## Без

- Icon-chip «Улучшить» в collapsed (UX-05)
- Блок до hero или после «Цель» (старый UX-01)

## Canon Sync

- `docs/ux/CHARACTER_NEEDS_UX.md` UX-01
- `docs/ux/screens/dashboard.md` wireframe + zones
- `frontend-react/src/components/mqx/layout/MqxNeedsDash.jsx`
