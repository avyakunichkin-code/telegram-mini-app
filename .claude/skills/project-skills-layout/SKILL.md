---
name: project-skills-layout
description: >-
  Explains where Claude Code project skills, rules, subagents and hooks live in this
  repository and the SKILL.md contract. Use when adding, moving or validating a skill,
  rule or subagent, onboarding contributors, or troubleshooting a skill that does not load.
argument-hint: "(справка — без аргументов)"
user-invocable: false
allowed-tools: Read, Glob, Grep
---

## Стандарт качества и вызов

**Meta-скилл:** не product delivery. Для кода/spec/UI — доменный скилл + [release-ready-quality.md](../_shared/release-ready-quality.md).

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) · **Уточнение:** [clarify-first.md](../_shared/clarify-first.md).

# Расположение AI-конфигурации (Claude Code)

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/agents/AGENT_SKILLS.md`](../../../docs/agents/AGENT_SKILLS.md)
- [`.claude/skills/catalog.yaml`](../catalog.yaml)
- [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md)

**Куда писать:** `.claude/`, `docs/agents/`. **Дальше:** `skill-test`.

## Механизмы и где они лежат

Официальная документация: [skills](https://code.claude.com/docs/en/skills), [memory/rules](https://code.claude.com/docs/en/memory), [subagents](https://code.claude.com/docs/en/sub-agents), [hooks](https://code.claude.com/docs/en/hooks).

| Механизм | Путь | Когда в контексте |
|----------|------|-------------------|
| **CLAUDE.md** | `CLAUDE.md` (корень) | Всегда. Цель < 200 строк: индекс, не процедуры |
| **Rules** | `.claude/rules/*.md` | Без `paths` — всегда (`router.md`); с `paths` — когда Claude читает/правит совпадающий файл |
| **Skills** | `.claude/skills/<name>/SKILL.md` | Описание — всегда; тело — при вызове `/name` или когда Claude решит, что скилл релевантен |
| **Subagents** | `.claude/agents/*.md` | Отдельный контекст; вызываются по `description` или явно |
| **Hooks** | `.claude/settings.json` → `hooks`, скрипты в `.claude/hooks/` | Детерминированно на событиях (`SessionStart`, `PreToolUse` — гейт сгенерированных файлов, `PostToolUse` — подсказки) |
| **FE skills** | `frontend-react/.claude/skills/` | Вложенные: подгружаются, когда Claude работает с файлами в `frontend-react/` |

```text
.claude/
  settings.json          # hooks + permissions (в git)
  settings.local.json    # личное (gitignored)
  rules/                 # router.md (всегда) + path-scoped правила
  agents/                # economy-reviewer, mqx-ui-reviewer, economy-balance-runner
  agent-memory/<agent>/  # persistent memory subagent'ов с `memory: project` (в git)
  hooks/                 # *.mjs для settings.json
  skills/
    <skill-name>/SKILL.md   # active + optional (discoverable)
    _archived/<name>/       # не обнаруживаются Claude (вложены на уровень глубже)
    _shared/                # общие стандарты (не скилл: нет SKILL.md)
    catalog.yaml            # tier, must_read, read_if, writes_to, next_skill
    specs/ results/ templates/
```

## Контракт `SKILL.md`

```yaml
---
name: kebab-case-name          # = имя папки = /slash-команда
description: >-                # что делает + когда применять; ≤ 1536 символов вместе с when_to_use
  ...
argument-hint: "[подсказка]"
user-invocable: true           # false — скрыть из меню «/» (справочные скиллы)
allowed-tools: Read, Glob, Grep, Bash(python -m pytest *)
# опционально:
# disable-model-invocation: true   # только явный /name (deferred, archived, side-effect)
# paths:                           # авто-вызов моделью только при работе с совпадающими файлами
#   - "backend/**"                 #   (create-event, db-baselines-and-migrations)
# context: fork                    # тело = промпт изолированного subagent (без истории чата; event-analysis)
# agent: Explore                   # тип subagent для fork (по умолчанию general-purpose)
---
```

Правила контракта (проверяет `node .claude/skills/skill-test/_static-check.mjs`):

- **`allowed-tools` — это пре-одобрение, а не ограничение.** Перечисленное выполняется без запроса разрешения, пока активен скилл. Поэтому: только реальные инструменты Claude (`Read`, `Glob`, `Grep`, `Write`, `Edit`, `Bash(...)`, `AskUserQuestion`, `WebFetch`…); `Bash` — **только со скоупом** (`Bash(python -m pytest *)`), не голый. `Shell` — несуществующий инструмент (наследие Cursor).
- **Нельзя** одновременно `disable-model-invocation: true` и `user-invocable: false` — скилл станет недостижим.
- `SKILL.md` < 500 строк; длинное — в соседние файлы (один уровень ссылок).
- Файл **без UTF-8 BOM**, `---` — первая строка (иначе frontmatter игнорируется).
- В теле: **Итог (Verdict)**, **Согласование** перед записью, **Следующий шаг**.
- `context: fork` — только для скилла с явной задачей (не свода правил): subagent не видит чат и не может задать вопрос, поэтому scope берётся из `$ARGUMENTS` с дефолтом; нужно ≥ 5 H2/фаз (Check 6).

## Rules: формат

```markdown
---
paths:
  - "backend/**/*.{py,sql}"
