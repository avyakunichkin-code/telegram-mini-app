# Документация Money Quest

Структура **вариант A** (слои зрелости): [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md)  
Шаблоны: [`templates/`](templates/) · Трассировка эпиков: [`TRACEABILITY.md`](TRACEABILITY.md)

Технический онбординг: [`../CLAUDE.md`](../CLAUDE.md)

---

## Карта папок

| Слой | Путь | Назначение |
|------|------|------------|
| **Система** | [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md) | Конвейер idea → spec → plan → tasks |
| **Foundation** | [`foundation/`](foundation/) | Продукт «как есть», потоки, термины |
| **Vision** | [`vision/ideas/`](vision/ideas/) | Идеи и целевое направление (idea-refine) |
| **Specs** | [`specs/`](specs/) | Что строим (acceptance, API, UI) |
| **Plans** | [`plans/`](plans/) | Как строим (срезы, зависимости) |
| **Tasks** | [`tasks/`](tasks/) | Выгрузка MQ-* (опционально) |
| **Decisions** | [`decisions/`](decisions/) | ADR — почему так |
| **Backlog** | [`backlog/`](backlog/) | Приоритеты P0–P3 |
| **Reference** | [`reference/`](reference/) | GDD, брендбук, investor deck |
| **Agents** | [`agents/`](agents/) | Cursor skills и приоритеты |

---

## Быстрый вход по роли

| Роль | Читать |
|------|--------|
| Разработчик / агент | `CLAUDE.md` → [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) → spec своей фичи |
| Продукт | [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) + [evolution §II](vision/ideas/money-quest-evolution-after-mvp.md) |
| UI/UX | [`specs/SPEC_FRONTEND_UI.md`](specs/SPEC_FRONTEND_UI.md) + [`reference/brandbook/BRANDBOOK.md`](reference/brandbook/BRANDBOOK.md) |
| Планирование | [`backlog/PRODUCT_BACKLOG.md`](backlog/PRODUCT_BACKLOG.md) + [`TRACEABILITY.md`](TRACEABILITY.md) |

---

## Ключевые документы

### Foundation

| Документ | Содержание |
|----------|------------|
| [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) | Продукт, цикл, экономика MVP; **§0** — краткая дорожная карта Game/Plan |
| [`foundation/TMA_USER_FLOWS.md`](foundation/TMA_USER_FLOWS.md) | Потоки и боли Telegram Mini App |
| [`foundation/GLOSSARY.md`](foundation/GLOSSARY.md) | Термины (период, подушка, save_kind, …) |
| [`foundation/MVP_AUDIT_VS_SPEC.md`](foundation/MVP_AUDIT_VS_SPEC.md) | Чеклист: текущий код vs SPEC_PRODUCT перед G1 |

### Vision

| Документ | Содержание |
|----------|------------|
| [`vision/ideas/money-quest-evolution-after-mvp.md`](vision/ideas/money-quest-evolution-after-mvp.md) | **Часть II** — Game/Plan, Q&A, план по слоям (источник истины для цели) |

### Specs

| Документ | Содержание |
|----------|------------|
| [`specs/SPEC_FRONTEND_UI.md`](specs/SPEC_FRONTEND_UI.md) | UI/UX MQX, a11y, границы |
| [`specs/SPEC_ANALYTICS.md`](specs/SPEC_ANALYTICS.md) | Вкладка «Аналитика» и данные |
| [`specs/features/SPEC_game-plan.md`](specs/features/SPEC_game-plan.md) | Эпик G1 — Game E2E, `save_kind`, ADR-001 (**approved**) |

### Backlog и агенты

| Документ | Содержание |
|----------|------------|
| [`backlog/PRODUCT_BACKLOG.md`](backlog/PRODUCT_BACKLOG.md) | Бэклог P0–P3 |
| [`agents/CURSOR_SKILLS.md`](agents/CURSOR_SKILLS.md) | Приоритет Agent Skills |

### Reference

| Документ | Содержание |
|----------|------------|
| [`reference/MONEY_QUEST_DESIGN_AND_GDD_OUTLINE.md`](reference/MONEY_QUEST_DESIGN_AND_GDD_OUTLINE.md) | GDD-оглавление |
| [`reference/brandbook/BRANDBOOK.md`](reference/brandbook/BRANDBOOK.md) | Визуал и тон |
| [`reference/investor-deck/INVESTOR_DECK.md`](reference/investor-deck/INVESTOR_DECK.md) | Investor deck |

---

## Конвейер (кратко)

1. **idea-refine** → `vision/ideas/<slug>.md`
2. **spec** → `specs/features/SPEC_<slug>.md` (DoR в [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md))
3. **plan** → `plans/PLAN_<slug>.md`
4. **tasks** → MQ-* в plan или `tasks/`
5. **код** → PR со ссылкой на spec

---

## Устаревшие пути

Файлы-редиректы в корне `docs/` (если есть) указывают на новое расположение после миграции мая 2026.
