# Admin — бэклог (эпик A0+)

Живой список работ по **ops-админке** (`#/admin`, `GET /api/admin/*`). Не путать с вкладкой «Аналитика» у игрока — [`SPEC_ANALYTICS.md`](../specs/SPEC_ANALYTICS.md).

**Концепция 1–3 месяца:** [`admin-platform-evolution.md`](../vision/ideas/admin-platform-evolution.md)  
**Родительская идея:** [`admin-and-notifications.md`](../vision/ideas/admin-and-notifications.md)  
**План срезов:** [`PLAN_admin-analytics-ops.md`](../plans/PLAN_admin-analytics-ops.md)  
**Сводный бэклог:** [`PRODUCT_BACKLOG.md`](PRODUCT_BACKLOG.md) (эпик A0)

**Вне фокуса этого файла (по решению 2026-06-01):** PA-W1, E1, бэкапы БД.

---

## Инвентарь prod (2026-06-02)

| Модуль | Backend | Frontend | Примечание |
|--------|---------|----------|------------|
| Watchtower | `GET /watchtower` | `AdminWatchtowerScreen` | users, profiles, notifications, funnel, KPI, фильтры, CSV |
| KPI summary | `GET /metrics/summary` | карточки сверху | окно 7d; победы, поражения, отзывы |
| Profile inspector | `GET /profiles/{id}` | `AdminProfileInspectorPanel` | closings, sparkline, feedback, pending events |
| Stuck scan | `stuck_scan.py` | бейдж в таблице | onboarding / player stuck |
| Ops alerts + TG | `notify.py`, `notification_log` | — | dedupe, RU тексты |
| Run feedback (GE1) | `player_run_feedback` | секция Watchtower | POST из игры |
| Catalog registry **C0** | `GET /catalogs`, `.../rows` | `#/admin/catalogs` | events, starters, assets, liabilities, **read-only** |
| Auth | `ADMIN_USER_IDS` | `AuthGuard`, `AdminWebShell` | desktop layout |

---

## Принципы приоритизации

1. **Read > write** — сначала видимость и фильтры, потом правка каталогов.
2. **Один профиль — один экран** — inspector как hub разбора.
3. **Log as source of truth** — расширять `notification_log` kinds, не строить DWH.
4. **Дешёвые победы** — колонки, фильтры, CSV, 1–2 SQL-агрегата в summary.

---

## Quick wins (≤ 0.5–1 день каждый, высокий ROI)

| ID | Задача | Слой | Статус |
|----|--------|------|--------|
| **AQ-01** | Колонка `run_outcome` (+ archived) в таблице профилей Watchtower | BE+FE | ✅ 2026-06-02 |
| **AQ-02** | Пресеты фильтра профилей: «Застрял», «Онбординг draft», «Поражение», «Победа» | BE+FE | ✅ |
| **AQ-03** | KPI: `defeats_total` / `defeats_recent`, `run_feedback_recent` в `metrics_summary` | BE+FE | ✅ |
| **AQ-04** | Inspector: блок «Последний отзыв с финала» (`player_run_feedback`) | BE+FE | ✅ |
| **AQ-05** | Inspector: sparkline по `period_closings` (cash) | FE | ✅ |
| **AQ-06** | `profile_filter=stuck` / `stuck_only` на API | BE+FE | ✅ |
| **AQ-07** | Export CSV: профили и `run_feedback` | BE+FE | ✅ |
| **AQ-08** | Activity log в inspector: фильтр по `kind` | FE | ✅ |
| **AQ-09** | Копировать `profile_id` / `user_id` в буфер | FE | ✅ |
| **AQ-10** | Ссылка из журнала алертов → inspector (`game_profile_id` / payload) | FE | ✅ 2026-06-02 |

**Следующий срез:** **C2e** (choices), **A7** (ops playbook).

---

## P1 — Месяц 1: Ops cockpit

| ID | Задача | Слой | Зависимости |
|----|--------|------|-------------|
| **A1-UX** | «Очередь внимания»: stuck + defeat + свежие отзывы | FE | ✅ 2026-06-02 |
| **A2+** | `metrics_summary`: `profiles_period_3_plus_*` | BE+FE | ✅ |
| **A3+** | Inspector: pending events (id, title, slot) | BE+FE | ✅ |
| **A4+** | Emit `event_chosen` в `notification_log` only (α-FB-04) | BE | ✅ 2026-06-02 |
| **A5** | Profile row: `template_key` → link `/admin/catalogs/starters?highlight=` | FE | ✅ |
| **A6** | Watchtower: поиск `q` по username / имени профиля | BE+FE | ✅ |
| **A7** | Док: «Ops playbook» — 5 сценариев разбора (застрял, loss, win, feedback, контент) | Doc | — |

