# Codex · ТВОЙ ХОД / ТВОЙ ПЛАН

Codex — основной рабочий контур. Итог перехода и ограничения активации:
[CODEX-TRANSITION](docs/ai/CODEX-TRANSITION.md). Claude-файлы — история миграции,
не параллельный источник действующих инструкций.

Два продукта в одном репозитории (ADR-016), с отдельными рабочими контекстами:

| Продукт | Frontend / cwd | API | Документация |
|---|---|---|---|
| ТВОЙ ХОД | [frontend-react](frontend-react/AGENTS.md) | [backend](backend/AGENTS.md) | [Game](docs/game/README.md) |
| ТВОЙ ПЛАН | [apps/plan-web](apps/plan-web/AGENTS.md) | [apps/plan-api](apps/plan-api/AGENTS.md) | [Plan](docs/plan/README.md) |

Перед работой выбери продукт и прочитай его локальный AGENTS и затронутую spec.
Из корневого cwd вложенные инструкции не считать автоматически загруженными.
Не загружай второй продукт без задачи на общий контракт. Не возвращать `save_kind=plan`.
Plan P2 разрешён по ADR-017; реальные пользователи и деплой не входят в обычную
локальную разработку. Настройка проектов — [WORKSPACES](docs/ai/WORKSPACES.md).

## Решения и границы

Структура и архив: [PROJECT_STRUCTURE](docs/PROJECT_STRUCTURE.md).
Для обычной задачи не обходи `docs/archive/`, `design/archive/` и исторический
Claude-контур; обращайся к конкретному файлу только при проверке истории.

Прочитай [CONVENTIONS.md](CONVENTIONS.md) для вердикта; источники поведения:
код + тесты → spec фичи → foundation → idea. Backlog задаёт приоритет,
аудит — снимок, не решение. При предметном конфликте назови его до правки;
не пересматривай принцип молча. Уже согласованное поручение разрешает локальные
правки в его границах; уточняй только блокирующую неоднозначность.

- [ADR-012](docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md),
  [ADR-013](docs/decisions/ADR-013-game-only-drop-plan-mode.md),
  [ADR-016](docs/decisions/ADR-016-two-products-shared-fincore.md) и
  [split plan](docs/plans/PLAN_game-plan-split.md) определяют границы продуктов.
- `packages/fincore` — stdlib/Decimal/DTO и чистые финансовые функции; без IO,
  ORM, HTTP, needs, events, victory и ходов. Адаптеры живут в приложениях.
- Baseline SQL — DDL-only. Продуктовые правила и дизайн-процесс — в локальных
  инструкциях: [Game](docs/game/DESIGN.md), [Plan](docs/plan/DESIGN.md).
- Не редактируй вручную `design-lab/index.html` и `design-lab/**/lab-base.css`.
  Источники и генераторы: [hooks runbook](docs/ai/CODEX-HOOKS.md).
- Сохраняй существующие изменения пользователя. Claude-контур (`CLAUDE.md`,
  `.claude/**`, вложенные `.claude`, `.cursor/**`, Git-хуки) не изменять в рамках
  Codex-настройки. Не запускай скрипты, пишущие туда состояние/отчёт.
- Не читай env, credentials, токены, приватные ключи или реальные анкеты.
  Не выдавай роль, review агента или зелёный тест за человеческое утверждение.

## Маршруты

Один primary-процесс; добавляй только затронутые проверки. Явный вызов —
`$delivery`, `$game-economy` и т. д.; обычный запрос тоже выбирает навык по description.

| Задача | Primary | Дополнение по риску |
|---|---|---|
| idea / spec / plan / обычный баг / docs | delivery | различай стадии и approval, не заводи spec для опечатки |
| игровая экономика / YAML events | game-economy / event-authoring / event-audit | только Game, проверки по риску |
| API-поле | api-contract-change | backend + frontend контракт и критичный сценарий |
| схема/SQL/seeds | db-migration | схема ≠ контент событий |
| UI Game / UI Plan | mqx-design + frontend-implementation / delivery | собственные lab, состояния и canon продукта |
| guidance / admin | delivery | отдельные [процессы](docs/ai/CODEX-PROCESSES.md) |
| проверка / review | verify-change / review-change | независимые проходы по области |
| ADR / AI-конфигурация | architecture-decision / codex-config-audit | не второй продуктовый backlog |
| релиз, TMA shell, снятие API, пост | delivery | только явно выбранный deferred-процесс |

[Роли и архитектура](docs/ai/CODEX-ARCHITECTURE.md) — явная справка, не автоматически
загружаемый конфиг. `economy-reviewer` проверяет инварианты и pytest;
`economy-balance-runner` — симуляцию и baseline; `mqx-ui-reviewer` — lab/prod/canon.
Не запускай всех для мелкой правки. Делегирование — только когда разрешено
текущими правилами клиента и нужно для изоляции; инструкция «read-only» сама
по себе не ограничивает инструменты технически.

## Проверка и готовность

Команды, cwd, Windows и зависимости — [COMMANDS.md](docs/ai/COMMANDS.md).
Минимум для AI-слоя: `node scripts/codex/check.mjs` и
`node --test scripts/codex/*.test.mjs`. Для продукта — проверки из его локального
AGENTS; `python scripts/check_conventions.py` по области. Общий UI-контракт —
`node --test tests/shared-ui/*.test.mjs`, отдельно от unit-тестов приложений.
Playwright при критичном UI-пути; 30–40 периодов при существенной экономике Game.

Готово = полный согласованный срез, проверенные контракты и ссылки, результаты
команд с exit code, оставшиеся риски названы. Не называй runtime-гейт активным
без наблюдаемой блокировки. При compaction сохраняй scope, решения, исходные
изменения, diff, результаты и незакрытые approval.

## Review guidelines

Отмечай только воспроизводимые регрессии с файлом, сценарием и последствием.
Экономика: без зелёного backend pytest для логики/данных — NEEDS REVISION.
UI продукта: крупное изменение требует lab + prod + подтверждённого approval и canon
в одном срезе; небольшое допускает явно названный canon follow-up.
Формула и желательность баланса — разные вопросы. Не исправляй diff в review
без отдельного поручения; указывай PASS / CONCERNS / NEEDS REVISION и пробелы.
