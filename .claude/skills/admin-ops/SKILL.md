---
name: admin-ops
description: >-
  Admin panel and ops tooling for ТВОЙ ХОД — /api/admin (require_admin_user,
  ADMIN_USER_IDS), Watchtower, catalog registry (liabilities/assets/starters/events,
  YAML events read-only), funnels and metrics, stuck scan, CSV export, profile
  inspector, and Telegram ops alerts via emit_admin_alert / notification_log. Use when
  adding an admin catalog, column, filter, metric, export or alert kind, or changing
  backend/app/admin, routers/admin.py or components/admin on the frontend.
argument-hint: "[catalog | column | alert | funnel | export | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(python -m pytest *), Bash(py -3 -m pytest *)
paths:
  - "backend/app/admin/**"
  - "backend/app/routers/admin.py"
  - "frontend-react/src/components/admin/**"
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.


# Admin & Ops (Watchtower)

## Прочитай сначала (ТВОЙ ХОД)

- [`backend/app/admin/auth.py`](../../../backend/app/admin/auth.py) — `require_admin_user`, `is_admin_user`, allowlist `config.ADMIN_USER_IDS`
- [`backend/app/routers/admin.py`](../../../backend/app/routers/admin.py) — все `/api/admin/*` + Pydantic-схемы ответа (в самом роутере, не в `schemas.py`)
- [`backend/app/admin/catalogs.py`](../../../backend/app/admin/catalogs.py) — реестр `CATALOGS` (`CatalogSpec`, колонки, serialize)
- [`backend/app/admin/notify.py`](../../../backend/app/admin/notify.py) — `emit_admin_alert`, `notify_*`, Telegram ops
- [`docs/decisions/ADR-008-events-catalog-single-source.md`](../../../docs/decisions/ADR-008-events-catalog-single-source.md) — события из YAML в админке read-only
- [`docs/plans/PLAN_admin-analytics-ops.md`](../../../docs/plans/PLAN_admin-analytics-ops.md) — срезы A0–A4, пороги, принцип «метрика → emit → лог → строка → Telegram»

**Satellites:** `test-driven-development`, `api-and-interface-design` (новый эндпоинт/схема), `db-baselines-and-migrations` (новая таблица/колонка), `guidance-onboarding` (воронка онбординга).
**Дальше:** `test-driven-development`, `api-and-interface-design`, `code-review-and-quality` (`catalog.yaml` → `next_skill`).

## Читай при условии (`catalog.yaml` → `read_if`)

| Когда | Файлы |
|-------|--------|
| новый справочник / поле справочника | [`catalog_patch.py`](../../../backend/app/admin/catalog_patch.py), [`catalog_write.py`](../../../backend/app/admin/catalog_write.py), [`catalog_create_payload.py`](../../../backend/app/admin/catalog_create_payload.py), [`catalog_detail.py`](../../../backend/app/admin/catalog_detail.py), [`catalog_validate.py`](../../../backend/app/admin/catalog_validate.py), [`catalogCreateConfig.js`](../../../frontend-react/src/components/admin/catalogCreateConfig.js) |
| новый тип алерта / Telegram ops | [`notify_messages.py`](../../../backend/app/admin/notify_messages.py), [`backend/.env.example`](../../../backend/.env.example) |
| колонка / фильтр Watchtower | [`watchtower_profiles.py`](../../../backend/app/admin/watchtower_profiles.py), [`adminPlayerColumns.jsx`](../../../frontend-react/src/components/admin/adminPlayerColumns.jsx), [`frontend-react/src/api/admin.js`](../../../frontend-react/src/api/admin.js) |
| воронки и метрики | [`product_funnel.py`](../../../backend/app/admin/product_funnel.py), [`metrics_summary.py`](../../../backend/app/admin/metrics_summary.py), [`onboarding_funnel.py`](../../../backend/app/admin/onboarding_funnel.py) |
| «застрял» / stuck-алерты | [`stuck_scan.py`](../../../backend/app/admin/stuck_scan.py) |
| CSV / профиль игрока | [`csv_export.py`](../../../backend/app/admin/csv_export.py), [`profile_inspector.py`](../../../backend/app/admin/profile_inspector.py) |
| эволюция реестра справочников | [`docs/vision/ideas/admin-catalog-registry.md`](../../../docs/vision/ideas/admin-catalog-registry.md) |

## Карта

