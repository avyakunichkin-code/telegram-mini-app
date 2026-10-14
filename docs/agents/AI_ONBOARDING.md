---
layer: agents
status: active
tags:
  - tvoy-hod/layer/agents
  - tvoy-hod/status/active
aliases:
  - "AI онбординг"
  - AI_ONBOARDING
---
# AI онбординг (Claude Code)

Краткий вход для **новой сессии** до кода. Технический контекст продукта — [`CLAUDE.md`](../../CLAUDE.md); этот файл — **как работать** в репозитории.

---

## 1. Первые 5 минут (порядок чтения)

| # | Файл | Зачем |
|---|------|--------|
| 0 | [`CONVENTIONS.md`](../../CONVENTIONS.md) | Вердикт C-X…C-4 (выше `CLAUDE.md` и скиллов) |
| 1 | [`.claude/rules/router.md`](../../.claude/rules/router.md) | Фаза → **один primary** + satellites |
| 2 | [`.claude/rules/working-agreements.md`](../../.claude/rules/working-agreements.md) + [`router.md`](../../.claude/rules/router.md) | C-Y, стоп при конфликте, один primary, честный вердикт; выбор скилла |
| 3 | [`.claude/skills/_shared/delivery-workflow.md`](../../.claude/skills/_shared/delivery-workflow.md) | Думаем → уточняем → планируем → делаем |
| 4 | [`.claude/skills/_shared/clarify-first.md`](../../.claude/skills/_shared/clarify-first.md) | STOP при неясности |
| 5 | [`SKILL_DOC_MAP.md`](SKILL_DOC_MAP.md) | Конвейер docs ↔ код |

**Конфликт источников ([C-1](../../CONVENTIONS.md)):** код + тесты → `docs/specs/features/SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`.  
**Аудиты:** [`docs/audits/README.md`](../audits/README.md) — снимки, не канон.

---

## 2. Каналы доставки (ADR-012)

**Primary:** PWA + web (browser, JWT). **Secondary:** Telegram Mini App.

| Документ | Зачем |
|----------|--------|
| [`ADR-012`](../decisions/ADR-012-primary-channels-pwa-web-over-tma.md) | Решение и trade-offs |
| [`SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md) §1.1 | Канон каналов |
| [`PWA_INSTALL.md`](../foundation/PWA_INSTALL.md) | Install + smoke |

**Release gate:** `/release-web`.  
**TMA runtime:** `telegram-mini-app-runtime` — только при правках WebApp shell.

---

## 3. Выбор primary skill

- **`tier: core`** в [`catalog.yaml`](../../.claude/skills/catalog.yaml) — primary по умолчанию для product-задач.
- **`tier: support`** — plan, review, ADR, DB migrations.
- **`tier: deferred`** — только по явному запросу (`release-web`, perf, TMA runtime, …).
- **When NOT primary:** [`skill-responsibility-matrix.md`](../../.claude/skills/_shared/skill-responsibility-matrix.md).

Не смешивать два primary на одну задачу. Satellites открывать **в той же сессии** (см. router → Primary + satellites).

---

## 4. Контекст: must_read vs read_if

| Поле | Когда грузить |
|------|----------------|
| **`must_read`** | Всегда до процедуры skill |
| **`read_if`** | Только если задача совпала с колонкой **`when`** в catalog / «Читай при условии» в `SKILL.md` |

**MQ-* задачи:** в frontmatter указывай **`read_if_when`** — список matching `when`, не все paths из catalog.

Справка при нарезке задач:

```bash
node .claude/skills/skill-test/_resolve-read-if.mjs <skill-name>
```

Шаблон: [`docs/templates/TASK_SLICE.md`](../templates/TASK_SLICE.md).

---

## 5. Release-ready bar

[`release-ready-quality.md`](../../.claude/skills/_shared/release-ready-quality.md) — результат **готов к merge**, не набросок.

- **COMPLETE** — только при verify + self-review.
- Идеи / ранний spec → **DRAFT**; lab → **APPROVED** до prod.
- Иконки/фоны: [`visual-assets-policy.md`](../../.claude/skills/_shared/visual-assets-policy.md).

---

## 6. Subagents (после крупного diff)

Subagents **не заменяют** primary skills и pytest. Parent agent решает, когда запускать.

| Agent | Когда | Режим |
|-------|-------|-------|
| **economy-reviewer** | Крупный diff `game/` / `victory/` / events data | readonly |
| **economy-balance-runner** | Смена balance metrics, seeds, YAML каталога | shell (sim + diff) |
| **mqx-ui-reviewer** | Крупный MQX / lab→prod в одном PR | readonly |

**Не запускать:** hotfix одной строки, docs-only, мелкий тест, authoring YAML по **`create-event`** (достаточно satellite **`event-analysis`** при audit).

Определения: `.claude/agents/*.md` (frontmatter `tools` ограничивает инструменты). Запуск: «Use economy-reviewer on this diff» или Agent tool с `subagent_type`. Метаданные: `catalog.yaml` → `agents:` + `trigger_globs`. Подробнее: router § Subagents.

---

## 7. Проверки и CI

Локально из корня репо:

```bash
node .claude/skills/skill-test/_static-check.mjs
node .claude/skills/skill-test/_context-check.mjs
node .claude/skills/skill-test/_category-check.mjs
node .claude/skills/skill-test/_archived-check.mjs
```

Maintenance: `node .claude/skills/skill-test/_maintain.mjs help`

CI: [`.github/workflows/skills-check.yml`](../../.github/workflows/skills-check.yml) (static + context + category на PR).

Аудит качества скиллов (архив): [`SKILLS_QUALITY_AUDIT_2026-06-20.md`](SKILLS_QUALITY_AUDIT_2026-06-20.md). Актуальная политика: [release-ready-quality.md](../../.claude/skills/_shared/release-ready-quality.md).

---

## 8. Типовые потоки

```text
idea → spec → plan/MQ-* → incremental (+ TDD + critical-tests) → code-review
```

События: **`create-event`** / **`event-analysis`** · Экономика: **`game-economy-and-victory`** · UI: **`design-lab-mqx`** → **`frontend-ui-engineering`**.

Полная карта: [`AGENT_SKILLS.md`](AGENT_SKILLS.md) · [`SKILLS_PHASE_CONTENT_AND_DATA.md`](SKILLS_PHASE_CONTENT_AND_DATA.md).

---

## 9. Hooks

[`.claude/settings.json`](../../.claude/settings.json) — напоминания после правок economy / UI / lab / migrations. Session start: `must_read` vs `read_if` + delivery workflow.
