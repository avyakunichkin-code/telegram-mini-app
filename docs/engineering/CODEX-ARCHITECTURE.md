# Архитектура Codex-контура

Корневой [AGENTS](../../AGENTS.md) содержит общие границы. Продуктовые правила —
[GAME](../../game/AGENTS.md), [PLAN](../../plan/AGENTS.md), [Shared](../../shared/AGENTS.md).
Выбор процесса — [короткий общий маршрут](CODEX-PROCESSES.md), затем один профиль.

## Области навыков

- Корневые .agents/skills: delivery, architecture-decision, codex-config-audit,
  api-contract-change, db-migration, review-change, verify-change.
- game/.agents/skills: game-economy, balance-playtest, event-authoring, event-audit,
  mqx-design, frontend-implementation. Назначение — только GAME.
- PLAN использует общие навыки и свой процесс; пустые каталоги и дубли имён не создаются.

Codex обнаруживает skills по цепочке предков рабочего каталога до Git root.
Поэтому GAME получает общие и игровые навыки, PLAN — общие. Корневой чат не получает
локальные навыки потомков автоматически: при GAME-срезе прочитай нужный SKILL.md
по явному пути. Не создавай копию/ссылку в корне, возвращающую их в каталог PLAN.
Вложенные AGENTS не отменяют родительские общие границы и не являются sandbox.

## Роли и исполнение

Три имеющиеся карточки в [.codex/agents](../../.codex/agents) относятся к GAME:
economy-reviewer, economy-balance-runner, mqx-ui-reviewer. Их подробные обязанности —
[в GAME](../../game/docs/engineering/CODEX-ROLES.md). Наличие карточки не требует
делегирования: оно допустимо только по действующим клиентским правилам и по риску.
Обозначение read-only не создаёт технической изоляции. Роль не заменяет человека.

## Конфигурация и проверки

Хуки зарегистрированы только в .codex/hooks.json. Допустимый config.toml не запрещён;
checker отклоняет дублирование hooks.json и inline hooks в одном слое.
Никакие настройки модели, аккаунта, глобального trust или sandbox этим устройством
не навязываются. [HOOKS](CODEX-HOOKS.md) отделяет регистрацию, доверие и наблюдаемый runtime.
Состояние проверок — .codex-state, не в каталогах инструкций.

Checker валидирует навыки в корне и продуктовых областях, ссылки и DDL baseline.
Tests проверяют видимость по предкам и границы маршрутов; это модель documented
discovery, не live benchmark выбора навыка моделью. Runtime проверяется в новом
чате нужного проекта, без запуска внешних действий или чтения секретов.

Официальные источники: [AGENTS](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[skills](https://learn.chatgpt.com/docs/build-skills),
[config](https://learn.chatgpt.com/docs/config-file/config-basic),
[hooks](https://learn.chatgpt.com/docs/hooks). Проверено 2026-11-12.
Исторические manifests — provenance, исходники по ним не открываются.
