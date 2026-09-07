---
layer: audits
status: active
last_reviewed: 2026-09-07
audience: product, engineering, game-design, agents
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/status/active
aliases:
  - "Аудиты — куда класть снимки"
  - AUDITS
---
# Аудиты ТВОЙ ХОД

Слой **точечных снимков** продукта, кода, UX и контента. Не канон реализации и не бэклог.

**Агенту:** новый аудит (продуктовый, технический, UX, …) писать **только сюда**. Сначала этот файл, затем [`templates/AUDIT.md`](../templates/AUDIT.md).

При конфликте по-прежнему: **код + тесты** → `docs/specs/features/SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`. Аудит **ниже** vision: это мнение на дату, пока его выводы не утверждены в spec / ADR / backlog.

---

## Куда класть

```text
docs/audits/<kind>/<YYYY-MM-DD>-<slug>.md
```

| `<kind>` | Что это | Пример slug |
|----------|---------|-------------|
| **`product`** | Продукт + геймдизайн: core/meta loop, экономика игрока, FTUE, retention, монетизация, рынок | `product-game-design` |
| **`engineering`** | Технический: архитектура, код, API, БД, infra, security, performance, DX | `architecture` , `security` , `backend-domains` |
| **`ux`** | Поверхность игрока: MQX, lab↔prod, a11y, консистентность экранов | `mqx-consistency` |
| **`content`** | Снимок каталога событий / шаблонов как аудит (не YAML) | `event-catalog-gaps` |
| **`ops`** | Хостинг, аналитика платформы, TG bots, backup — если это обзор, не runbook | `platform-readiness` |
| **`qa`** | Механики как объект теста: edge/stress, гонки, воспроизводимость, покрытие, UI, ломающий loop | `mechanics` |
| **`liveops`** | Календарь удержания, каналы игроков, фидбек-цикл, сезоны; не Render-runbook | `community` |
| **`ai`** | Runtime-решения (picker, guidance) + dev-time агенты/LLM; не NPC/NavMesh | `runtime-and-dev-ai` |

Один файл — один kind. Смешанный «всё сразу» не делать: продуктовый и технический — **два** файла, перекрёстные ссылки в шапке.

---

## Имя файла

- Дата **съёмки** (`YYYY-MM-DD`), не дата «когда вспомнили закоммитить».
- Slug: латиница, kebab-case, без префикса `AUDIT_` (префикс даёт папка `audits/` + kind).
- Не затирать предыдущий снимок: новый файл с новой датой. В шапке нового: `supersedes:` → относительный путь старого.

---

## Обязательный ритуал после записи