| Слой | Где |
|------|-----|
| Доступ | `Depends(require_admin_user)` **в каждом** эндпоинте (`APIRouter(prefix="/api/admin")` без общей зависимости); 403 «Admin access required»; пустой `ADMIN_USER_IDS` → админов нет |
| Справочники | `GET /catalogs`, `GET/POST /catalogs/{key}/rows`, `POST …/{id}/clone`, `GET/PATCH …/{id}`, варианты событий `…/events/rows/{id}/choices` |
| Обзор | `GET /watchtower` (users, profiles, `onboarding_funnel`, `metrics_summary`, `product_funnel`, notifications, run_feedback), `/users`, `/profiles`, `/profiles/{id}` (inspector), `/metrics/summary` |
| Экспорт | `GET /export/profiles.csv`, `/export/run-feedback.csv` (`StreamingResponse`; FE — `downloadAdminCsv` в `api/admin.js`) |
| Алерты | `emit_admin_alert` → `NotificationLog(audience="admin")` (+ Telegram, если заданы `OPS_TELEGRAM_BOT_TOKEN` и `OPS_TELEGRAM_CHAT_ID`; тема — `OPS_TELEGRAM_MESSAGE_THREAD_ID`); ссылка `_admin_link` из `ADMIN_WEB_BASE_URL` |
| FE | `frontend-react/src/components/admin/*`, маршрут `/admin/*` в `App.jsx` (`AdminWebShell` + `AuthGuard layout="admin"`); FE не проверяет роль — гейт только backend 403 |

Источники алертов: `routers/auth.py` (регистрация), `services/game/profiles.py` (профиль, onboarding step/skip/brief), `services/game/start.py`, `services/period/salary.py`, `services/period/safety_fund.py`, `services/events/choose.py`, `game/period.py` → `process_period_admin_alerts` (после commit периода), `guidance/engine.py` (`complete_guidance`), `telegram/player_webhook.py`, `stuck_scan.py`.

## Procedure

### Добавить справочник (catalog)

Ветка `if catalog_key == "<key>"` нужна в **пяти** модулях, иначе `KeyError` → 404 на create/patch/clone/detail:
1. `catalogs.py` — `CatalogSpec` в `CATALOGS` (`model`, `search_attrs`, `order_by`, `columns`, `serialize`).
2. `catalog_detail.py` — полная строка для редактора.
3. `catalog_patch.py` — whitelist полей + валидация JSON через `catalog_validate.py`; конфликт ключа → `errors[field]` (роутер вернёт 422).
4. `catalog_write.py` — `create_catalog_row` (черновик `is_active=0`, `_draft_key`) и `clone_catalog_row`.
5. `catalog_create_payload.py` — создание из формы.
FE: поля формы в `CATALOG_CREATE_FIELDS` (`catalogCreateConfig.js`); список/редактор берут колонки из `GET /catalogs`. Если справочник — игровые данные с seed-каноном, сначала реши, кто владелец (ADR-008-стиль read-only, как события).

### Добавить колонку / фильтр в Watchtower

Backend: `build_admin_profile_row` (+ `AdminProfileRow` в `routers/admin.py`), фильтр — `profile_rows_query` (`profile_filter`), CSV — `profiles_csv_rows` (header и строка синхронно). FE: `useAdminProfileColumns` / `PROFILE_FILTERS` в `adminPlayerColumns.jsx`.

### Добавить тип алерта

1. `notify_<kind>(db, …)` в `notify.py` → `emit_admin_alert(db, "<kind>", payload, user_id=…, game_profile_id=…, dedupe_key=f"<kind>:{profile.id}[:…]")`.
2. Эмодзи `_KIND_EMOJI` (`notify.py`), подпись `_KIND_LABEL_RU` и ветка `format_alert_message_ru` (`notify_messages.py`).
3. Вызов — после бизнес-commit, в `try/except` с `logger.warning`: алерт не должен ронять игровой запрос. Шумные события — `send_telegram=False` (как `event_chosen`).
4. Тест в `test_admin_notify_messages.py` (текст) и на dedupe (повтор → `None`, одна строка `NotificationLog`).

### Verify

```bash
cd backend && python -m pytest -q -k admin
cd backend && python -m pytest -q tests/test_admin_yaml_events_readonly.py tests/test_admin_watchtower.py tests/test_admin_catalog_c2.py
```

