---
name: project-cursor-skills-layout
description: >-
  Explains where project Agent Skills live in this repository and how to add or
  relocate them. Use when configuring Cursor for the repo, moving skills between
  `.cursor/rules` and `.cursor/skills`, onboarding contributors, or troubleshooting
  missing project skills.
disable-model-invocation: true
---

# Расположение Agent Skills в этом проекте

## Разница между Rules и Skills

| Механизм | Путь | Формат | Назначение |
|----------|------|--------|------------|
| **Cursor Rules** | `.cursor/rules/*.mdc` | YAML + markdown, поля `description`, `globs`, `alwaysApply` | Постоянный или контекстный контекст по маске файлов |
| **Agent Skills** | `.cursor/skills/<имя-скилла>/SKILL.md` | YAML `name` + `description` + тело | Процедуры и доменные знания, подключаются по смыслу или явно |

Проектные скиллы и приоритеты — [`docs/agents/CURSOR_SKILLS.md`](docs/agents/CURSOR_SKILLS.md). Дублировать доменные процедуры в `~/.cursor/skills-cursor/` не нужно.

## Где лежат скиллы Money Quest

Все проектные скиллы — в каталоге:

```text
.cursor/skills/
  <skill-name>/
    SKILL.md
    … (опционально examples.md, scripts/, и т.д.)
```

Имя папки обычно совпадает с полем `name` в frontmatter `SKILL.md`.

## Если скиллы оказались в `.cursor/rules/`

Перенос: каждую подпапку с `SKILL.md` переместить в `.cursor/skills/`, сохранив имя папки и относительные файлы (например `idea-refine/scripts/`).

В `.cursor/rules/` оставляют только **правила** в формате `.mdc` (см. официальную документацию Cursor по Rules).

## Добавление нового скилла в репозиторий

1. Создать `.cursor/skills/<kebab-case-name>/`.
2. Добавить `SKILL.md` с frontmatter: `name`, `description` (до 1024 символов, третье лицо, **что** делает и **когда** применять).
3. При необходимости: `disable-model-invocation: true`, чтобы скилл не подтягивался без явного запроса или релевантного контекста.
4. Длинные справочники вынести в соседние `.md` в той же папке (один уровень вложенности ссылок от `SKILL.md`).

## Связка с мета-скиллом

Скилл `using-agent-skills` описывает дерево выбора фазы работы и ссылки на остальные скиллы по **логическим именам** — после переноса пути на диске должны по-прежнему соответствовать этим именам.
