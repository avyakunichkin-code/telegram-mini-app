# Процессы GAME

[Правила продукта](../../AGENTS.md) · [Общий маршрут](../../../docs/engineering/CODEX-PROCESSES.md).
Пути к коду ниже — от Git root. Специализированные навыки находятся в game/.agents/skills.
Из корневого чата открой нужный SKILL.md по пути, если он не обнаружен автоматически;
обычная задача PLAN эти навыки и этот профиль не загружает.

## Доставка и проверки

Документы — game/docs: vision/ideas, specs, plans, backlog. Текущие задачи и
приоритеты остаются в существующем backlog/roadmap. API: app/routers, schemas,
services и models; web: src/api и существующие hooks/screens. Ошибки и auth
сверять с кодом. Новое UI — mqx-design, утверждённое — frontend-implementation.
Экономика/контент — локальные навыки и [инварианты](CODEX-INVARIANTS.md).

DB: game/api/migrations/README.md, scripts/db.sh и модели. Baseline DDL-only,
events — YAML; PostgreSQL startup не делает DDL, SQLite test path не заменяет PG.
Natural-key FK требует UNIQUE; таблица без ORM тоже требует DDL/seed. Backfill
проверяется на повтор. Archive и baseline не объединяются произвольно.

Проверки из game/api: pytest (включает fincore); из game/web: unit/build/guardrails;
критичный UI — Playwright. Существенная экономика — 30–40 периодов и baseline diff.
[Роли и независимые проходы](CODEX-ROLES.md) применяются по риску и разрешению клиента.

## Guidance / onboarding

Триггер: O3 beat/trigger/gate/nudge/strip или /api/game/guidance. Вход: SPEC_onboarding-o3, game/api/app/guidance/{engine,curriculum,triggers}.py, game/web/src/guidance/curriculum.js. Запись: эти области, spec и тесты; strip/layout требует MQX gate, новые API-поля — contract process. Сверить id/порядок/gates и прогресс на User; onboarding_state/step на профиле не путать с guidance. Смена id требует плана миграции прогресса. GET может синхронизировать авто-гейты, но не завершать onboarding/слать completion alert; завершение — PATCH. При выборе события guidance hook внутри savepoint до commit (choose.py), не копировать stale «после commit». Проверки: backend pytest -k 'guidance or onboarding', tests/test_guidance_hooks.py, FE npm run test:guidance и затронутый critical path. Выход: синхронные BE/FE, тесты и перечень изменений → QA; UI approval остаётся у человека.

## Admin / ops

Триггер: каталоги, Watchtower, фильтр/колонка/воронка/CSV/alert. Чтение: game/api/app/admin/auth.py, catalogs.py, routers/admin.py, notify.py; PLAN_admin-analytics-ops и ADR-008; конкретные CSV/funnel/FE модули только по задаче. Запись: app/admin, router, components/admin, api/admin и тесты. Каждый endpoint требует require_admin_user и 403-тест; FE-маршрут не auth. YAML events read-only, контент менять YAML. CSV через csv_safe_cell/stream_csv. Alert payload без секретов/PII; dedupe; реальную отправку не тестировать. Использовать admin_env/monkeypatch, не глобальное config.X присваивание. Тяжёлый stuck scan — BackgroundTasks с собственной сессией, не синхронный GET. Verify: pytest -k admin, YAML-readonly и ops-hardening tests, FE tests/build по области. Выход: контракт/auth/экспорт/alert test evidence → QA/release. Это инженерный процесс, не разрешение отправить Telegram-сообщение.

## Deferred — только по явной задаче

- Release: game/docs/ops/DEPLOY, ADR-012, PWA_INSTALL, manifests/CI. Сначала readiness: backend при diff, FE unit/build/guardrails, design-lab parity при UI, W1–W5 web/PWA (login, core loop, refresh/resume, desktop/mobile, install). TMA smoke только при shell diff. Локальный отчёт не авторизует deploy/migrate production.
- TMA: SPEC_APP_SHELL, SDK/initData/theme/viewport и соответствующий FE-код. Реальный WebView smoke отдельно от браузера; initData/токены не логировать.
- Deprecation: usages и данные → совместимость/миграция/откат → удаление после явного решения. Не возвращать мёртвый Plan/legacy close; риск данных направить в db-migration.
- Marketing: game/docs/marketing/README, POST_STYLE, CHANGELOG_TRACKER и git facts. Только drafts по явному запросу. Не менять продукт/CI и не ставить «опубликовано» за человека. Публикация отдельно авторизуется.

Эти процессы вызываются «$delivery: release readiness»/«guidance ...» обычным текстом. Не переносить снятый контур slash built-ins или $ARGUMENTS; параметры — текст поручения.
