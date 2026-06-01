# Фаза скиллов: контент, данные, согласованность механик

**Статус:** действует с 2026-05-29, пока приоритет — наполнение игры данными и фиксация концепции, а не «идеальный» инженерный контур.

**Машиночитаемо:** поле `tier` в [`.cursor/skills/catalog.yaml`](../../.cursor/skills/catalog.yaml).  
**Роутер:** [`.cursor/rules/tvoy-hod-router.mdc`](../../.cursor/rules/tvoy-hod-router.mdc) → блок «Фаза: контент и данные».

---

## Зачем отдельная фаза

Сейчас ценность даёт не полировка кода, а:

1. **Концепция** — идеи → spec → границы ответственности (кто за что отвечает).
2. **Структуры данных** — YAML событий, seeds, API-контракты, одна цепочка источника правды.
3. **Поверхность** — lab → MQX → экраны; осмысленное отображение данных.
4. **Согласованность** — период, победа, события, needs, UI не противоречат друг другу.

Лишние скиллы в этой фазе **отвлекают агента** (perf, release, social, studio-GDD). Их не удаляем — переводим в **`tier: deferred`** (бывший `status: optional`).

---

## Модель уровней (`tier`)

| `tier` | Смысл | Где лежит SKILL.md | Автоподключение Cursor |
|--------|--------|-------------------|-------------------------|
| **core** | Primary почти всегда в этой фазе | `.cursor/skills/<name>/` | Да, по смыслу задачи |
| **support** | Обязательный satellite, редко primary | корень | По паре с core |
| **deferred** | Полезно позже или по явному запросу | корень | Нет (`status: optional`) |
| **meta** | Каталог, линт, layout | корень | Только `/skill-test`, настройка |
| **archived** | Studio / GDD-наследие | `_archived/` | Нет (`disable-model-invocation`) |

**Не делаем папку `_medium/`:** перенос = тот же overhead, что у `_archived/`, без выигрыша. `tier: deferred` + `status: optional` достаточно. Если скилл совсем не нужен год — `_archived/`.

Поле **`status`** в `catalog.yaml` сохраняем для skill-test: `active` | `optional` | `archived`.  
**`tier`** — продуктовая приоритизация внутри `active`/`optional`.

---

## Оси работы (что востребовано сейчас)

```text
                    ┌─────────────────────────────────────┐
                    │  governance: границы ответственности │
                    │  spec-driven-development            │
                    │  documentation-and-adrs (ADR)       │
                    │  doubt-driven-development (satellite)│
                    └─────────────────┬───────────────────┘
                                      │
     ┌────────────────────────────────┼────────────────────────────────┐
     │                                │                                │
     ▼                                ▼                                ▼
┌─────────────┐              ┌───────────────┐              ┌─────────────────┐
│  КОНЦЕПТ    │              │  ДАННЫЕ       │              │  ПОВЕРХНОСТЬ    │
│ idea-refine │──────────────│ create-event  │──────────────│ design-lab-mqx  │
│             │              │ event-analysis│              │ frontend-ui-  │
│             │              │ game-economy- │              │ engineering     │
│             │              │ and-victory   │              │ api-and-interface│
└─────────────┘              └───────┬───────┘              └────────┬────────┘
                                     │                               │
                                     └───────────┬───────────────────┘
                                                 ▼
                                    incremental-implementation
                                    test-driven-development (satellite)
```

### Карта ответственности (не путать)

| Вопрос | Primary | Не делает |
|--------|---------|-----------|
| Текст карточки, choices, YAML, persona | **create-event** | Не меняет `period.py` / victory engine |
| Покрытие каталога, gaps, chains (read-only) | **event-analysis** | Не пишет YAML |
| Закрытие месяца, cashflow, просрочки, инвестиции | **game-economy-and-victory** | Не пишет narrative событий |
| Победа, `victory_config_json`, chain/parallel | **game-economy-and-victory** | Не рисует UI |
| REST + `api.js` + schemas | **api-and-interface-design** | Не заполняет контент событий |
| MQX / prod UI | **frontend-ui-engineering** | Не дублирует экономику в компоненте |
| Макет до утверждения | **design-lab-mqx** | Не коммитит в prod без canon-sync |
| Граница «кто владеет полем» | **documentation-and-adrs** | Не заменяет spec |
| Ревью diff экономики | **economy-reviewer** (subagent) | Не авторит контент |

