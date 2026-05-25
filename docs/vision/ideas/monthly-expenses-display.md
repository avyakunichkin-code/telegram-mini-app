# Расходы «жизни» — отображение на слоях игры

> **Эпик E1 (полный слой):** [expenses-mechanic.md](expenses-mechanic.md) → [EXPENSES_SYSTEM.md](../../specs/gameplay/EXPENSES_SYSTEM.md) → [SPEC_expenses.md](../../specs/features/SPEC_expenses.md). Этот файл — **UI/UX-очередь (волна B)** поверх API breakdown.

## Problem Statement

**Как показывать игроку обязательные ежемесячные расходы «жизни» (база шаблона + дельта от событий), чтобы они были видны до закрытия периода и не путались с долгами/обслуживанием активов?**

## Что уже есть в экономике

| Слой | Сейчас |
|------|--------|
| **Профиль** | `base_monthly_lifestyle_expense` (шаблон), `delta_monthly_lifestyle_expense` (события) |
| **Конец периода** | Списание `LIFESTYLE_EXPENSE` одной суммой в `game_period.py` |
| **Overview API** | **`monthly_lifestyle_expense`** = base + delta (добавлено) |
| **Chip «Доходы» на дашборде** | **`total_monthly_income`** (зарплата + доход активов), **без** вычета расходов и платежей по долгам |
| **Чистый поток** | `net_monthly_cashflow` — отдельно (аналитика, цели); **не** в chip «Доходы» |

## Рекомендуемое направление

1. **Дашборд:** 4-я плитка **«Расходы»** вместо стрика (стрик остаётся в **Аналитике**).
2. **Финансы / аналитика:** строка «Расходы жизни» + breakdown при закрытии периода (уже в breakdown).
3. **События:** `monthly_lifestyle_delta` в effects — без изменений.
4. **Позже:** опционально `total_monthly_outflow = obligations + lifestyle` для подсказки «всего уйдёт за период».

## Слои внедрения (очередь)

| # | Слой | Действие | Статус |
|---|------|----------|--------|
| 1 | API `GET /finance/overview` | `monthly_lifestyle_expense` | сделано |
| 2 | Dashboard Premium | stat «Расходы», primary «Зарплата» | сделано |
| 3 | Design-lab shell D | компакт + расходы в chips | сделано |
| 4 | MQX `MqxStatMini` + каталог | подпись «Расходы» в демо | backlog |
| 5 | Analytics Premium | блок «Расходы жизни» рядом со стриком | backlog |
| 6 | Закрытие периода UI | toast/итог: «Списано расходов жизни: N ₽» | backlog |
| 7 | Victory / цели | отдельная цель «расходы ≤ X% дохода» — только в шаблоне | → эпик **E1** [SPEC_expenses §9](../../specs/features/SPEC_expenses.md) |

## Key Assumptions to Validate

- [ ] Игроку достаточно **одной цифры** (base+delta), без расшифровки base/Δ на дашборде.
- [ ] Стрик не нужен на главном экране (достаточно аналитики).
- [ ] Primary-кнопка только **Зарплата**; остальные действия визуально вторичны.

## Not Doing (v1)

- Ручной ввод расходов игроком (только шаблон + события).
- Включение lifestyle в `net_monthly_cashflow` без отдельного UX-объяснения.
- Отдельная сущность «Expense» в БД.

## Open Questions

- Показывать ли в компактном shell **героя (XP)** в свёрнутом виде или только в развороте?
- Нужен ли tooltip «из них X — база шаблона, Y — после событий»?
