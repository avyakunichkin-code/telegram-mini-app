---
layer: audits
kind: engineering
status: draft
last_reviewed: 2026-09-07
audience: engineering, agents
doc_type: audit
verdict: DRAFT
supersedes: ../../vision/ARCHITECTURE_ASSESSMENT_2026-06.md
source: code review 2026-09-07 + ARCHITECTURE_ASSESSMENT_2026-06 + ADR-007
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/engineering
  - tvoy-hod/status/draft
aliases:
  - "Технический архитектурный аудит"
  - AUDIT_architecture_2026-09-07
---
# Архитектурный аудит: ТВОЙ ХОД

**Kind:** `engineering` · **Дата снимка:** 2026-09-07 · **Verdict:** DRAFT (не канон, не ADR).

Канон адреса: [`../README.md`](../README.md). Kind: [`README.md`](README.md). Шаблон: [`../../templates/AUDIT.md`](../../templates/AUDIT.md).

Продуктовый снимок того же дня: [`../product/2026-09-07-product-game-design.md`](../product/2026-09-07-product-game-design.md) — экономика игрока, retention, монетизация **не** здесь.

Наследник [`ARCHITECTURE_ASSESSMENT_2026-06.md`](../../vision/ARCHITECTURE_ASSESSMENT_2026-06.md): assessment **не удалять** (на него ссылаются backlog/handbook). Этот файл — актуальный технический снимок.

При конфликте: **код + тесты** → spec → `SPEC_PRODUCT.md` → vision. Аудит ниже vision.

Это **не** Unity/Unreal. Пошаговая экономика FastAPI + React PWA. FPS / draw calls / BT-GOAP к стеку не применимы; «AI» = picker событий, guidance FSM, Cursor skills.

---

## Сводка

- **Объект:** модульный монолит `backend/app/{game,finance,victory,events,…}` + React SPA (`frontend-react`), каналы PWA/web primary (ADR-012).
- **Инженерная зрелость: 5.5 / 10.** Домен и тесты экономики — Closed Alpha (7/10). Релизный контур, секреты, схема БД, наблюдаемость — прототип (3/10). Для 10–100 плейтестеров архитектура достаточна; **production-ready — нет**.
- **Находки:** 🔴 **7** · 🟡 **20** · 🟢 **10**. Закрыто в тот же день: **C7**, **M17** (см. ниже). Открытых Critical: **6**.
- **Главный технический риск:** можно смержить регрессию экономики и выкатить SPA: pytest/vitest не в PR CI, `POST /api/game/time/next` без row-lock и Idempotency-Key.
- **Топ-3:**
  1. Required CI: pytest + FE `test:unit` на PR; Pages deploy после зелёных тестов.
  2. Argon2 + fail-fast `SECRET_KEY`; lock + идемпотентность закрытия месяца.
  3. Один путь схемы БД (`db.sh migrate` до старта API).

### Что работает — ориентир для остального кода

| Система | Почему якорь |
|---------|----------------|
| Доменные пакеты ([ADR-007](../../decisions/ADR-007-backend-domain-packages.md)) | `game` / `finance` / `victory` / `events` / `needs`; тонкие роутеры |
| Server as source of truth | Период и победа не считаются на клиенте; bootstrap одним round-trip |
| `game/rules.py` | Чистые инварианты, dataclass-снимки, без HTTP |
| YAML событий ADR-008 | `data/events/mvp11/` (~60 `definition_key`) → seeds; `balance_contract.py` |
| Victory v2 | `victory/engine.py` + `victory_config_json` шаблона (chain / parallel) |
| Тесты экономики | **383** pytest collected; period close, victory modes, YAML contract, DL1 golden |
| Idempotency (частично) | Зарплата, подушка, invest, insurance — `Idempotency-Key`; **не** `/time/next` |
| Design-lab → MQX | `DESIGN_WORKFLOW.md`; leaf MQX почти не импортирует `useGame` |

---

## Источники и пробелы в данных

**Читали:** `backend/app/` (period, events/service, auth, config, idempotency, health, main ensure_schema), `frontend-react/src/` (App, GameScreen, useGame, api/client), `.github/workflows/`, `.cursor/hooks.json`, `catalog.yaml`, `backend/tests/README.md`, `migrations/README.md`, ADR-007, `ARCHITECTURE_ASSESSMENT_2026-06.md`, `SPEC_PRODUCT.md`.

**Нет (не выдумывать):**

- p95 `POST /time/next` и `GET /finance/overview` на Render.
- Crash-free / Sentry (телеметрии в коде нет).
- Фактические prod env (`SECRET_KEY` задан или нет).
- Автоматический backup restore (есть в backlog, в CI/cron репо не видно).
- Покрытие строк (coverage.xml). Браузерная проверка empty-state C7 в этой сессии не делалась.

