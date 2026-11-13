# Разделение Codex-инструкций · 2026-11-12

Срез согласован владельцем в чате после обсуждения рекомендаций OpenAI.
Текущая карта — [CODEX-ARCHITECTURE](CODEX-ARCHITECTURE.md),
точка входа — [общий маршрут](CODEX-PROCESSES.md).

## Результат

| Область | Локальные навыки | Видимость репозиторных навыков по цепочке предков |
|---|---|---|
| Корень | 7 общих | 7 общих |
| GAME | 6 игровых | 7 общих + 6 игровых |
| PLAN | отдельные навыки не требуются текущим процессам | 7 общих |
| Shared | общие навыки из корня | 7 общих |

Общие: delivery, architecture-decision, codex-config-audit, api-contract-change,
db-migration, review-change, verify-change. Игровые: game-economy, balance-playtest,
event-authoring, event-audit, mqx-design, frontend-implementation.
Имена сохраняются, ресурсы навыков перенесены вместе с каталогами, ссылки пересчитаны.
Current destination pointers в migration manifest обновлены; исторические исходники
и source/dependency evidence не открывались и не переписывались.

Общие API/DB/delivery/review/verify инструкции выбирают продукт по поручению и путям.
Они не ведут обычную задачу PLAN к игровым файлам. GAME guidance/admin/release/TMA/
marketing и игровые инварианты находятся в game/docs/engineering; профиль PLAN —
в plan/docs/engineering. Общий процесс стал коротким маршрутом к одному профилю.
Длительная задача поддерживает существующий план с progress, решениями, проверками
и открытыми вопросами; новые параллельные PLANS/GOALS/PROMPTS не введены.

Checker обнаруживает навыки в разрешённых областях без фиксированного числа в корне,
проверяет имена, ссылки, отсутствие дубликатов в одной цепочке и актуальные targets.
Дополнительный обычный config.toml допустим; конкурирующие hooks.json и inline hooks
в одном слое отклоняются. Это детектор конкурирующих представлений, не полный TOML parser.
Корневые и продуктовые AI workflows учитывают вложенные навыки и их ресурсы.
Skill/AGENTS-only изменения не активируют продуктовые suites только из-за вложенного пути.
То же относится к Codex adapters/config и инженерным AI-профилям: они покрыты
AI workflows. Изменение application code, финансового ядра, YAML-контента или самого
общего CI не исключается из продуктовых проверок.
Общие SPEC_FEATURE/PLAN_FEATURE/TASK_SLICE шаблоны выбирают продукт и его реальные
пути; игровые defaults и снятые имена навыков удалены. План содержит progress,
decisions, verification evidence и recovery вместо параллельных реестров.

## Проверка

До переноса scopes.test.mjs дал exit 1: PLAN/корень получали игровые навыки,
а общие entrypoints не выбирали продукт. После переноса эти случаи прошли.
Базовые независимые от источников проверки сохранились: старый контур недоступен
в smoke, native trust или активная блокировка от этого не заявляются.

Все 13 SKILL.md прошли bundled quick_validate.py через корневой Python 3.13,
exit 0. Итоговые команды:

| cwd | Команда | Exit | Результат |
|---|---|---:|---|
| root | node scripts/codex/check.mjs | 0 | 7 общих + 6 GAME, ссылки, targets, DDL |
| root | node --test scripts/codex/*.test.mjs | 0 | 24/24, включая scope, links, config и CI routing; финальный прогон вне Windows sandbox |
| root | .venv/Scripts/python.exe -X utf8 scripts/check_conventions.py | 0 | 6 принципов |
| root | node scripts/check-product-roots.mjs | 0 | Продуктовые корни и навигация |
| root | bundled quick_validate.py для каждого каталога навыка | 0 | 13/13 валидны |
| root | YAML parse ci.yml / codex-check.yml / skills-check.yml | 0 | Синтаксис трёх изменённых workflows |
| root | git diff --check по затронутому AI/docs/CI-срезу | 0 | Без новых whitespace errors |

Дополнительные fixtures подтверждают отсутствие фиксированного общего числа навыков,
учёт допустимых linked skills и отказ до чтения ссылки вне текущих roots навыков.
Обычные model/feature настройки не считаются вторым представлением hooks;
quoted/dotted hook tables и inline root hooks обнаруживаются.

Один промежуточный прогон имел 3 failure: два из-за ещё не созданной ссылки на этот
отчёт и один из-за Windows sandbox EPERM при создании синтетического junction.
Тест не ослаблялся и не пропускался; повтор вне sandbox использует только temp.
Никакие junction не создаются в проекте или реальных каталогах навыков.

## Пределы и сохранность

Проверка видимости — исполняемая модель документированного поиска по предкам,
не live benchmark выбора навыка моделью. Клиент сообщил обновление метаданных
шести общих навыков; полный новый каталог GAME/PLAN следует сверять в новой сессии
по [памятке](CODEX-RECOMMENDATIONS.md). Глобальные и bundled skills не входят в числа выше.
Проектные ссылки на навыки вне текущих каталогов skills требуют отдельного review;
они не игнорируются как будто такого источника нет.

Новые hooks/agents/model settings, trust, permissions или аккаунты не вводились.
Имеющиеся три custom-agent карточки остаются игровыми и не требуют запуска на каждой задаче.
Product suites, build, Playwright и баланс для этого AI/docs-среза не запускались:
продуктовый код, экономика и UI не менялись. Имеющиеся незавершённые изменения
сохранены; commit, staging и публикация не выполнялись. Состояние и исходные хеши
навыков — локально в .codex-state/skill-scopes.

## Основания

- [AGENTS discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md): общий слой и локальные инструкции.
- [Skills](https://learn.chatgpt.com/docs/build-skills): поиск по предкам, точные descriptions и progressive disclosure.
- [Configuration](https://learn.chatgpt.com/docs/config-file/config-basic) и [hooks](https://learn.chatgpt.com/docs/hooks): конфигурация по необходимости, без дублирования хуков и без обхода trust.
- [Workflow cookbook](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex): необязательные файлы процесса адаптируются к существующему репозиторию.

Это реализация согласованного среза и self-check; отдельное независимое review
или человеческое утверждение дизайна не заявляются.
