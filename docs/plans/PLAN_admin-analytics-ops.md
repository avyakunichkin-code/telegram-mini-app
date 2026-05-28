---
layer: plan
status: draft
last_reviewed: 2026-05-20
spec: ../vision/ideas/admin-and-notifications.md
epic: A0
related: ../specs/SPEC_ANALYTICS.md
---

# Plan: Ops-аналитика, Watchtower A1, уведомления

**Принцип:** при низком DAU ценность — **видеть каждого игрока и воронку**, а не BI-дашборды. Реализация **вертикальными срезами**: метрика → emit → лог → строка в `/admin` → (опционально) Telegram.

**Уже есть (A0):** [`admin/notify.py`](../../backend/app/admin/notify.py), `notification_log`, `GET /api/admin/watchtower`, `#/admin`, hooks: register, profile, game_start, win/loss, period_milestone.

**Не путать с:** вкладка «Аналитика» у игрока — [`SPEC_ANALYTICS.md`](../specs/SPEC_ANALYTICS.md) (графики для игрока). Этот план — **ops / продукт** для solo-dev.

---

## Что анализируем по игрокам (каталог метрик)

### Слой 1 — Привлечение

| Метрика | Определение | Зачем |
|---------|-------------|--------|
| `user_registered` | POST register | Каждый новый аккаунт |
| `profiles_count` | число сохранений у user | Повторные старты |
| `time_to_first_profile` | register → первый profile | Трение входа |

### Слой 2 — Активация (онбординг O1) ★ приоритет после Pre-Alpha

| Метрика | Определение | Зачем |
|---------|-------------|--------|
| `onboarding_started` | `game_started` + `onboarding_state=draft` | Вошёл в coach |
| `onboarding_step` | текущий шаг на профиле | Где застрял |
| `onboarding_step_reached` | событие при смене шага (лог) | Воронка 1→5 |
| `onboarding_brief_done` | `brief_done` | Прошёл обучение |
| `onboarding_skipped` | payload: `skip_count` 1 или 2 | Пропуск шага vs весь coach |
| `time_to_brief_done` | start → brief_done | Длина первой сессии |
| `salary_before_brief_done` | зарплата до конца онбординга | Ранний клик на практике шага 1 |

**Вопросы, на которые отвечаем:**

- Сколько % доходят до `brief_done`?
- На каком шаге чаще всего бросают?
- Сколько жмут «Пропустить» дважды сразу?
- Коррелирует ли «зарплата на практике» с пропуском шага 2?

### Слой 3 — Вовлечение (core loop)

| Метрика | Определение | Зачем |
|---------|-------------|--------|
| `period_index` (max) | последний период профиля | Глубина сессии |
| `period_milestone` | закрыт 1 / 3 / 7 | Воронка Pre-Alpha |
| `first_salary_claimed` | первый claim в профиле | Понял механику зарплаты |
| `first_safety_fund` | первый contribute > 0 | Понял подушку |
| `events_resolved_count` | выборы в EventInstance | Сюжет |
| `clean_period_streak` | из overview | Дисциплина |

### Слой 4 — Экономика (снимок на ключевых событиях)

| Метрика | Когда писать | Зачем |
|---------|--------------|--------|
| `cash_balance`, `safety_fund_balance` | period_end, win, loss | Контекст в алерте |
| `total_overdue_amount` | period_end | Риск |
| `net_monthly_cashflow` | period_end | Давление |
| `monthly_burn_total` | period_end (после E1) | Расходы на жизнь |

### Слой 5 — Исходы

| Метрика | Уже есть | Зачем |
|---------|----------|--------|
| `game_won` | ✅ | Главная победа продукта |
| `game_lost` | ✅ | Отвал |
| `periods_to_win` | payload при win | Баланс |

### Слой 6 — Здоровье / «застрял»

| Метрика | Определение | Зачем |
|---------|-------------|--------|
| `player_stuck` | активный профиль, нет действий N ч | Ручной разбор |
| `onboarding_stuck` | `draft` > 24 ч, period_index=1 | Не закончил coach |
| `salary_missed_period` | конец периода без salary_claimed | Ошибка UX |

---

## Архитектура (решения)

| Решение | Выбор |
|---------|--------|
| Хранилище событий v1 | Расширить **`notification_log`** (`audience=admin` + новые `kind`) — уже есть dedupe, TG, история |
| Хранилище v2 (при росте) | Таблица `player_events` (append-only) — когда лог станет тесным |
| Агрегаты | SQL в `GET /api/admin/metrics/summary` — без отдельного DWH |
| Telegram | Только **важные** события; шаги онбординга — в веб, не в TG (шум) |
| Player inbox | **Не в этой волне** — Phase 1 из idea |

---

## Фазы реализации

### Фаза A1 — Онбординг в Watchtower (1–2 дня) ★ следующий шаг

| # | Задача |
|---|--------|
| A1.1 | Колонки `onboarding_state`, `onboarding_step` в `AdminProfileRow` + UI |
| A1.2 | `emit_admin_alert`: `onboarding_brief_done`, `onboarding_skipped` (PATCH onboarding / skip в coach) |
| A1.3 | `onboarding_step_reached` — emit при PATCH step (dedupe по profile+step) |
| A1.4 | Фильтр в Watchtower: «только draft онбординг» |
| A1.5 | Блок «воронка онбординга»: счётчики по шагам из `notification_log` или snapshot |

