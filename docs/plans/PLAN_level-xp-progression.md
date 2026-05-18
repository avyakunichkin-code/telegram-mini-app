---
layer: plan
status: draft
spec_formula: specs/gameplay/LEVEL_XP_SYSTEM.md
spec_execution: specs/features/SPEC_mvp-11-progression-events.md
matrix: specs/gameplay/catalogs/XP_EVENTS_ACTIONS_MATRIX.md
last_reviewed: 2026-05-17
---

# Plan: прогрессия уровней, XP и разблокировка механик

Связанные артефакты:

| Документ | Роль |
|----------|------|
| [`LEVEL_XP_SYSTEM`](../specs/gameplay/LEVEL_XP_SYSTEM.md) | Формула need(L), философия разблокировок, целевая таблица механик |
| [`XP_EVENTS_ACTIONS_MATRIX`](../specs/gameplay/catalogs/XP_EVENTS_ACTIONS_MATRIX.md) | Список источников XP (действия + события) |
| [`SPEC_mvp-11-progression-events`](../specs/features/SPEC_mvp-11-progression-events.md) | Исполняемый срез: БД tiers, refactor XP, overview, клиент |

---

## Dependency graph

```text
LEVEL_XP_SYSTEM (approve draft) ↔ MATRIX живой журнал обновлений
  └── Спека MVP 11: SQL event_tier + фильтры + progression module + overview
        └── MATRIX: синхронизировать константы XP из кода после MQ-113
              └── PHASE 2: MechanicUnlockConfig + guards в routers invest/insurance/finance assets
                    └── PHASE 3: UX disable + тексты разблока
                          └── PHASE 4: телеметрия + баланс кривой need(L)
```

---

## Фазы (vertical slices продукта)

### Фаза 1 — ядро (пересекается MQ-111…116 из backlog)

**Цель:** единое начисление XP, видимость уровня, события по `event_tier`.

**Acceptance:** см. успех SPEC MVP 11; матрица §2 отражает код **до** следующего изменения порогов XP.

---

### Фаза 2 — константы и реестр ключей источников

**Цель:** вынести XP в конфигируемые константы (enum или pydantic-схемы), тест «каждый ключ из матрицы покрывает ветку в коде».

**Acceptance:**

- файл константы + unit-тест `test_xp_sources_matrix_keys`;
- столбцы «XP baseline» матрицы = фактический конфиг после merge.

---

### Фаза 3 — серверные гейты дорогих механик

**Цель:** эндпоинты **`/invest/**`, **`/insurance/**`, возможно создание активов из шаблона проверяют `profile.level` по таблице из [`LEVEL_XP_SYSTEM §3`](../specs/gameplay/LEVEL_XP_SYSTEM.md).

**Исключение:** объект уже есть в профиле — см. invariant §8 `LEVEL_XP_SYSTEM`.

**Acceptance:**

- таблица `mechanic_unlock_level` минимально как dict в коде или JSON в `GameStarterTemplate` (решение перед реализацией);
- 400 с понятным `detail`, не молча 500.

---

### Фаза 4 — UX и баланс

**Цель:** подсказки «откроется на N уровне», отключённые кнопки, возможные капсы антифарма; смоук «периодов до ур. 5».

**Acceptance:**

- человек-проходит сценарий из [`LEVEL_XP_SYSTEM §4.3`](../specs/gameplay/LEVEL_XP_SYSTEM.md) ориентира;
- продукт утверждает ответы на вопросы §10 там же.

---

## Риски и снижение

| Риск | Меры |
|------|------|
| Дубль прогресса в UI (`gamification_*` vs `character_*`) | явные подписи в UI; возможный deprecation фин. строки позже ADR |
| Шаблон дал объект раньше гейта | invariant §8; тест профилей с высокими долгами на низком уровне |
| Недоступные события из-за малого набора defs | SPEC MVP 11 fallback уже расширяет lower bound |

---

## Чеклист перед тем как брать код

- [ ] Ответили на блок вопросов [`LEVEL_XP_SYSTEM §10`](../specs/gameplay/LEVEL_XP_SYSTEM.md)
- [x] `SPEC_mvp-11-progression-events` переведена в **`approved`**; исполнительный план [`PLAN_mvp-11-progression-events`](PLAN_mvp-11-progression-events.md)
- [ ] Матрица §2 синхронна с кодом перед merge фазы

---

### История

2026-05-17 — план добавлен после запроса на полноценную модель прогресса.
