---
layer: meta
status: active
tags:
  - tvoy-hod/layer/meta
  - tvoy-hod/layer/obsidian
  - tvoy-hod/status/active
aliases:
  - OBSIDIAN
  - "Obsidian: документация ТВОЙ ХОД"
---
# Obsidian: документация ТВОЙ ХОД

Как открыть и использовать репозиторий как **Obsidian vault** без поломки GitHub-ссылок и агентов Claude Code.

---

## Быстрый старт

1. **Obsidian → Open folder as vault** → корень репозитория `telegram-mini-app/` (не только `docs/`).
2. Стартовая страница: [[docs/Home|Home]] или [[docs/README|Карта документации]].
3. Технический онбординг кода: [[CLAUDE]].
4. После `git pull` при изменении frontmatter: `node scripts/docs/obsidian-enrich.mjs`.

**Почему корень репо:** в документах есть ссылки на `CLAUDE.md`, `landing/`, `design-lab/` — при vault только в `docs/` они ломаются.

---

## Принципы адаптации

| Решение | Зачем |
|---------|--------|
| **`useMarkdownLinks: true`** (в `.obsidian/app.json`) | Обычные `[text](path.md)` работают в Obsidian, GitHub и у агентов |
| **`tags` + `aliases` в frontmatter** | Поиск, graph filters, автодополнение `[[wikilink]]` |
| **MOC `_index.md` в папках** | Быстрый вход в слой без дублирования README |
| **Не конвертировать все ссылки в wikilinks** | Единый источник для CI, `.claude/rules`, GitHub preview |

Дополнительно можно вручную добавлять wikilinks в MOC-файлах — они не мешают остальному конвейеру.

---

## Навигация

### Карта контента (MOC)

| Слой | MOC | Основной README |
|------|-----|-----------------|
| Вход | [[docs/Home]] | [[docs/README]] |
| Handbook | [[docs/game/handbook/_index]] | [[docs/game/handbook/README]] |
| Foundation | [[docs/game/foundation/_index]] | — |
| Vision / ideas | [[docs/game/vision/_index]] | — |
| Specs | [[docs/game/specs/_index]] | — |
| Plans | [[docs/plans/README]] | [[docs/plans/README]] |
| Tasks | [[docs/game/tasks/ENGINEERING]] | [[docs/game/tasks/ENGINEERING]] |
| ADR | [[docs/decisions/_index]] | [[docs/decisions/README]] |
| Backlog | [[docs/game/backlog/_index]] | — |
| UX | [[docs/game/ux/README]] | [[docs/game/ux/README]] |
| Agents | [[docs/archive/retired/agents/_index]] | — |
| Marketing | [[docs/game/marketing/README]] | [[docs/game/marketing/README]] |
| Reference | [[docs/game/reference/_index]] | — |
| Ops | [[docs/game/ops/_index]] | — |

Трассировка эпиков: [[docs/TRACEABILITY]]. Конвейер: [[docs/DOCUMENTATION_SYSTEM]].

---

## Теги (иерархия)

Скрипт `obsidian-enrich.mjs` проставляет:

- **`tvoy-hod/layer/*`** — слой зрелости (`foundation`, `spec`, `idea`, `adr`, `plan`, `handbook`, …)
- **`tvoy-hod/status/*`** — из поля `status` frontmatter (`draft`, `approved`, `implemented`, …)
- **`tvoy-hod/topic/*`** — из `tracks` (экономика, onboarding, …)

**Graph view:** цвета по папкам настроены в `.obsidian/graph.json`.

**Фильтры в Obsidian:**

- `#tvoy-hod/layer/spec` — все спеки
- `#tvoy-hod/status/approved` — готовые к разработке
- `#tvoy-hod/topic/economy` — тематический срез

---

## Aliases (псевдонимы)

Для каждого файла генерируются `aliases` — имя файла, заголовок H1, код эпика (`E1`, `ADR-001`, `SPEC_expenses`).

Пример: `[[SPEC_expenses]]` или `[[E1]]` найдут `docs/game/specs/features/SPEC_expenses.md`.

---

## Новые документы

1. Создайте файл в нужной папке (шаблоны: `docs/templates/` — в Obsidian **Templates** plugin указывает туда же).
2. Заполните frontmatter по [`DOCUMENTATION_SYSTEM`](DOCUMENTATION_SYSTEM.md) §5.1.
3. Запустите `node scripts/docs/obsidian-enrich.mjs` — добавятся `tags` и `aliases`.
4. Добавьте ссылку в MOC `_index.md` или `TRACEABILITY.md` при необходимости.

---

## Рекомендуемые настройки Obsidian (опционально)

Community plugins (не обязательны, vault работает и без них):

- **Breadcrumbs** — иерархия MOC
- **Dataview** — динамические списки spec по `#tvoy-hod/status/draft`
- **Linter** — YAML frontmatter

Workspace (`workspace.json`) **не коммитится** — у каждого разработчика свой layout.

---

## Синхронизация с конвейером docs

При конфликте источников (из [`DOCUMENTATION_SYSTEM`](DOCUMENTATION_SYSTEM.md)):

1. Код + тесты  
2. `docs/game/specs/features/SPEC_*.md`
3. `docs/game/foundation/SPEC_PRODUCT.md`
4. Vision / ideas  
5. Handbook (обзор)

Obsidian — **надстройка для чтения и навигации**; канон путей и markdown-ссылок не меняется.

---

*Обновляйте этот файл при смене структуры vault или скрипта обогащения.*
