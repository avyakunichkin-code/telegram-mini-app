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

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

По умолчанию только чтение и отчёт; правки в репозитории — только по явной просьбе пользователя.

## Следующий шаг

`skill-test` и [`docs/agents/AGENT_SKILLS.md`](../../../docs/agents/AGENT_SKILLS.md).