**Критерий:** в `/admin` видно, кто на каком шаге; в TG приходит только `brief_done` / полный skip.

### Фаза A2 — Сводка метрик (1 день)

| # | Задача |
|---|--------|
| A2.1 | `GET /api/admin/metrics/summary` — users, profiles, draft onboarding, brief_done 7d, wins, avg period |
| A2.2 | Карточки сверху Watchtower |

### Фаза A3 — Карточка профиля (2 дня)

| # | Задача |
|---|--------|
| A3.1 | `GET /api/admin/profiles/{id}` — профиль + последние N записей log + period closings |
| A3.2 | UI: клик по строке → inspector (query `?profile=` уже есть — расширить) |

### Фаза A4 — Вовлечение в лог (по мере надобности)

| # | Задача |
|---|--------|
| A4.1 | `first_salary_claimed`, `first_safety_fund` (dedupe) |
| A4.2 | Payload period_end: cash, overdue, cashflow |
| A4.3 | `player_stuck` / `onboarding_stuck` — фоновая проверка или при overview |

### Фаза B — Player inbox (отложено)

См. [`admin-and-notifications.md`](../vision/ideas/admin-and-notifications.md) Phase 1.

### Фаза C — Игроковая «Аналитика» (отдельный эпик)

См. [`SPEC_ANALYTICS.md`](../specs/SPEC_ANALYTICS.md) фазы B–C — не смешивать с ops.

---

## Task list (детально)

### Task 1: Профиль в Watchtower — онбординг

**Описание:** Показать `onboarding_state` / `onboarding_step` в таблице профилей.

**Критерии:**
- [ ] API отдаёт поля
- [ ] UI: бейдж `draft` / `brief_done`, текст шага

**Проверка:** новая игра → в admin видно `draft` + `period_timer`

**Зависимости:** нет · **Объём:** S

---

### Task 2: Алерты завершения онбординга

**Описание:** TG + log при `brief_done` и при втором skip.

**Критерии:**
- [ ] `onboarding_brief_done` с `profile_id`, `template`, `seconds` (если есть)
- [ ] `onboarding_skipped` с `skip_count=2`
- [ ] dedupe_key на профиль

**Проверка:** pytest emit + ручной PATCH

**Зависимости:** Task 1 · **Объём:** S

---

### Task 3: Лог смены шага (без TG)

**Описание:** При PATCH `onboarding_step` — запись в `notification_log`, без Telegram.

**Критерии:**
- [ ] kind `onboarding_step_reached`, payload `{ step, period_index }`
- [ ] dedupe: один раз на шаг на профиль

**Зависимости:** Task 2 · **Объём:** S

---

### Task 4: Воронка в UI

**Описание:** Блок на `/admin`: сколько профилей на каждом шаге / brief_done.

**Критерии:**
- [ ] Endpoint или агрегация в watchtower
- [ ] 5 строк воронки + % от started

**Зависимости:** Task 3 · **Объём:** M

---

### Task 5: Summary metrics

**Описание:** Верхняя панель KPI для solo-dev.

**Критерии:**
- [ ] users total, profiles active, onboarding draft count, wins total
- [ ] опционально: за 7 дней

**Зависимости:** нет · **Объём:** M

---

### Task 6: Profile inspector

**Описание:** Детальная карточка одного сохранения.

**Критерии:**
- [ ] API profile detail
- [ ] UI: экономика, период, лента notification_log, ссылка на игрока

**Зависимости:** Task 1 · **Объём:** M

---

## Checkpoint после A1–A2

- [ ] Pre-Alpha: по каждому тестеру видно шаг онбординга в admin
- [ ] TG не заспамлен (только brief_done / full skip)
- [ ] Можно ответить: «где бросают онбординг»

## Checkpoint после A3–A4

- [ ] Клик по профилю → полная картина без SQL
- [ ] period_end несёт экономический контекст в лог

---

## Риски

| Риск | Митигация |
|------|-----------|
| Спам в TG | Шаги онбординга только в log; TG — milestone события |
| `notification_log` раздуется | Лимиты в watchtower; позже `player_events` |
| Дубли emit | `dedupe_key` везде |
| Путаница с SPEC_ANALYTICS | В бэклоге разные эпики: A0 ops vs Analytics UI |

---

## Open questions

1. **TG для `onboarding_brief_done`?** — Рекомендация: да; для шагов 1–4 — нет.
2. **Порог `player_stuck`?** — Черновик: 24 ч при `time_state=play` и period_index &lt; 3.
3. **Нужен ли экспорт CSV** из admin на Pre-Alpha? — Опционально Task 7 (XS).

---

## Связь с Pre-Alpha

Обновить [`PRE_ALPHA_PLAYTEST_PROTOCOL.md`](../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md) §6 опроса:

- «Понятен ли онбординг Монетки?» (1–5)
- «На каком шаге хотели закрыть приложение?» (свободный текст)

Сверять ответы с воронкой в admin (Task 4).

---

## Оценка

| Фаза | Срок |
|------|------|
| A1 онбординг в admin | 1–2 дня |
| A2 summary | 0.5–1 день |
| A3 inspector | 1–2 дня |
| A4 вовлечение | по запросу после плейтеста |

**Рекомендуемый порядок:** A1 → A2 → (Pre-Alpha) → A3 → A4.
