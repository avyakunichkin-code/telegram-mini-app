# Процессы по задаче

Общие границы — [AGENTS](../../AGENTS.md). Это явная справка навыка delivery, не автозагрузка всех процессов.

## Idea / spec / plan / implementation

Idea: проблема, аудитория, assumptions, MVP/out, открытые вопросы → docs/vision/ideas по IDEA_ONEPAGER. DRAFT; направление подтверждает человек. Spec: approved idea или обоснованный небольшой фикс → SPEC_FEATURE, контракт, CS happy/boundary/error/invariant, AC и traceability; DoR и approval до новой продуктовой реализации. Plan: approved spec → PLAN_FEATURE, вертикальные TASK_SLICE с зависимостями, файлами, verify и откатом. Implementation: только согласованный срез; проверка области, self-review и документирование поведения. Не создавать четыре обязательных артефакта для опечатки/понятного бага. Использовать существующие docs/templates, docs/TRACEABILITY и продуктовый backlog.

Handbook: код/spec → narrative для людей в docs/handbook. Не превращать описание старого Plan Mode в обязательство. ADR фиксирует почему; spec — что, plan — как. Иерархия и канон в docs/DOCUMENTATION_SYSTEM.md.

## Guidance / onboarding

Триггер: O3 beat/trigger/gate/nudge/strip или /api/game/guidance. Вход: SPEC_onboarding-o3, backend/app/guidance/{engine,curriculum,triggers}.py, frontend-react/src/guidance/curriculum.js. Запись: эти области, spec и тесты; strip/layout требует MQX gate, новые API-поля — contract process. Сверить id/порядок/gates и прогресс на User; onboarding_state/step на профиле не путать с guidance. Смена id требует плана миграции прогресса. GET может синхронизировать авто-гейты, но не завершать onboarding/слать completion alert; завершение — PATCH. При выборе события guidance hook внутри savepoint до commit (choose.py), не копировать stale «после commit». Проверки: backend pytest -k 'guidance or onboarding', tests/test_guidance_hooks.py, FE npm run test:guidance и затронутый critical path. Выход: синхронные BE/FE, тесты и перечень изменений → QA; UI approval остаётся у человека.

## Admin / ops

Триггер: каталоги, Watchtower, фильтр/колонка/воронка/CSV/alert. Чтение: backend/app/admin/auth.py, catalogs.py, routers/admin.py, notify.py; PLAN_admin-analytics-ops и ADR-008; конкретные CSV/funnel/FE модули только по задаче. Запись: app/admin, router, components/admin, api/admin и тесты. Каждый endpoint требует require_admin_user и 403-тест; FE-маршрут не auth. YAML events read-only, контент менять YAML. CSV через csv_safe_cell/stream_csv. Alert payload без секретов/PII; dedupe; реальную отправку не тестировать. Использовать admin_env/monkeypatch, не глобальное config.X присваивание. Тяжёлый stuck scan — BackgroundTasks с собственной сессией, не синхронный GET. Verify: pytest -k admin, YAML-readonly и ops-hardening tests, FE tests/build по области. Выход: контракт/auth/экспорт/alert test evidence → QA/release. Это инженерный процесс, не разрешение отправить Telegram-сообщение.

## Plan prototype

Компактный профиль: один координатор/инженер + scoped QA. apps/plan-api и apps/plan-web, docs/plan; fincore shared architect только при изменении ядра. Нет команды production, БД, деплоя, реальных анкет/пользователей, отправки кодов. Использовать синтетические DTO; не читать анкеты в ходе AI-аудита. Аддитивное ядро: golden + game balance diff = 0. Продуктовый профиль только после условий ADR-016/роадмапа направления; этот документ не открывает gate.

## Deferred — только по явной задаче

- Release: docs/ops/DEPLOY, ADR-012, PWA_INSTALL, manifests/CI. Сначала readiness: backend при diff, FE unit/build/guardrails, design-lab parity при UI, W1–W5 web/PWA (login, core loop, refresh/resume, desktop/mobile, install). TMA smoke только при shell diff. Локальный отчёт не авторизует deploy/migrate production.
- TMA: SPEC_APP_SHELL, SDK/initData/theme/viewport и соответствующий FE-код. Реальный WebView smoke отдельно от браузера; initData/токены не логировать.
- Deprecation: usages и данные → совместимость/миграция/откат → удаление после явного решения. Не возвращать мёртвый Plan/legacy close; риск данных направить в db-migration.
- Marketing: docs/marketing/README, POST_STYLE, CHANGELOG_TRACKER и git facts. Только drafts по явному запросу. Не менять продукт/CI и не ставить «опубликовано» за человека. Публикация отдельно авторизуется.

Эти процессы вызываются «$delivery: release readiness»/«guidance ...» обычным текстом. Не переносить Claude slash built-ins или $ARGUMENTS; параметры — текст поручения.
