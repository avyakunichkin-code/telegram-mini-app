---
layer: foundation
status: active
last_reviewed: 2026-06-01
audience: product, playtest moderators
wave_id: PA-W1-2026-06
---

# Pre-Alpha волна 1 — операционный лист

Заполнить **до** рассылки приглашений. Протокол: [`PRE_ALPHA_PLAYTEST_PROTOCOL.md`](PRE_ALPHA_PLAYTEST_PROTOCOL.md) · KPI: [`handbook/KPI_AND_PHASES.md`](../handbook/KPI_AND_PHASES.md) · результаты: [`PRE_ALPHA_WAVE1_RESULTS.md`](PRE_ALPHA_WAVE1_RESULTS.md).

Шаблоны: [`templates/`](templates/README.md).

---

## Статус запуска (2026-06-01)

| Готово | Блок |
|--------|------|
| ✅ | Код: TB1, O1 coach, PW1 resume/PWA, I1 страховки, smoke S1–S6 |
| ✅ | Доки: протокол, опрос, приглашение, трекер, KPI |
| ⏳ | **Деплой prod** — зафиксировать commit после merge/push (см. ниже) |
| ☐ | **Вы:** канал фидбека, форма опроса, трекер, модератор |
| ☐ | **Вы:** рассылка 10–20 приглашений |

---

## Решения команды (бывш. протокол §10)

| # | Вопрос | Решение волны 1 |
|---|--------|-----------------|
| 1 | Один шаблон или любой? | **По умолчанию «Студент»** (`mq_game_basic_v1`) — сравнимый фидбек. Исключение: второй проход для стресс-шаблона — отдельная микро-волна. |
| 2 | Жёсткий дедлайн? | **Нет.** Soft-напоминание через 3–4 дня («если ещё не играли — опрос до …»). |
| 3 | Где сырые ответы опроса? | **Google Form → Sheet** (или Яндекс.Формы). Доступ: product + 1 модератор. PII минимум; в git **не** коммитить ответы. 152-ФЗ: без паспортных данных; при сомнении — юрист. |
| 4 | Созвоны? | **Только асинхрон** в волне 1. До **3** коротких интервью (15 мин) **по желанию** после опроса — не в приглашении массово. |
| 5 | MQ-116 | Закрыта; не блокер. Онбординг O1 — в prod. |
| 6 | Вход | **Браузер или PWA** (Safari «На экран Домой»). TMA-бот — опционально позже ([`TELEGRAM_BACKLOG.md`](../backlog/TELEGRAM_BACKLOG.md)). |

---

## Заполнить перед стартом

