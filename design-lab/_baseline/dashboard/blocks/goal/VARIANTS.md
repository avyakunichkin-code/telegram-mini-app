# goal-path-stepper-round — тропа в свёрнутом аккордеоне

Brainstorm Concept 2 («Тропа уроков») · дополнение к утверждённому G1 [`goal-chain-round`](../goal-chain-round/).

## Problem

В свёрнутом `MqxGoalDash` видно только текст «Шаг K из N» — неочевидно, **сколько всего шагов** и **что уже сделано**. Игрок просил связанные кружки без раскрытия аккордеона.

## Варианты

| ID | Расположение | Плюсы | Минусы |
|----|--------------|-------|--------|
| P1 | Stepper под title + «Шаг K из N» | Дублирование с тропой | Отклонено |
| P2 | Stepper **над** названием цели | — | Отклонено |
| **P3 ★** | Stepper под title, **без** «Шаг K из N» | Тропа = прогресс; gate — только «Победа с N-го периода» | **Утверждено → prod** |

## Состояния узла (маппинг API)

| CSS | `chain[].status` | Отображение |
|-----|------------------|-------------|
| `--done` | `done` | ✓, sky connector |
| `--current` | `current` | Номер, ring + glow |
| `--locked` | `locked` | Номер, dashed, muted |
| `--gate` | `phase === 'gate'` | Замок, amber (победа с N-го периода) |

`goals` с `available: false` (ещё не в chain) — **не** показывать в stepper или последний locked с `blocked_reason`.

## Рекомендация prod

- Компонент **`MqxGoalPathStepper`** (`chain` prop, `dense` для 7+).
- Встроить в **`MqxGoalDash`** toggle (свёрнуто + развёрнуто дублирует тот же stepper).
- A11y: `aria-label` на group; номера шагов `aria-hidden` на узлах, полные title в `.mqx-goal-path__sr`.
- Стили: `frontend-react/src/styles/mqx/dashboard.css` после утверждения P1.

## Не в этом раунде

- Тултипы по long-press на узле.
- Анимация «перескок» current → done (можно v2).
- Отдельные иконки по типу цели (invest / cushion).

## Просмотр

```powershell
cd design-lab/dashboard/goal-path-stepper-round
.\sync-lab.sh
npx serve .
```
