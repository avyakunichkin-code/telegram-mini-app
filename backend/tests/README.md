# Backend tests — стратегия

Цель: **не 100% coverage**, а проверки, которые ловят регрессии продукта (экономика, события, победа, контракты API).

## Пирамида

```
        acceptance/     ← mq116, сценарии «как игрок»
       / integration/    ← HTTP + DB (TestClient)
      /   unit/          ← чистая логика, serialize, victory, impacts
     / contract/         ← YAML-каталог, схемы payload (опционально)
```

| Слой | Когда | Примеры |
|------|--------|---------|
| **unit** | Быстро, без HTTP | `serialize_instance_rows`, `victory_engine`, `choice_impacts` |
| **integration** | Контракт эндпоинта + БД | `POST /choose`, `GET /pending`, start → salary |
| **acceptance** | Сквозной сценарий | `test_mq116_acceptance.py` |
| **contract/data** | Каталог не сломан | `test_mvp11_yaml_catalog.py`, parity YAML ↔ seeds |

## Маркеры pytest

```bash
pytest -m unit          # только unit/
pytest -m integration   # integration/api/
pytest -m "not slow"    # без balance_simulate
pytest -q -k event      # всё про события (legacy + новые пути)
```

## Структура каталогов

```
tests/
  conftest.py              # client, auth, seed_basic_template
  fixtures/                # фабрики профилей/полисов (DRY)
  unit/                    # доменная логика
    events/
    victory/
    game/
  integration/
    api/                   # TestClient, контракт JSON
  acceptance/              # (план) перенос mq116
  test_*.py                # legacy — постепенно переносить в подпапки
```

**Legacy:** файлы в корне `tests/` остаются валидными; новые тесты — только в подпапках.

## Качество vs «покрытие ради покрытия»

| Хороший тест | Плохой тест |
|--------------|-------------|
| Assert на **бизнес-инвариант** (cash после claim, `insurance_claim` в pending) | `assert response.status_code == 200` без тела |
| **Given–When–Then** / Arrange–Act–Assert | Копипаста setup без смысла |
| **Граница** (нет полиса → 400, повтор salary → already_claimed) | Дублирует соседний тест с другим id |
| Контракт **поля**, нужные FE (`event_domain`, `insurance_claim`) | Проверка внутренней реализации private fn |

## Приоритеты дополнения (backlog)

1. **Events FE↔BE:** `event_domain`, `insurance_claim` в `GET /pending` (unit + integration) — ★ добавлено
2. **Period close:** cashflow после `time/next` с обязательствами и просрочкой
3. **Victory v2:** chain vs parallel по template_key
4. **Plan mode:** когда активируется UI — CRUD plan expenses
5. **Property-based (опционально):** `cash` не уходит в NaN при choose (hypothesis)

## Запуск

```bash
cd backend
python -m pytest -q                    # всё
python -m pytest tests/unit -q         # быстрый слой
python -m pytest -q -k "pending or insurance" 
```

## Frontend

См. `frontend-react/src/components/mqx/events/__tests__/` и `npm run test:unit`.
