# Codex · ТВОЙ ХОД / ТВОЙ ПЛАН

ТВОЙ ХОД — игра финансовой грамотности: PWA/web primary, Telegram secondary.
ТВОЙ ПЛАН — отдельный прототип в `apps/plan-*`, без продуктивной БД,
деплоя и реальных пользовательских данных. Не возвращать `save_kind=plan`.

## Решения и границы

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
- Контент событий — `data/events/mvp11/`, не SQL. Baseline SQL — DDL-only.
- Новый layout/карточка/CTA/sheet: lab → явное утверждение человека → MQX → prod.
  Опечатка, a11y-label, мелкий токен без смены layout допускают hotfix по
  [DESIGN_WORKFLOW](frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).
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
| зарплата, порог, period/victory/needs | game-economy | verify-change, balance-playtest при существенном изменении |
| новый YAML event / аудит каталога | event-authoring / event-audit | экономика только при смене движка |
| API-поле | api-contract-change | backend + frontend контракт и критичный сценарий |
| схема/SQL/seeds | db-migration | схема ≠ контент событий |
| новый UI / утверждённый UI | mqx-design / frontend-implementation | lab, состояния, canon; затем review |
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
`node --test scripts/codex/*.test.mjs`. Для продукта по области:
backend `python -m pytest -q` (включает fincore); frontend
`npm run test:unit`, `npm run build`, `npm run check:guardrails`;
`python scripts/check_conventions.py`; Playwright при критичном UI-пути;
30–40 периодов и осмысленный baseline diff при существенной экономике.

Готово = полный согласованный срез, проверенные контракты и ссылки, результаты
команд с exit code, оставшиеся риски названы. Не называй runtime-гейт активным
без наблюдаемой блокировки. При compaction сохраняй scope, решения, исходные
изменения, diff, результаты и незакрытые approval.

## Review guidelines

Отмечай только воспроизводимые регрессии с файлом, сценарием и последствием.
Экономика: без зелёного backend pytest для логики/данных — NEEDS REVISION.
UI: крупное изменение требует lab + prod + подтверждённого approval и canon
в одном срезе; небольшое допускает явно названный canon follow-up.
Формула и желательность баланса — разные вопросы. Не исправляй diff в review
без отдельного поручения; указывай PASS / CONCERNS / NEEDS REVISION и пробелы.
