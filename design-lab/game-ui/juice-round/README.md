# Game UI — juice-round

**Статус:** черновик на review  
**Цель:** сделать TMA **игровее** (bold juice), не «банковским отчётом».

## Запуск

```powershell
cd design-lab/game-ui/juice-round
.\sync-lab.ps1
npx serve .
```

Открыть `http://localhost:3000` (порт serve может отличаться).

## Варианты

| ID | Паттерн | Триггер в prod |
|----|---------|----------------|
| **A** | Gain | Зарплата, +к подушке |
| **B** | Risk | Просрочка, минус по cash |
| **C** | Turn ritual | После «Закрыть месяц» |
| **D** | Warning | Modal без зарплаты |

Подробнее: [VARIANTS.md](./VARIANTS.md)

## Утверждение

Явная формулировка в чате, например: «Утверждаем A+C для prod» → `mqx-juice-*` + `#/dev/mqx` → `DashboardPremium` / `GameScreen`.

## Связанные docs

- Идея: `docs/vision/ideas/game-ui-juice-and-tab-modes.md` (после сохранения one-pager)
- MQX процесс: `frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`