Фикстуры (`backend/tests/conftest.py`): `admin_env` — делает `test_user` админом и обнуляет `OPS_TELEGRAM_*` (Telegram в тестах не уходит) через `monkeypatch.setattr` — после теста config откатывается; `auth_headers` — JWT того же юзера. Обязательный негатив: без `admin_env` (или `monkeypatch.setattr(config, "ADMIN_USER_IDS", set())`) эндпоинт → 403. Прямое присваивание `config.X = …` в тестах не используй — утечёт в следующие тесты. На Windows — `py -3 -m pytest …`.

## Инварианты

- **Только админ:** каждый новый эндпоинт — `_admin: User = Depends(require_admin_user)`; тест на 403. Не полагаться на FE-маршрут.
- **YAML-события read-only (ADR-008):** `is_yaml_catalog_event_key` → PATCH строки даёт 422 с `YAML_EVENT_READONLY_DETAIL`, правки вариантов — 409 (`_require_editable_event`). Путь правки — YAML + `db.sh events-sync` или clone.
- **Без секретов в алертах:** payload и `format_alert_message_ru` — без токенов, паролей, email, `initData`; токен бота живёт только в URL запроса `_send_telegram_message`. Новые поля payload видны и в Watchtower, и в Telegram.
- **`dedupe_key`** для всего, что не должно повторяться (уникальный индекс `notification_log.dedupe_key`); формат `<kind>:<profile_id>[:<period|step>]`.
- `emit_admin_alert` сам решает commit: при чужих pending-изменениях — `begin_nested` + flush без commit. Не коммить вокруг него вручную «на всякий случай». Порядок: **сначала строка `NotificationLog`** (dedupe), потом Telegram и `telegram_sent=1`; на гонке dedupe (`IntegrityError`) — rollback и `None` без отправки.
- **Stuck-скан не в запросе:** `GET /watchtower` только ставит `run_stuck_scan_in_background(profile_ids)` в `BackgroundTasks` (своя сессия `SessionLocal`); новые тяжёлые побочки GET — туда же, не синхронно.
- `catalog_patch`: числа — через `set_number` (`_coerce_number`): мусор / bool / NaN → ошибка поля → 422, не 500.
- CSV-экспорт: каждая ячейка через `csv_safe_cell` в `_csv_stream` (строки с `=`, `+`, `-`, `@`, tab, CR → префикс `'`); новый экспорт — только через `stream_csv`.
- `save_kind` — только `game` (ADR-013): фильтры admin (`watchtower`, `metrics/summary`, `product_funnel`, `watchtower_profiles`) на `plan` → 400 / игнор; не добавлять новые ветки под `plan`.

## Ловушки (найдено в коде)

- Stuck-алерты — только для профилей, видимых в текущей выдаче Watchtower (cron нет; скан — фоном после ответа GET); `dedupe_key=player_stuck:{id}` вечный — повторно не алертит; `hours_idle` в payload — порог, а не факт; `onboarding_stuck` и `player_stuck` могут сработать на один профиль.
- Фильтр `stuck` берёт `limit*5` (≤ 500) свежих профилей и фильтрует в Python — выдача неполная.
- `emit_admin_alert` при чужих pending-изменениях: строка лога и `telegram_sent=1` уходят в транзакцию вызывающего — если тот потом откатится, сообщение в Telegram уже отправлено.
- `catalog_patch`: поле `mode` событий не валидируется (числа — валидируются, см. инварианты).
- Create при занятом ключе молча добавляет суффикс `_2` (`_ensure_unique_key`), а PATCH на тот же конфликт даёт ошибку.
- `build_onboarding_funnel` грузит **всех** `User` в память на каждом `GET /watchtower`; считает только spine-биты (`guidance_mode: "o2"`).

## Итог (Verdict)

Завершай **PASS** / **CONCERNS** / **FAIL**: `pytest -k admin` зелёный (регрессии ops — `tests/test_admin_ops_hardening.py`), есть тест на 403 для нового эндпоинта, YAML-события не редактируются, алерт с `dedupe_key` и без секретов.

## Согласование изменений

Перед новым эндпоинтом, справочником или типом алерта (он уйдёт в живой ops-чат): **Могу записать эти изменения?** Смену `ADMIN_USER_IDS` / `OPS_TELEGRAM_*` в окружении делает пользователь, не агент.

## Следующий шаг

- [`test-driven-development`](../test-driven-development/SKILL.md) — тест на 403 / dedupe / 422
- [`api-and-interface-design`](../api-and-interface-design/SKILL.md) — новая схема ответа + `src/api/admin.js`
- [`code-review-and-quality`](../code-review-and-quality/SKILL.md) — перед merge
