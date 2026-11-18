---
paths:
  - "packages/fincore/**"
  - "backend/.importlinter"
  - "backend/tests/test_import_boundaries.py"
---

# fincore — общее финансовое ядро Game и Plan

Канон: [ADR-016](docs/decisions/ADR-016-two-products-shared-fincore.md), план [`PLAN_game-plan-split`](docs/plans/PLAN_game-plan-split.md), [`packages/fincore/README.md`](packages/fincore/README.md).

- **Только чистые функции.** stdlib, `Decimal`, dataclasses. Запрещены `fastapi`, `sqlalchemy`, `pydantic`, `app.*` и IO (файлы, сеть, БД, время «сейчас»). Нарушение ловит `import-linter` (`backend/.importlinter`, тест `backend/tests/test_import_boundaries.py`).
- **Без игровых понятий.** Не заносить потребности, события, победу, шаблоны, лиги, ходы, лимиты механик, каталоги игровых активов. Время — «месяц» / `month_index`; `period_index` игры переводит адаптер.
- **Вход — примитивы или DTO, не ORM.** Обёртки с ORM-сигнатурами живут в приложении (`backend/app/finance/*` для игры).
- **Ошибки — доменные исключения** (наследники `ValueError`). HTTP-статус выбирает приложение.
- **Перенос расчёта из игры — без смены чисел.** Порядок Decimal-операций и округление сохраняются; перед и после — `pytest` и `scripts/balance_playtest.py` с нулевым diff (SPL gate).
- Изменение ядра затрагивает оба продукта: прогоняй `cd packages/fincore && python -m pytest -q` и `cd backend && python -m pytest -q`.
