---
layer: vision
status: active
last_reviewed: 2026-06-01
tracks: a0, admin, ops, analytics
idea_refine: 2026-06-01
parent: admin-and-notifications.md
backlog: ../../backlog/ADMIN_BACKLOG.md
plan: ../../plans/PLAN_admin-analytics-ops.md
related: admin-catalog-registry.md, admin-ops-quarter-2026.md, specs/features/SPEC_telegram-bots-and-notifications.md
---

# Admin Platform — эволюция на 1–3 месяца

Сессия **idea-refine** (2026-06-01): solo-dev / оператор, **низкий DAU**, цель — **аналитика и разбор игроков без BI и CMS**, почти без затрат. Исключено из фокуса сейчас: PA-W1, E1, бэкапы БД.

**Уже в prod (A0+):** Watchtower, KPI summary, profile inspector, stuck-бейджи, воронка guidance, журнал ops-алертов, **отзывы с финала (GE1)**, read-only **Справочники** (4 каталога). Подробный инвентарь — [`ADMIN_BACKLOG.md`](../../backlog/ADMIN_BACKLOG.md).

---

## Problem Statement

**Как за 30 секунд понять, что происходит с игрой и с конкретным игроком**, когда нет отдельного аналитика, Metabase и времени на SQL — но нужно готовить контент, ловить застревания и читать плейтест-фидбек?

---

## Recommended Direction

### Принцип: Ops Cockpit, не CMS

| Подход | Для нас | Почему |
|--------|---------|--------|
| **Кастомный Watchtower** (`#/admin`) | ✅ канон | Уже есть доменные модели, allowlist, TG deep link; дешевле, чем встраивать generic admin |
| Retool / Budibase / AdminJS | ❌ пока | Окупается при команде 3+ и частых ad-hoc запросах; у нас логика в `GameProfile` / victory / events |
| PostHog / Amplitude | ⏸ позже | Продуктовая воронка игрока — отдельно от ops «разобрать профиль #7» |
| Metabase + PostgreSQL | ⏸ M3 | Имеет смысл при **стабильном DAU 50+** и повторяющихся отчётах |
| «Править всё в админке» | ❌ M1 | Контент остаётся в YAML/сидах; админка — **наблюдение + точечные правки**, не замена репозитория |

**North Star (3 месяца):** один экран входа → **пульс** (KPI) → **очередь внимания** (застрял / поражение / свежий фидбек) → **inspector профиля** (экономика + лог + closings) → при необходимости **справочник** (clone/PATCH).

**Telegram:** остаётся **пейджером** (register, win, loss, brief_done). Детали и воронки — **только веб**.

---

## Горизонт по месяцам

### Месяц 1 — «Вижу и фильтрую» (почти без затрат)

**Цель:** не открывать SQL и не скроллить 50 строк вслепую.

| Что | Суть |
|-----|------|
| **Очередь внимания** | Пресеты: застрял, онбординг draft, поражение, победа, есть отзыв с финала |
| **Таблица профилей** | Колонки `run_outcome`, archived; сортировка по `updated_at` |
| **KPI+** | Defeats / feedback 7d / «активных без движения» в `metrics_summary` |
| **Inspector+** | Последний `player_run_feedback`, мини-график `period_economy_closings` (уже есть closings в API) |
| **Экспорт** | CSV профилей и отзывов — для заметок и разбора вне UI |
| **Deep links** | Из TG и из каталога событий → inspector / строка event |

**Не делаем:** редактирование контента, когорты D7, digest TG.

### Месяц 2 — «Правлю каталоги без YAML в git»

**Цель:** новый event / правка starter без миграции руками, с безопасным черновиком.

| Что | Суть |
|-----|------|
| **Catalog C1** | Clone + create (`is_active=0`) |
| **Catalog C2** | PATCH скаляров + JSON validate (blueprint, victory_config, effects) |
| **Events C2e** | Choices в UI для `EventDefinition` |
| **Связка ops ↔ контент** | В inspector: pending events + ссылка «открыть в справочнике» по `event_key` |
| **Ops emits** | `event_chosen` в log-only (α-FB-04) — доля осмысленных выборов |

**Не делаем:** WYSIWYG карточки в TMA, draft/publish workflow, player inbox.

### Месяц 3 — «Студия и зрелость»

**Цель:** меньше ручного деплоя контента; опционально внешний BI.

| Что | Суть |
|-----|------|
| **Content Studio lite** | Preview карточки события (текст + choices) в iframe/dev route |
| **Export/import** | Снимок event/starter в JSON для git sync |
| **Notification rules** | draft → test на admin → publish (из parent idea Phase 2) |
| **Readonly Metabase** | 3–5 дашбордов на `notification_log` + profiles, если DAU вырос |
| **Player inbox (read-only)** | Просмотр `player_notifications` для поддержки, без push |

**Не делаем:** публичный admin, dev-кнопки «+cash» без feature flag, отдельный `admin.html`.

---

## Вариации (idea-refine, отброшенные)

| Вариант | Плюс | Минус | Вердикт |
|---------|------|-------|---------|
| Только Telegram | Нулевой FE | Нет воронки, нет inspector | Отклонён |
| Только SQL + DBeaver | Быстро сейчас | Не масштабируется, нет stuck/feedback | Отклонён |
| AdminJS на FastAPI | CRUD из коробки | JSON-поля, choices, victory — кастом всё равно | Отложен |
| Полный CMS | Мечта контентщика | 2+ месяца, дублирует YAML pipeline | M3 lite максимум |

---

## Key Assumptions to Validate

- [ ] **30 секунд до ответа** — пресеты + inspector хватает при 5–20 активных профилях.
- [ ] **`notification_log`** хватает до ~100 DAU; иначе — append-only `player_events` (одна миграция).
- [ ] **Catalog edit** не ломает prod, если новые строки только `is_active=0`.
- [ ] **CSV export** реально используется на плейтесте (иначе не делать).
- [ ] **Metabase** окупается только после стабильного трафика — не раньше M3.

---

## MVP Scope (ближайший спринт на админку)

См. [`ADMIN_BACKLOG.md`](../../backlog/ADMIN_BACKLOG.md) — блок **Quick wins** и **P1**.

**In:** фильтры Watchtower, KPI defeats/feedback, inspector feedback + closings chart, CSV, `run_outcome` в таблице.

**Out:** C1+ каталоги, player inbox, Metabase, PA-W1, E1.

---

## Not Doing (and Why)

| Не делаем | Почему |
|-----------|--------|
| BI / когорты / D7 в M1 | Нет объёма данных; SQL-агрегаты в summary достаточно |
| Шаги онбординга в TG | Шум (решение 2026-05-30) |
| Замена git/YAML контентом из админки | Потеря review, diff, CI; только дополнение |
| Player push из админки | Другой эпик TG1 |
| Dev-tools в prod admin | Риск; только локально / feature flag |

---

## Open Questions

- [ ] Нужен ли **единый «Inbox ops»** (алерты + feedback + stuck) или достаточно секций на одной странице?
- [ ] **Readonly SQL** в admin для emergency — или всегда inspector?
- [ ] Приоритет **C1 каталоги** vs **event_chosen analytics** после α-FB?

---

## Verdict (idea-refine)

**APPROVED** — развитие админки как **Ops Cockpit** в три волны (фильтры → каталоги → studio/BI). Детальный бэклог: [`ADMIN_BACKLOG.md`](../../backlog/ADMIN_BACKLOG.md). Следующий spec при крупном C2: `SPEC_admin-platform.md` (черновик из parent + catalog idea).