---

## Стек и границы

```text
PWA / web / TMA (один SPA) ──HTTPS──► FastAPI
  api/*.js зеркало routers              routers → services → domain
                                        PostgreSQL
Контент: data/events/mvp11/*.yaml ──sync──► event_definitions
Схема: migrations/*.sql + create_all + ensure_schema_compatibility()  ← риск C4
```

Канон слоёв: [`backend/app/README.md`](../../../backend/app/README.md), [`frontend-react/ARCHITECTURE.md`](../../../frontend-react/ARCHITECTURE.md).

**Нарушение DIP (открыто):** `game/period.py` импортирует `services.events.service` (в т.ч. `_ensure_seed_events`) и `services.insurance.service`. Документированная схема routers → services → domain частично дырявая.

**Не дробить монолит.** Микросервисы / GraphQL / Kafka — YAGNI до закрытия P0 ops.

---

## Находки

Сортировка Critical → Major → Minor. Effort — ориентир 1 инженер. «Почему» = DX / Security / Reliability / Scale, не продуктовый retention.

### Закрыто 2026-09-07 (этот снимок)

| ID | Было | Как закрыто | Verify |
|----|------|-------------|--------|
| 🔴 **C7** | `GameScreen.jsx:344` — `<Button>` без import, краш ветки «Пустой ответ» | Тот же `MqxStateError`, что на ошибке загрузки | `npm run test:screens`; pytest не применим |
| 🟡 **M17** | `period.py` `except: pass` вокруг пула событий | `logger.exception("Period event pool failed after close …")`; месяц всё равно закрывается | `tests/unit/game/test_period_event_pool_failure.py` |

### Архитектура и структура

| ID | Ур. | Где | Почему | Решение / effort |
|----|-----|-----|--------|------------------|
| **C4** | 🔴 | `main.py` `ensure_schema_compatibility` + `create_all` + `migrations/` | Три пути DDL → drift staging/prod | Один канон: migrate job до старта API. **3–5 дн.** |
| **M1** | 🟡 | `game/period.py` → `services.events` | Domain зависит от HTTP-use-case | Порт `PeriodEventPort` в `app/events/`. **2–3 дн.** |
| **M2** | 🟡 | `events/service.py` ~865, `routers/admin.py` ~697, `period.py` ~584 | God-модули, SRP | Распил picker / apply / serialize; admin catalogs vs watchtower. **5–8 дн.** |
| **M3** | 🟡 | `models.py` ~423, `schemas.py` ~490 | Конфликты, нет bounded context | Пакеты `models/<domain>.py` + реэкспорт. **4–6 дн.** |
| **M4** | 🟡 | `GameScreen.jsx` ~473, `useGame.js` ~257; `screens/game/` пуст | ARCHITECTURE.md врёт о целевом дереве | Touch-it-move-it вкладок; хук session/period/events. **5–8 дн.** |
| **M5** | 🟡 | `App.jsx` — нет `React.lazy` | Admin + игра в first paint | Lazy admin и GameScreen. **1 дн.** |
| **M6** | 🟡 | `seeds/runner.py` на каждом startup | Гонка при N инстансах Render | Advisory lock / отдельный seed job. **1–2 дн.** |
| **M19** | 🟡 | `constants/insuranceProducts.js`; `GET /api/insurance/catalog` не вызывается | Дрейф премий FE/BE | Каталог только с API. **1 дн.** |
| **m1** | 🟢 | `App.jsx` HashRouter + внутренний `screen` FSM | Deep link расходится с FSM | Один источник — router. **2 дн.** |
| **m9** | 🟢 | `CapitalPortfolioPanels.jsx` ~230 строк, 0 импортов из `src/` | Мёртвый код | Удалить + поправить docs. **30 мин.** |

### Код и безопасность

