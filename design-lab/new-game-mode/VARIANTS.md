# Варианты — выбор режима (шаг 1 новой игры)

| ID | Идея | Статус |
|----|------|--------|
| **B** | Две плитки 2×2 с рамкой и emerald-hover | legacy (до 2026-05) |
| **R1** ★ | **Unified strips** — горизонтальные ряды, violet accent, chevron у «Игры», в линии с S5-дашбордом | **prod** |
| **C** | Stepper: имя → режим отдельным экраном | не выбран |

## R1 — почему

- Одна колонка на узком TMA — читаемее, чем сжатые 2×2 плитки.
- Quest Violet для primary-выбора (бренд), не emerald.
- Плоские ряды без «коробочного» shadow, как unified dashboard.
- Монетка + пузырь сохранены (B).

## Prod

- `MqxSaveKindPicker` в `mqx/layout/`
- `NewProfileKindScreen` — обёртка + поле имени