Канон событий: [ADR-008](../decisions/ADR-008-events-catalog-single-source.md), [EVENTS_AGENT.md](EVENTS_AGENT.md).

---

## Core / support / deferred (сводка)

### `tier: core` (`status: active`)

| Скилл | Ось |
|-------|-----|
| idea-refine | Концепт |
| spec-driven-development | Контракт + границы |
| create-event | Данные (события) |
| event-analysis | Данные (обзор) |
| game-economy-and-victory | Механики |
| api-and-interface-design | Контракт FE↔BE |
| design-lab-mqx | Поверхность (lab) |
| frontend-ui-engineering | Поверхность (prod) |
| incremental-implementation | Доставка срезами |
| test-driven-development | RED-GREEN одного теста (satellite) |
| critical-test-scenarios | Критичные сценарии, min gate G1–G4 |
| using-agent-skills | Выбор скилла |

### `tier: support` (`status: active`)

| Скилл | Когда primary |
|-------|----------------|
| planning-and-task-breakdown | Epic из spec, несколько MQ-* |
| code-review-and-quality | Перед merge / крупный PR |
| documentation-and-adrs | Новая граница доменов, публичный API |
| skill-test | Правка скиллов / audit |

### `tier: deferred` (`status: optional`)

Вызывать явно: perf, security, release, TMA runtime, browser devtools, deprecation, social posts, code-simplification, context-engineering, project-cursor-skills-layout.

**Исключение:** `doubt-driven-development` — остаётся deferred по статусу, но **обязателен как satellite** для `game-economy-and-victory`, крупных изменений `period.py` / victory / seeds шаблонов.

### `tier: archived`

`.cursor/skills/_archived/` — brainstorm, ux-design, design-system, … См. [CURSOR_SKILLS.md](CURSOR_SKILLS.md).

---

## Primary + satellites (фаза)

| Primary | Satellites (открыть в той же задаче) |
|---------|--------------------------------------|
| create-event | test-driven-development (`pytest -k event`) |
| event-analysis | create-event (если P1 gaps) |
| game-economy-and-victory | test-driven-development, doubt-driven-development |
| api-and-interface-design | test-driven-development, spec-driven-development (если контракт новый) |
| frontend-ui-engineering | design-lab-mqx (новый UI), api-and-interface-design (новые поля) |
| design-lab-mqx | tvoy-hod-canon-sync (rule) |
| spec-driven-development | documentation-and-adrs (если новый домен) |
| incremental-implementation | test-driven-development, critical-test-scenarios |

Subagents после крупного diff: **economy-reviewer**, **mqx-ui-reviewer** ([`catalog.yaml`](../../.cursor/skills/catalog.yaml) → `agents:`).

---

## Чего не хватает как отдельного скилла

Отдельный **mechanics-consistency** пока не вводим — чеклист живёт в:

- **game-economy-and-victory** (пересечение period / victory / events),
- **doubt-driven-development** (adversarial pass),
- **documentation-and-adrs** (ADR при споре «кто владелец»),
- **economy-reviewer** на PR.

Если чеклист разрастётся — вынести в `.cursor/skills/mechanics-consistency/` с `tier: support`.

---

## Когда вернуть deferred в core

| Скилл | Триггер |
|-------|---------|
| release-tma | Регулярные выкатки в prod |
| browser-testing-with-devtools | Стабилизация TMA UX |
| performance-optimization | Жалобы на LCP/рендер |
| security-and-hardening | Внешний аудит / auth |
| planning-and-task-breakdown | Параллельная команда >1 dev |

Процедура: поднять `tier` в `catalog.yaml`, обновить этот файл и `tvoy-hod-router.mdc`.

---

*См. также: [SKILL_DOC_MAP.md](SKILL_DOC_MAP.md), [CURSOR_SKILLS.md](CURSOR_SKILLS.md).*
