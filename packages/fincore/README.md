# fincore — финансовое ядро

Shared Kernel для Game (`backend/`) и будущего Plan (`apps/plan-api`) — [ADR-016](../../docs/decisions/ADR-016-two-products-shared-fincore.md), план [`PLAN_game-plan-split`](../../docs/plans/PLAN_game-plan-split.md).

## Правила

- Только stdlib, `Decimal`, dataclasses. Без `fastapi`, `sqlalchemy`, `pydantic`, `app.*`, без IO — проверяет `import-linter` (`backend/.importlinter`).
- Без игровых понятий: потребности, события, победа, шаблон, лига, ход, лимиты механик. Время — `month_index` / «месяц».
- Вход — примитивы или DTO, не ORM. ORM → примитивы переводит адаптер приложения (`backend/app/finance/*` для игры).
- Ошибки — доменные исключения (`ValueError`-наследники); HTTP-статус выбирает приложение.

## Модули

| Модуль | Что |
|--------|-----|
| `money` | округление денег до копеек (`ROUND_HALF_UP`) |
| `annuity` | аннуитет, разбиение платежа, частичная оплата, досрочное погашение, продажа залога, проценты interest-only |
| `liabilities` | виды обязательств, режимы платежа, остаток срока, платёж и срок нового долга |
| `metrics` | словарь метрик ADR-009: структурные обязательства, расходы на жизнь, полный отток, доходы (с проекцией вкладов и без), структурный поток, доли, долг и просрочка, месяцы подушки, капитал, среднее Δ ликвидности |
| `household` | `HouseholdSnapshot` — финансовое состояние на начало месяца (доходы, долги, активы, статьи расходов, полисы, вклады); вход для `month_step` / прогноза |
| `invest` | тип инвест-продукта и поиск по каталогу; **каталог со ставками — у приложения** (ставки игры — её баланс, у Plan будут свои) |

## Установка и тесты

```bash
cd backend && python -m pip install -r requirements-dev.txt   # ставит ../packages/fincore editable
cd packages/fincore && python -m pytest -q
```