---
# Заголовок правила
```

`paths` — единственное поле, которое читает Claude Code. Только YAML-список: в строке через запятую фигурные скобки `{a,b}` ломаются.

## Добавление нового скилла

1. `.claude/skills/<kebab-case-name>/SKILL.md` по контракту выше.
2. Запись в [`catalog.yaml`](../catalog.yaml) (`tier`, `context.must_read`, `writes_to`, `next_skill`).
3. Длинные справочники — соседние `.md`; скрипты — `scripts/`.
4. Проверка: `/skill-test static <name>` и `node .claude/skills/skill-test/_context-check.mjs`.

---

## Расширенная карта роутера

Перенесено из `.claude/rules/router.md` (2026-10-15), чтобы роутер в каждой сессии занимал меньше контекста. Роутер оставляет только выбор primary-скилла и обязательные пары.

### Карта проекта

- **Код и API**: [`CLAUDE.md`](../../../CLAUDE.md)
- **Лексикон игры**: [`.claude/skills/_shared/game-lexicon.md`](../../../.claude/skills/_shared/game-lexicon.md)
- **Продукт**: [`docs/foundation/SPEC_PRODUCT.md`](../../../docs/foundation/SPEC_PRODUCT.md) — §1.1 **каналы: PWA/web primary**, TMA secondary ([ADR-012](../../../docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md))
- **Конвейер docs**: [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md), [`docs/DOCUMENTATION_SYSTEM.md`](../../../docs/DOCUMENTATION_SYSTEM.md)
- **Аудиты (снимки)**: [`docs/audits/README.md`](../../../docs/audits/README.md) — `product/` · `engineering/` · шаблон [`docs/templates/AUDIT.md`](../../../docs/templates/AUDIT.md)
- **Скиллы**: [`docs/agents/AGENT_SKILLS.md`](../../../docs/agents/AGENT_SKILLS.md), [`docs/agents/AI_ONBOARDING.md`](../../../docs/agents/AI_ONBOARDING.md), [`docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md`](../../../docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md), [`.claude/skills/catalog.yaml`](../../../.claude/skills/catalog.yaml) (`tier`)
- **Баланс / пороги**: [`game-balance-thresholds-and-constraints.md`](../../../docs/vision/ideas/game-balance-thresholds-and-constraints.md)
- **Баланс событий (authoring)**: [`.claude/skills/create-event/event-balance-rules.md`](../../../.claude/skills/create-event/event-balance-rules.md) — §10 lifecycle, §11 needs_axis_map
- **MQX**: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) — читать **целиком** перед новым UI (исключение: hotfix без смены дизайна)

Studio/GDD: [`.claude/skills/_archived/`](../../../.claude/skills/_archived/) — Claude их не обнаруживает как скиллы; по явному запросу прочитай нужный `SKILL.md` вручную.

### Фаза: контент и данные (приоритет сейчас)

`catalog.yaml` → **`tier: core`** — primary по умолчанию. **`tier: support`** — plan / review / ADR. **`tier: deferred`** — только по запросу (perf, release, TMA runtime, …). Полная карта: [`SKILLS_PHASE_CONTENT_AND_DATA.md`](../../../docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md).

| Ось | Core | Не путать с |
|-----|------|-------------|
| Концепт + контракт | idea-refine, spec-driven-development | studio `_archived/` |
| Данные (события) | create-event, event-analysis | game-economy (движок периода) |
| Механики | game-economy-and-victory | create-event (YAML карточек) |
| FE↔BE | api-and-interface-design | incremental без spec |
| Поверхность | design-lab-mqx → frontend-ui-engineering | lab без canon-sync в prod; **primary QA: PWA/web** |
| Границы доменов | documentation-and-adrs (support) | код без ADR при споре «кто владелец» |
| **Схема БД / миграции / seeds** | **db-baselines-and-migrations** (support) | create-event (контент в YAML, не SQL) |

**Satellites — когда задача их затрагивает:** create-event → тесты на YAML-каталог; game-economy → тесты + doubt-driven-development для необратимых или рискованных правок формул и победы; крупный diff → economy-reviewer / mqx-ui-reviewer.

### Tier и общие правила скиллов

**`tier: deferred`** (явный вызов): `deprecation-and-migration`, **`release-web`**, `telegram-mini-app-runtime`, `social-changelog-posts`. Встроенные вместо удалённых скиллов: `/simplify`, `/security-review`, `/code-review`.

**`tier: support`:** `planning-and-task-breakdown` (epic), `code-review-and-quality` (merge), `project-handbook-documentation` (handbook для людей), `documentation-and-adrs` (граница доменов), **`db-baselines-and-migrations`** (PostgreSQL baseline/миграции/seeds), **`guidance-onboarding`** (O3 онбординг), **`admin-ops`** (админка, Watchtower, ops-алерты). **`doubt-driven-development`** — deferred, но satellite для game-economy.

Скилл с `status: active` — блок **«Прочитай сначала»** в `SKILL.md` до процедуры.

**Release-ready:** все product-скиллы следуют [`.claude/skills/_shared/release-ready-quality.md`](../../../.claude/skills/_shared/release-ready-quality.md) — результат **готов к merge**, не набросок. **Workflow:** [delivery-workflow.md](../../../.claude/skills/_shared/delivery-workflow.md) (думаем → уточняем → планируем → делаем). **Неясность:** [clarify-first.md](../../../.claude/skills/_shared/clarify-first.md). **Визуал:** [visual-assets-policy.md](../../../.claude/skills/_shared/visual-assets-policy.md). Границы: [`skill-responsibility-matrix.md`](../../../.claude/skills/_shared/skill-responsibility-matrix.md).

### Path-scoped rules

| Rule | Когда |
|------|--------|
| `.claude/rules/backend.md` | `backend/**` |
| `.claude/rules/db-migrations.md` | `backend/migrations/**`, `backend/app/seeds/**`, `backend/scripts/db.sh` |
| `.claude/rules/fincore.md` | `packages/fincore/**`, `backend/.importlinter` — общее ядро Game/Plan (ADR-016) |
| `frontend-*.md` | `frontend-react/**` |
| `.claude/rules/design-lab.md` | `design-lab/**` — хаб `nav.manifest` → `design-lab:build-nav`; см. `docs/agents/DESIGN_LAB_NAVIGATION.md` |
| `.claude/rules/canon-sync.md` | утверждённый UI → prod |
| `release-web/guardrails.md` | перед PR / выкаткой |

**Hooks:** `.claude/settings.json` — `SessionStart` (указатель на роутер) и `PostToolUse` на `Edit|Write` (напоминания pytest / guardrails / sync-lab). Не блокируют.

### Subagents (post-diff review, не primary)

Parent agent запускает **после крупного diff** — дополняют pytest/TDD, не заменяют primary skill.

| Agent | Когда запускать | Режим | Не заменяет |
|-------|-----------------|-------|-------------|
| **economy-reviewer** | Логика/данные `game/`, `victory/`, events seeds; смена balance-чисел | Read/Grep/Glob + Bash (pytest) | `game-economy-and-victory`, pytest |
| **economy-balance-runner** | Крупная правка seeds/YAML/period — нужен sim 30–40p + diff baseline | Bash + Write (отчёты) | unit tests, authoring |
| **mqx-ui-reviewer** | Крупный MQX или lab→prod в одном PR | Read/Grep/Glob | `DESIGN_WORKFLOW`, мелкий hotfix |

**Когда НЕ запускать:** hotfix 1–2 файла, docs-only, rename без поведения, authoring YAML по **`create-event`** (satellite **`event-analysis`** для §10/§11 audit).

**Правила:** один primary на задачу; subagent — второй проход, не параллельный primary. Определения: [`.claude/agents/`](../../../.claude/agents/) (запуск — Agent tool с `subagent_type` = имя агента или «Use economy-reviewer…» в запросе); `trigger_globs`: [`.claude/skills/catalog.yaml`](../../../.claude/skills/catalog.yaml) → `agents:`. Онбординг: [`docs/agents/AI_ONBOARDING.md`](../../../docs/agents/AI_ONBOARDING.md) §5.

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

По умолчанию только чтение и отчёт; правки в репозитории — только по явной просьбе пользователя.

## Следующий шаг

`skill-test` и [`docs/agents/AGENT_SKILLS.md`](../../../docs/agents/AGENT_SKILLS.md).
