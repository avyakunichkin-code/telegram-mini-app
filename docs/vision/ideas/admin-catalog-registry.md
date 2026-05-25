---
layer: vision
status: active
last_reviewed: 2026-05-25
idea_refine: true
parent: admin-and-notifications.md
related: admin-ops-quarter-2026.md
plan: ../../plans/PLAN_admin-analytics-ops.md
next_spec: specs/features/SPEC_admin-and-notifications.md
---

# Admin Catalog Registry — справочники без CMS

Сессия **idea-refine** (2026-05-25): desktop-admin, каталоги **события / стартеры / активы / долги**, списки + добавление без «закапывания» в детали. **draft/publish** отложен (`is_active`).

**Реализация:** C0 read-only списки → C1 clone/create → C2 PATCH + JSON validate → C2e choices.

---

## Problem Statement

Как дать оператору в desktop-admin доступ к четырём каталогам (список + новая запись), **не строя CMS и не дублируя четыре админки**, если сложность живёт в JSON (`blueprint`, `effects`, `choices`)?

---

## Recommended Direction — Catalog Registry Lite

### Backend

Реестр каталогов (Python), не мета-таблица в БД:

| Метод | Назначение |
|-------|------------|
| `GET /api/admin/catalogs` | Метаданные: key, title, columns |
| `GET /api/admin/catalogs/{key}/rows` | Список (`q`, `active_only`, `limit`) |

Позже: `GET/POST/PATCH` row, `POST .../clone`, choices для events.

### Frontend

- Навигация: **Watchtower** \| **Справочники**
- Роуты: `#/admin/catalogs`, `#/admin/catalogs/{key}`
- Один **`AdminCatalogList`** (таблица из API)

### Порядок каталогов (сложность ↑)

`liabilities` → `assets` → `starters` → `events` (+ choices в C2e).

### UI-принцип (full JSON без перегруза)

```
Список → [Дублировать] / [Пустой шаблон]
  → Вкладка «Основное» (скаляры)
  → Вкладка «JSON» (textarea + validate)
  → (события) подтаблица «Варианты»
```

---

## MVP Scope

### C0 ✅ (реализовано 2026-05-25)

- API: `GET /api/admin/catalogs`, `GET /api/admin/catalogs/{key}/rows`
- Backend: [`admin_catalogs.py`](../../../backend/app/admin_catalogs.py)
- UI: `#/admin/catalogs`, `#/admin/catalogs/{key}` — хаб + таблица + поиск + «только активные»
- Тесты: [`test_admin_catalogs.py`](../../../backend/tests/test_admin_catalogs.py)

### C1 (следующий)

- `POST` create, `POST .../clone`, `is_active=0` по умолчанию

### C2

- `PATCH` скаляры + `*_json` с серверной валидацией

### C2e

- `event_choices` list/add/delete

---

## Not Doing (and Why)

| Не делаем | Почему |
|-----------|--------|
| draft/publish в v1 | `is_active=0` = черновик |
| WYSIWYG preview в TMA | Phase 3 idea |
| Удаление строк | только деактивация |
| Retool / отдельная CMS | дублирование моделей |
| 4 разных экрана с нуля | один list + один editor |

---

## Key Assumptions to Validate

- [ ] Clone покрывает >70% новых записей
- [ ] Серверная валидация JSON ловит большинство ошибок
- [ ] Generic list быстрее четырёх кастомных экранов
- [ ] Правка неактивных строк не ломает текущие партии

---

## Open Questions

- [ ] Соглашение по ключам: `draft_` / `_v2`?
- [ ] Allocations стартера в UI или только blueprint JSON?
- [ ] «Тест события на себе» без draft/publish?

---

## Связанные документы

- [`admin-and-notifications.md`](admin-and-notifications.md) — North Star, Phase 2–3 Studio
- [`admin-ops-quarter-2026.md`](admin-ops-quarter-2026.md) — Watchtower / inspector
- [`PLAN_admin-analytics-ops.md`](../../plans/PLAN_admin-analytics-ops.md)

---

*C0: read-only registry в `#/admin/catalogs`.*