| Поле | Значение | Готово |
|------|----------|--------|
| **wave_id** | `PA-W1-2026-06` | [x] |
| **Игра (браузер/PWA)** | [https://avyakunichkin-code.github.io/telegram-mini-app/#/](https://avyakunichkin-code.github.io/telegram-mini-app/#/) | [x] |
| **API health** | `GET https://telegram-mini-app-zwfs.onrender.com/api/health` → 200 | [x] |
| **Commit / deploy (prod)** | **Обновить перед рассылкой:** prod сейчас `index-BoE0mfML.js` (Pages); локально `ddc49ce` + незакоммиченный I1 — см. [`ops/DEPLOY.md`](../ops/DEPLOY.md) §5 | [ ] |
| **Канал фидбека** | TG-чат / группа: `________` | [ ] |
| **Опрос** | URL формы: `________` (текст: [`templates/PRE_ALPHA_SURVEY_COPY.md`](templates/PRE_ALPHA_SURVEY_COPY.md)) | [ ] |
| **Трекер** | Sheet: `________` (шаблон: [`templates/PRE_ALPHA_WAVE1_TRACKER.md`](templates/PRE_ALPHA_WAVE1_TRACKER.md)) | [ ] |
| **Модератор** | Имя, SLA «читаю раз в день» | [ ] |

**Telegram Bot / TMA:** в приглашении явно: «открыть ссылку в **браузере** или установить как PWA» ([`PWA_INSTALL.md`](PWA_INSTALL.md)).

---

## 3 шага до «Отправить» (product)

### Шаг 1 — Деплой и pin билда (~15 мин)

1. Закоммитить и запушить ветку → `main` (или `npm run deploy` из `frontend-react/`).
2. Дождаться GitHub Pages + Render (API уже на Render).
3. Ручной smoke S7: регистрация → **Игра** → **Студент** → зарплата → 1 событие → **Закрыть месяц**.
4. Записать в таблицу выше: `git rev-parse --short HEAD` и hash `index-*.js` со страницы.
5. Закрепить в канале фидбека: «Стенд от `YYYY-MM-DD`, commit `…`».

### Шаг 2 — Опрос + трекер (~30 мин)

1. Создать Google Form по [`templates/PRE_ALPHA_SURVEY_COPY.md`](templates/PRE_ALPHA_SURVEY_COPY.md) (Q1–Q9, опционально Q10).
2. В описании формы: `wave_id=PA-W1-2026-06`; имя/email **не обязательны**.
3. Отправить **тестовый ответ** → проверить Sheet.
4. Скопировать [`templates/PRE_ALPHA_WAVE1_TRACKER.md`](templates/PRE_ALPHA_WAVE1_TRACKER.md) в Google Sheet; вписать URL игры и опроса.

### Шаг 3 — Рассылка (~20 мин)

1. Скопировать текст ниже (или полный из [`templates/PRE_ALPHA_INVITE_RU.md`](templates/PRE_ALPHA_INVITE_RU.md)).
2. Отправить **10–20** контактам (30+, готовность к сырой версии).
3. В трекере отметить «приглашён» (коды A01…).
4. Soft-напоминание через **3–4 дня** тем, кто не ответил в опросе.

---

## Текст приглашения (подставить 2 URL)

```
Привет!

Приглашаем в раннюю версию игры ТВОЙ ХОД — симулятор финансовых решений по «месяцам». Это Pre-Alpha: возможны баги; фидбек поможет сделать игру понятнее.

Согласие: фидбек — для улучшения продукта, без имён в отчётах; скрины — только с вашего разрешения.

1. Игра: https://avyakunichkin-code.github.io/telegram-mini-app/#/
   (браузер или «Добавить на экран» в Safari/Chrome; первый вход к API может ждать ~10–15 с)
2. Новая игра → «Игра» → шаблон «Студент»
3. 30–45 мин, цель — **≥5 закрытых периодов** (новичку ≥3; stretch ≥8). Победу не ждём
4. Застряли — {{FEEDBACK_CHANNEL}} + скрин
5. После сессии — опрос 5–7 мин: {{SURVEY_URL}}

Не нужно: читать гайды заранее, сравнивать с другими играми.

Спасибо!
```

---

## Smoke (авто + ручное)

| # | Проверка | 2026-06-01 | Примечание |
|---|----------|------------|------------|
| S1 | `GET /api/health` | **PASS** 200, DB connected, ~0.5 s warm | Холодный старт до **~12 s** — предупредить в приглашении |
| S2 | GitHub Pages SPA | **PASS** 200 | asset `index-BoE0mfML.js` |
| S3 | Лендинг `/landing/` | не перепроверялось | |
| S4 | CORS github.io | **PASS** (2026-05-30) | |
| S5 | `npm run test:utils` | **PASS** 9/9 | 2026-06-01 |
| S6 | `pytest` MQ116 + insurance | **PASS** 16/16 | 2026-06-01 |
| S7 | Регистрация → игра → период | **РУЧНО** | Перед рассылкой после деплоя |
| S8 | TMA + PW1 resume | **РУЧНО** | Опционально; PWA PASS 2026-06-01 |
| S9 | DevTools: нет CORS | **РУЧНО** | Вместе с S7 |
| S10 | PWA Safari iOS | **PASS** | PW1-104 |

---

## Чеклист «кнопка старт» (§3 протокола)

- [x] Smoke S1–S6
- [ ] Деплой prod = pin commit в таблице выше
- [ ] S7 — полный ручной прогон после деплоя
- [ ] В канале фидбека закреплена строка билда
- [ ] Опрос развёрнут, тестовый ответ проверен
- [ ] Приглашения ушли **10–20** контактам; в трекере «приглашён»

---

## После волны (7 дней)

1. **Серверный срез** (§ ниже) → PA-A1..A3, PA-R3 в [`PRE_ALPHA_WAVE1_RESULTS.md`](PRE_ALPHA_WAVE1_RESULTS.md).
2. Заполнить результаты (gate/target, блокеры, цитаты); сверить Q9 vs PA-A1.
3. Retro 30 мин → **PA-G2** (можно ли расширять круг).
4. Обновить [`handbook/FEATURE_STATUS.md`](../handbook/FEATURE_STATUS.md).
5. Блокеры → issues; при fail PA-G1 — no-go до фикса.

---

## Серверный срез KPI (PostgreSQL)

Подставить даты окна волны (`wave_start`, `wave_end`). Когорта — профили, **созданные** в окне (или все с ≥1 close — зафиксировать в RESULTS).

```sql
-- Закрытых периодов на профиль (PA-A1, PA-A1s, PA-A2)
WITH cohort AS (
  SELECT id AS profile_id
  FROM game_profiles
  WHERE created_at >= :wave_start AND created_at < :wave_end
),
closes AS (
  SELECT c.game_profile_id, COUNT(*) AS n_closes
  FROM period_economy_closings c
  JOIN cohort ON cohort.profile_id = c.game_profile_id
  GROUP BY c.game_profile_id
)
SELECT
  COUNT(*) FILTER (WHERE n_closes >= 1) AS played,
  ROUND(100.0 * COUNT(*) FILTER (WHERE n_closes >= 5) / NULLIF(COUNT(*), 0), 1) AS pct_ge5,
  ROUND(100.0 * COUNT(*) FILTER (WHERE n_closes >= 8) / NULLIF(COUNT(*), 0), 1) AS pct_ge8,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY n_closes)
    FILTER (WHERE n_closes >= 1) AS median_closes
FROM closes;

-- PA-A3 + PA-R3 (та же когорта)
WITH cohort AS (
  SELECT id AS profile_id FROM game_profiles
  WHERE created_at >= :wave_start AND created_at < :wave_end
)
SELECT
  ROUND(100.0 * COUNT(*) FILTER (WHERE gp.last_period_salary_claimed > 0) / NULLIF(COUNT(*), 0), 1) AS pct_salary_claimed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE gp.is_active = 0 AND gp.period_index <= 5) / NULLIF(COUNT(*), 0), 1) AS pct_early_game_over
FROM game_profiles gp
JOIN cohort ON cohort.profile_id = gp.id;
```

Milestones: **3, 5, 8** в `notification_log`; в **Telegram** только **5 и 8** (3 — log-only).

### Тексты в Telegram (RU)

Ops-бот шлёт **короткие фразы на русском**, без `key=value`. Шаблоны: `backend/app/admin/notify_messages.py`.

| Событие | В Telegram? | Пример |
|---------|---------------|--------|
| Регистрация, старт игры | да | «🎮 Начата новая партия…» |
| Веха **5 / 8** месяцев | да | На 5-м: «🎯 Цель Pre-Alpha…» |
| Веха **3** месяца | нет (журнал) | Watchtower |
| **Первая** зарплата | да | «💰 Первая зарплата в партии…» |
| Каждый close, повторная зарплата | нет (только журнал) | Смотреть `#/admin` Watchtower |
| Поражение / победа | да | С подсказкой при раннем game over |

Полный журнал с колонкой «Событие» — **Watchtower** в админке.

---

*Пилот wave-0:* [`PRE_ALPHA_PLAYTEST_WAVE0_RESULTS.md`](PRE_ALPHA_PLAYTEST_WAVE0_RESULTS.md).
