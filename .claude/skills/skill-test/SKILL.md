---
name: skill-test
description: "Validates ТВОЙ ХОД Claude Code config — skills, rules, subagents, hooks — by running the repo checkers and interpreting results; spec mode checks a skill against its behavioral test spec. Modes: static, context, category, archived, config, spec, audit."
argument-hint: "static | context | category | archived | config | spec <skill> | audit"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Bash(node .claude/skills/skill-test/*), Bash(node .claude/hooks/guards.test.mjs)
model: sonnet
---

# Skill Test

## Прочитай сначала (ТВОЙ ХОД)

- [`.claude/skills/catalog.yaml`](../catalog.yaml) — `status`, `tier`, `context`, `spec`
- [`.claude/skills/quality-rubric.md`](../quality-rubric.md)
- [`docs/agents/AGENT_SKILLS.md`](../../../docs/agents/AGENT_SKILLS.md)

**Куда писать:** `.claude/skills/results/` (только spec-режим и только с согласия). Контракт полей SKILL.md — скилл `project-skills-layout`.

## Режимы

Проверки — это скрипты; скилл их запускает (из корня репо) и объясняет результат. Те же скрипты гоняет CI (`.github/workflows/skills-check.yml`).

| Режим | Команда | Что проверяет |
|-------|---------|---------------|
| `static` | `node .claude/skills/skill-test/_static-check.mjs` | Контракт SKILL.md: обязательные поля, C1–C6 (BOM, реальные инструменты, scoped Bash, достижимость, ≤ 500 строк, YAML-кавычки), фазы, verdict, согласование записи, handoff |
| `context` | `node .claude/skills/skill-test/_context-check.mjs` | `catalog.yaml` ↔ «Прочитай сначала» / «Читай при условии» ↔ пути на диске |
| `category` | `node .claude/skills/skill-test/_category-check.mjs` | Рубрика категории из `quality-rubric.md` |
| `archived` | `node .claude/skills/skill-test/_archived-check.mjs` | `_archived/*`: `disable-model-invocation`, баннер, статус в каталоге |
| `config` | `node .claude/skills/skill-test/_claude-config-check.mjs` и `node .claude/hooks/guards.test.mjs` | Rules (`paths`), subagents (`tools`, `memory`), хуки в `settings.json` |
| `spec <skill>` | — (оценка моделью) | Поведенческая спека скилла, см. ниже |
| `audit` | все скрипты выше | Сводка по всем режимам + скиллы без спеки |

Без аргумента — `audit`.

## Spec mode

1. Скилл — `.claude/skills/<name>/SKILL.md`; спека — путь из поля `spec:` в `catalog.yaml`. Нет одного из файлов → сообщи и остановись.
2. Прочитай оба файла целиком. Для каждого Test Case: Fixture (состояние репо) → Expected behavior → Assertions.
3. Каждую assertion оцени по тексту скилла: **PASS** — инструкции её выполняют; **PARTIAL** — выполняют с двусмысленностью; **FAIL** — не выполняют при данном fixture. Причину FAIL — цитатой из скилла.
4. Protocol compliance: согласование перед записью, отчёт до запроса на запись, следующий шаг в конце.
5. Отчёт: кейсы с вердиктами, затем **Overall Verdict**. Сохранить в `.claude/skills/results/skill-test-spec-<name>-<YYYY-MM-DD>.md` — только после «да» пользователя.

Это проверка рассуждением, не исполнение: она показывает, что скилл *описывает* нужное поведение, а не то, что модель ему следует. Поведение проверяется на реальной задаче.

## Интерпретация

- **NON-COMPLIANT / FAIL** — блокирует merge изменений в `.claude/` (CI красный). Исправлять скилл, а не ослаблять проверку.
- **WARNINGS** — эвристики; разобрать, но merge не блокируют.
- Новая проверка в скрипте — сначала прогнать на старой версии файлов (должна ловить известный дефект) и на текущей (должна быть зелёной).

---

## Итог (Verdict)

Явно укажи: **COMPLIANT** / **NON-COMPLIANT** (static, context, category, archived, config), **PASS** / **PARTIAL** / **FAIL** (spec), сводку **COMPLETE** с числами по режимам (audit).

## Согласование изменений

По умолчанию только чтение и отчёт. Запись результатов spec-режима и любые правки скиллов — только после явного «да» (**May I write** / **Могу записать**).

## Следующий шаг

NON-COMPLIANT → исправить скилл по сообщению проверки и перезапустить режим; новая спека — по шаблону [`templates/skill-test-spec.md`](../templates/skill-test-spec.md); контракт полей — `project-skills-layout`.