| ID | Ур. | Где | Почему | Решение / effort |
|----|-----|-----|--------|------------------|
| **C2** | 🔴 | `auth.py` SHA-256+salt | Нет bcrypt/argon2 — оффлайн-брут дампа | Argon2id, rehash on login. **1 дн.** |
| **C3** | 🔴 | `config.py` `SECRET_KEY` default `default-secret-key-change-me` | Подделка JWT если env забыт | Fail-fast в prod. **2–4 ч.** |
| **C5** | 🔴 | `POST /time/next` без lock и Idempotency-Key | Двойной tap = двойной месяц | `SELECT FOR UPDATE` + ключ `profile+period+close`. **1–2 дн.** |
| **M9** | 🟡 | `period.py` `db.refresh` в циклах активов/долгов | N+1 на hot path | Один flush. **1 дн.** |
| **M10** | 🟡 | `routers/health.py` 200 при ошибке БД | Render считает инстанс живым | HTTP 503. **2 ч.** |
| **M11** | 🟡 | JWT 7 суток в `localStorage` | XSS = неделя сессии | Короткий access + refresh. **2–3 дн.** |
| **M12** | 🟡 | Нет rate limit `/login` `/register` | Брут с публичного Pages | SlowAPI / nginx. **0.5–1 дн.** |
| **M18** | 🟡 | Поражение `>= 3` в `period.py:448`; preview `>= 2` в `period_close_preview.py:89` | UI врёт на ход раньше факта; константы не в `rules.py` | Одна константа в `rules.py`. **0.5 дн.** |
| **M20** | 🟡 | `services/period/complete.py` — legacy `/complete-period` | Двигает `period_index` без `process_period_end` | 410 / удалить. **2 ч.** |
| **m2** | 🟢 | `useGame.js` дубль `refreshPeriodStatus` / `fetchPeriodStatus` | Мёртвый API хука | Одна функция. **1 ч.** |
| **m3** | 🟢 | `api/client.js` fallback Render URL | Ошибочный env → чужой API | Падать без `VITE_API_BASE_URL` в prod. **2 ч.** |
| **m4** | 🟢 | health `error: str(e)` | Утечка внутренностей | Лог серверно. **1 ч.** |
| **m10** | 🟢 | `PLAYER_TELEGRAM_WEBHOOK_SECRET` опционален | Пропуск проверки webhook | Require в prod. **1 ч.** |

### Правила, хуки, контент-конфиг

| ID | Ур. | Где | Почему | Решение / effort |
|----|-----|-----|--------|------------------|
| **M13** | 🟡 | `.cursor/hooks.json` after-edit | Напоминания, не gate | Pre-commit pytest subset. **1 дн.** |
| **M14** | 🟡 | YAML mvp11 **и** `admin/catalog_write.py` | Два SSOT событий | YAML канон **или** export в git. **2–3 дн.** |
| **M7** | 🟡 | `services/events/service.py` picker+effects+HTTPException | Нельзя гонять picker в sim без FastAPI | Три модуля. **3–5 дн.** |
| **M8** | 🟡 | `events/chains.py` vs `guidance/engine.py` ~562 | Два FSM без общего контракта | Не сливать; ADR: chains=save, guidance=user. **2 дн. docs** |
| **m5** | 🟢 | `.cursor/skills/` CI есть, product CI нет | Скиллы проверяются строже экономики | Инвертировать приоритет CI (C1). **0 дн. кода** |
| **m6** | 🟢 | Docstring `process_period_end` про XP | XP сняты ADR-003 | Поправить комментарий. **15 мин.** |
| **m8** | 🟢 | Пустой `DATABASE_URL` → SQLite `test.db` | Прод с кривым env молча в файл | Fail-fast вне pytest. **2 ч.** |

Picker событий — **взвешенный random + fatigue + diversity `event_domain`**. Для 2 карточек/период это верная модель; BT/GOAP/ML — YAGNI.

### Инфраструктура и процесс

| ID | Ур. | Где | Почему | Решение / effort |
|----|-----|-----|--------|------------------|
| **C1** | 🔴 | Только `skills-check.yml` на PR | 383 pytest не gate | Required: pytest + `npm run test:unit`. **1–2 дн.** |
| **C6** | 🔴 | `deploy-app.yml` push main без тестов | Сломанный SPA у игроков | `needs: test`. **0.5 дн. после C1** |
| **M15** | 🟡 | Нет Sentry, request_id, p95 | Нельзя доказать SLO | Sentry FE+BE. **2–3 дн.** |
| **M16** | 🟡 | 14 FE-тестов vs 383 pytest | Ломается UI без красного CI | Контракты bootstrap/pending. **3–5 дн.** |
| **m7** | 🟢 | Assessment июня 2026 | Частично устарел (skills CI появился) | Этот файл — актуальный снимок. **—** |

Правило `tvoy-hod-backend.mdc` всё ещё говорит «в CI тесты пока не подключаем» — после C1 правило надо сменить.

---

## План

### Фаза 1 — Стабилизация (P0)

**Вход:** текущий main, локальный unit зелёный.  
**Выход:** нельзя смержить красную экономику; API не стартует с дефолтным секретом; месяц нельзя закрыть дважды.

| Задача | ID | Зависимости | Verify |
|--------|-----|-------------|--------|
| CI pytest + `test:unit` required | C1 | — | GitHub Checks |
| Deploy Pages после tests | C6 | C1 | workflow `needs` |
| Argon2 + fail-fast SECRET_KEY | C2, C3 | — | login rehash test; startup crash без ключа |
| Lock + idempotency `/time/next` | C5 | — | повтор POST = тот же `period_index` |
| Один путь схемы | C4 | dump/staging | `verify_schema_baseline` |
| Health 503 | M10 | — | TestClient |
| Rate limit auth | M12 | — | 429 после N |

