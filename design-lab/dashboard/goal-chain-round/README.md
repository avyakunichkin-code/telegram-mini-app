# Дашборд — цепочка целей (design-lab)

Макет редизайна раздела **«Цель»**: последовательные цели по шаблону, подсказки вместо шкал.

## Быстрый старт

```powershell
cd design-lab/dashboard/goal-chain-round
.\sync-lab.ps1
npx serve .
```

## Файлы

| Файл | Назначение |
|------|------------|
| `index.html` | Порядок блоков, G1 развёрнут/свёрнут, разные цели |
| `styles.css` | `.mqx-goal-dash*`, `.mqx-goal-focus*`, `.mqx-goal-chain*` |
| `GOAL_CHAIN_DRAFT.md` | Черновик цепочки для `mq_game_basic_v1` — **на согласование** |
| `CONTENT.md` | Примеры copy «как достичь» |
| `VARIANTS.md` | G1 vs G2, парадигма |

## Следующий шаг

1. Утвердить **G1** (или G2).  
2. Согласовать цепочку в `GOAL_CHAIN_DRAFT.md`.  
3. Spec + backend + `MqxGoalDash` в prod.