---

## P1 — Месяц 2: Catalog registry (из [`admin-catalog-registry.md`](../vision/ideas/admin-catalog-registry.md))

| ID | Задача | Слой | Статус |
|----|--------|------|--------|
| **C0** | Read-only списки 4 каталогов | BE+FE | ✅ |
| **C1** | `POST` create, `POST .../clone`, default `is_active=0` | BE+FE | ✅ 2026-06-02 |
| **C2** | `PATCH` скаляры + JSON validate (`blueprint_json`, `victory_config_json`, …) | BE | ✅ 2026-06-02 |
| **C2-UI** | Редактор: вкладки «Основное» + «JSON» + validate errors | FE | ✅ |
| **C2e** | Event choices: list / add / delete | BE+FE | ⬜ |
| **C3** | «Открыть в справочнике» из inspector по `event_key` pending | FE | C0 |

**Не делаем в C1–C2:** delete row, WYSIWYG preview в TMA, draft/publish state machine (`is_active` = черновик).

---

## P2 — Месяц 3 и позже

| ID | Задача | Слой |
|----|--------|------|
| **B1** | Content Studio lite: preview event card (static / dev route) | FE |
| **B2** | Export/import JSON snapshot catalog row → git-friendly | BE |
| **B3** | Notification rules: draft → test admin → publish | BE+FE |
| **B4** | Readonly Metabase (3–5 views) на PG | Ops |
| **B5** | Player inbox read-only для ops | BE+FE |
| **B6** | `player_events` append-only (если log тесен) | DB+BE |
| **B7** | Когорты: D1 return, «дошёл до period 3» | BE |

---

## P0 (admin-only, когда нужен жёсткий приоритет)

Сейчас **нет отдельного P0**, кроме ops-инфра из [`TELEGRAM_BACKLOG.md`](TELEGRAM_BACKLOG.md) (TG-001…005: бот, env, smoke) — это **не UI**, но блокирует алерты.

| ID | Задача | Слой |
|----|--------|------|
| **TG-ops** | Env Render + smoke TG + `#/admin` allowlist | Ops |

Quick wins **AQ-01…AQ-09** закрыты (2026-06-02). Практический P0 сейчас: **A1-UX**, **A3+**, **A6** (UI поиска).

---

## Сравнение с «готовыми» admin-решениями

| Решение | Когда имеет смысл | Для ТВОЙ ХОД сейчас |
|---------|-------------------|---------------------|
| **Свой Watchtower** | Доменная модель сложная, solo-dev | ✅ уже окупается |
| AdminJS / SQLAdmin | CRUD за день | JSON/events/choices всё равно кастом |
| Retool / Budibase | Много ad-hoc SQL, команда | Overkill |
| Metabase | Повторяющиеся отчёты, DAU 50+ | M3 опционально |
| Grafana | Инфра / 5xx | Не продуктовая аналитика |

---

## Связь с PRODUCT_BACKLOG (эпик A0)

| В PRODUCT_BACKLOG | В ADMIN_BACKLOG |
|-------------------|-----------------|
| A1 онбординг в WT | ✅ + AQ-02, funnel |
| A2 metrics summary | ✅ + AQ-03, A2+ |
| A3 inspector | ✅ + AQ-04…05, A3+ |
| A4 stuck / emits | ✅ + AQ-02, A4+ |
| Phase B player inbox | B5 |
| Phase C content studio | C1–C2, B1–B2 |
| P1 PLAN ops doc | A7 |

---

## Журнал

| Дата | Изменение |
|------|-----------|
| 2026-06-01 | Создан ADMIN_BACKLOG; идея [`admin-platform-evolution.md`](../vision/ideas/admin-platform-evolution.md); GE1 feedback в WT |
| 2026-06-02 | **AQ-01…AQ-10** + **A1-UX, A2+, A3+, A5, A6**: очередь внимания, поиск, pending events, KPI period≥3, ссылки каталог/алерты |
| 2026-06-02 | **A4+** `event_chosen` log-only; **C1** `catalog_write.py`, POST create/clone, UI «Пустой черновик» / «Дублировать» |
| 2026-06-02 | **C2 / C2-UI:** GET/PATCH row, `catalog_validate.py`, редактор `#/admin/catalogs/{key}/edit/{id}` |

---

*Последнее обновление: 2026-06-02.*