C7 / M17 — **сделано** (2026-09-07).

### Фаза 2 — Рефакторинг (P1)

**Вход:** P0 в main. **Выход:** новые фичи не кладут строки в god-файлы.

| Задача | ID | Зависимости |
|--------|-----|-------------|
| Порт событий; фасад `close_period` | M1 | тесты period |
| Распил `events/service.py` | M7 | M1 |
| Константа поражения в `rules.py` | M18 | — |
| Deprecate `/complete-period` | M20 | — |
| `useGame` + `screens/game/` | M4 | не блокер P0 |
| `React.lazy` | M5 | — |
| Страховки с API | M19 | — |
| Политика YAML vs admin | M14 | продукт |

### Фаза 3 — Оптимизация (P2)

**Вход:** хотя бы timing logs. **Выход:** известны p95, нет N+1 на close.

| Задача | ID |
|--------|-----|
| Убрать refresh-циклы period | M9 |
| Sentry + request_id | M15 |
| Seed advisory lock | M6 |
| PG pool_recycle | — |

### Фаза 4 — Финализация (P3)

JWT refresh (M11), FE-контракты (M16), мёртвый `CapitalPortfolioPanels` (m9), docstring XP (m6). Plan Mode / desktop — продукт, не ops-gate.

---

## Метрики готовности

| Метрика | Сейчас | Цель Closed Alpha → prod | Как мерить |
|---------|--------|---------------------------|------------|
| PR test gate | skills-check only | pytest + FE unit required | GitHub protection |
| Password KDF | SHA-256 | Argon2id | `auth.py` + rehash test |
| SECRET_KEY | default в коде | нет дефолта в prod | startup assert |
| Idempotent money POST | частичный; не `/time/next` | все денежные POST | `test_idempotency` + close |
| `/api/health` | 200 при мёртвой БД | 503 | TestClient |
| p95 `POST /time/next` | нет данных | < 800 ms @ 1 актив/1 долг | Sentry/Prom |
| p95 overview | нет данных | < 400 ms | то же |
| Crash-free FE | нет данных | ≥ 99.5% сессий | Sentry |
| Схема БД | 3 механизма | 1: migrate-on-deploy | staging restore |
| Backup restore | не видно в CI | раз в квартал | runbook |
| FPS / batching | н/п | н/п | не ставить |

Production-ready для **этого** продукта = безопасный релиз экономики + секреты + схема + наблюдаемость.

---

## Риски и гипотезы

| Риск | Гипотеза | Валидация | Фейл |
|------|----------|-----------|------|
| Рефактор `period.py` ломает баланс | Пилить только за зелёным pytest + DL1 golden | `pytest -q -k period` + balance-playtest при смене формул | Расхождение cash vs golden |
| Миграция паролей логает игроков | Dual-verify sha256→argon2 | Тест старого хеша | 401 на валидный старый пароль |
| `ensure_schema` уже разъехался с baseline | Dump prod ≠ `0000_schema_baseline.sql` | `verify_schema_baseline` на dump | Расхождение колонок |
| Обязательный Idempotency-Key ломает клиент | Сервер сам ключ `profile+period+close` | Повтор без заголовка | Второй close проходит |
| Scope Plan/desktop в «prod» | Держать в P3 продукта | Этот аудит vs product audit | Смешение kind |

---

## Не делаем (в этом снимке)

- Edge cases / concurrent-тесты / ручные чек-листы билда — [`../qa/2026-09-07-mechanics.md`](../qa/2026-09-07-mechanics.md).
- Баланс событий, FTUE-копирайт, длина кампании, монетизация — [`../product/2026-09-07-product-game-design.md`](../product/2026-09-07-product-game-design.md).
- Lab↔prod parity, a11y экранов — kind `ux` (живой чеклист пока [`UI_CONSISTENCY_AUDIT.md`](../../specs/UI_CONSISTENCY_AUDIT.md)).
- Gaps YAML-каталога — `/event-analysis` → kind `content`.
- Микросервисы, GraphQL, LLM-hints в runtime.
- Перенос `ARCHITECTURE_ASSESSMENT_2026-06.md` в archive без отдельного запроса.

---

## Связь с assessment июня 2026

Что **подтвердилось:** нет product CI, нет observability (R5), тройной путь схемы (R1), god `period.py` (R6), `useGame` / legacy FE (R4), seed на startup (R3).

Что **сдвинулось:** skills-check CI появился; идемпотентность есть на части POST; bootstrap один round-trip; C7/M17 закрыты в день снимка.

Что **новое относительно июня:** SHA-256 пароли, default SECRET_KEY, `/time/next` без lock, health 200, insurance FE constants, preview поражения `>=2` vs факт `>=3`, legacy `/complete-period`.