1. Строка в таблице «Реестр» ниже.
2. Запись в [`foundation/DOC_SYNC_LOG.md`](../foundation/DOC_SYNC_LOG.md).
3. Если выводы меняют приоритеты — ссылка из [`backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) (аудит **не** заменяет бэклог).
4. Утверждённое «делаем так» → **spec** или **ADR**, не правка канона из аудита напрямую.

Шаблон тела: [`templates/AUDIT.md`](../templates/AUDIT.md).

---

## Сюда не класть

| Артефакт | Канонический адрес |
|----------|-------------------|
| ADR («почему в коде так») | `docs/decisions/` |
| Идея / one-pager | `docs/vision/ideas/` |
| Контракт фичи | `docs/specs/features/` |
| Чеклист код ↔ SPEC_PRODUCT (живой) | `docs/foundation/MVP_AUDIT_VS_SPEC.md` |
| Результаты плейтеста / волны | `docs/foundation/PRE_ALPHA_*` |
| Headless balance JSON / diff | `docs/balance/reports/` |
| Аудит скиллов агента | `docs/agents/` (`SKILLS_QUALITY_AUDIT_*`, `LEGACY_NOISE_AUDIT_*`) |
| Runbook деплоя | `docs/ops/` |
| Cursor Canvas | локальный IDE-артефакт; **источник истины — markdown в этой папке** |

---

## Реестр

| Дата | Kind | Файл | Статус | Суть |
|------|------|------|--------|------|
| 2026-09-07 | ai | [`ai/2026-09-07-ai-proposals.md`](ai/2026-09-07-ai-proposals.md) | draft | 6 предложений кросс-роли; быстрая победа PR-14; стратегия слоты+вынос picker |
| 2026-09-07 | ai | [`ai/2026-09-07-runtime-and-dev-ai.md`](ai/2026-09-07-runtime-and-dev-ai.md) | draft | Picker+guidance+Cursor pipeline; нет NPC; C1 пустой месяц, C2 тонкий каталог, C3 pytest вне CI |
| 2026-09-07 | liveops | [`liveops/2026-09-07-community.md`](liveops/2026-09-07-community.md) | draft | Season 0 CA: нет LTM, daily-nudge vs TB1, фидбек не замкнут |
| 2026-09-07 | ux | [`ux/2026-09-07-player-surface.md`](ux/2026-09-07-player-surface.md) | draft | Иерархия главной, словарь ход/месяц, оверлеи, FTUE O3 |
| 2026-09-07 | qa | [`qa/2026-09-07-mechanics.md`](qa/2026-09-07-mechanics.md) | draft | Edge/stress/testability TB1: гонки close/choose/salary, legacy complete-period, CI без pytest |
| 2026-09-07 | engineering | [`engineering/2026-09-07-architecture.md`](engineering/2026-09-07-architecture.md) | draft | Архитектура Pre-Alpha → production-ready; наследник assessment июня 2026 |
| 2026-09-07 | product | [`product/2026-09-07-product-game-design.md`](product/2026-09-07-product-game-design.md) | draft | Полный продуктовый + GD аудит Pre-Alpha → production-ready план |

**Ещё не перенесены** (читать по старым путям, следующий снимок того же kind — уже сюда):

| Kind | Текущий файл | Когда переносить |
|------|----------------|------------------|
| engineering | Снимок: [`engineering/2026-09-07-architecture.md`](engineering/2026-09-07-architecture.md). Исторический: [`vision/ARCHITECTURE_ASSESSMENT_2026-06.md`](../vision/ARCHITECTURE_ASSESSMENT_2026-06.md) | Assessment не удалять; следующие снимки — новые даты в `engineering/` |
| ux | Снимок: [`ux/2026-09-07-player-surface.md`](ux/2026-09-07-player-surface.md). Живой чеклист: [`specs/UI_CONSISTENCY_AUDIT.md`](../specs/UI_CONSISTENCY_AUDIT.md) | Чеклист не удалять; следующие снимки — новые даты в `ux/` |
| content | отчёт `/event-analysis` → [`templates/EVENT_CATALOG_ANALYSIS.md`](../templates/EVENT_CATALOG_ANALYSIS.md) | Снимок «каталог на дату»: `content/YYYY-MM-DD-event-catalog.md` |

Как писать технический: [`engineering/README.md`](engineering/README.md). QA: [`qa/README.md`](qa/README.md). UX: [`ux/README.md`](ux/README.md). Live Ops: [`liveops/README.md`](liveops/README.md). AI: [`ai/README.md`](ai/README.md).

---

## Для агента (коротко)

```text
Пользователь просит аудит
  → kind? product | engineering | ux | content | ops | qa | liveops | ai
  → docs/audits/README.md + templates/AUDIT.md
  → docs/audits/<kind>/<сегодня>-<slug>.md
  → строка в реестре + DOC_SYNC_LOG
  → verdict DRAFT, пока человек не сказал APPROVED
```

Не складывать аудит в `docs/vision/ideas/`, `docs/foundation/`, `docs/handbook/` или только в чат/canvas.

**Сводный PO-план** (не шестой kind): [`plans/PLAN_production-ready.md`](../plans/PLAN_production-ready.md).
