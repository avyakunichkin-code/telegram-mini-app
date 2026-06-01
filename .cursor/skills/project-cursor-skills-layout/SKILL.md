---
name: project-cursor-skills-layout
description: >-
  Explains where project Agent Skills live in this repository and how to add or
  relocate them. Use when configuring Cursor for the repo, moving skills between
  `.cursor/rules` and `.cursor/skills`, onboarding contributors, or troubleshooting
  missing project skills.
disable-model-invocation: true
argument-hint: "(справка — без аргументов)"
user-invocable: false
allowed-tools: Read, Glob, Grep
---


# Расположение Agent Skills в этом проекте

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/agents/CURSOR_SKILLS.md`](../../../docs/agents/CURSOR_SKILLS.md)
- [`.cursor/skills/catalog.yaml`](../catalog.yaml)
- [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md)

**Куда писать:** `.cursor/skills/`, `docs/agents/`. **Дальше:** `using-agent-skills`, `skill-test`.

## Разница между Rules и Skills

| Механизм | Путь | Формат | Назначение |
|----------|------|--------|------------|
| **Cursor Rules** | `.cursor/rules/*.mdc` | YAML + markdown, поля `description`, `globs`, `alwaysApply` | Постоянный или контекстный контекст по маске файлов |
| **Agent Skills** | `.cursor/skills/<имя-скилла>/SKILL.md` | YAML (см. контракт ниже) + тело | Процедуры и доменные знания, подключаются по смыслу или явно |

Проектные скиллы и приоритеты — [`docs/agents/CURSOR_SKILLS.md`](docs/agents/CURSOR_SKILLS.md). Дублировать доменные процедуры в `~/.cursor/skills-cursor/` не нужно.

## Где лежат скиллы ТВОЙ ХОД

Все проектные скиллы — в каталоге:

```text
.cursor/skills/
  <skill-name>/          # active + optional (автоподключение Cursor)
    SKILL.md
  _archived/
    <skill-name>/        # studio/GDD — не удалять, disable-model-invocation
  catalog.yaml       # context.must_read / writes_to / next_skill на скилл
  specs/
```

Активные и optional — в корне; **archived** — в `_archived/` ([`README`](../_archived/README.md)). Карта фаз: [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md).

Имя папки обычно совпадает с полем `name` в frontmatter `SKILL.md`.

## Если скиллы оказались в `.cursor/rules/`

Перенос: каждую подпапку с `SKILL.md` переместить в `.cursor/skills/`, сохранив имя папки и относительные файлы (например `idea-refine/scripts/`).

В `.cursor/rules/` оставляют только **правила** в формате `.mdc` (см. официальную документацию Cursor по Rules).

## Контракт `SKILL.md` (обязательные поля)

Не полный CCGS — только то, что нужно Cursor и `/skill-test static`:

```yaml
---
name: kebab-case-name          # = имя папки
description: "Что делает и когда применять (третье лицо)."
argument-hint: "[краткая подсказка для /skill-name …]"
user-invocable: true           # false для справочных (layout, meta)
allowed-tools: Read, Glob, Grep, Write, …  # минимальный набор
# опционально:
# disable-model-invocation: true
# model: sonnet
---
```

В теле (хвост файла, если процедурный скилл):

- **Итог (Verdict)** — явные слова PASS / FAIL / CONCERNS / COMPLETE / APPROVED
- **Согласование** — перед записью в репо спросить (если в `allowed-tools` есть Write)
- **Следующий шаг** — ссылка на следующий скилл из [`docs/agents/CURSOR_SKILLS.md`](../../docs/agents/CURSOR_SKILLS.md)

Файл **без UTF-8 BOM** (иначе frontmatter не парсится).

Проверка: `node .cursor/skills/skill-test/_static-check.mjs` или `/skill-test static all`.

Каталог и behavioral specs: [`catalog.yaml`](../catalog.yaml) (`status: active | optional | archived`), [`specs/`](../specs/), шаблон [`templates/skill-test-spec.md`](../templates/skill-test-spec.md).

**archived** — в `SKILL.md` стоит `disable-model-invocation: true`; скилл только по явному вызову.

## Добавление нового скилла в репозиторий

1. Создать `.cursor/skills/<kebab-case-name>/`.
2. Добавить `SKILL.md` по контракту выше (`name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools` + блок Verdict при необходимости).
3. При необходимости: `disable-model-invocation: true`, чтобы скилл не подтягивался без явного запроса или релевантного контекста.
4. Длинные справочники вынести в соседние `.md` в той же папке (один уровень вложенности ссылок от `SKILL.md`).

## Связка с мета-скиллом

Скилл `using-agent-skills` описывает дерево выбора фазы работы и ссылки на остальные скиллы по **логическим именам** — после переноса пути на диске должны по-прежнему соответствовать этим именам.

---

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

По умолчанию только чтение и отчёт; правки в репозитории — только по явной просьбе пользователя.

## Следующий шаг

`using-agent-skills` и [`docs/agents/CURSOR_SKILLS.md`](../../docs/agents/CURSOR_SKILLS.md).

