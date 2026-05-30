---
layer: foundation
status: active
last_reviewed: 2026-05-30
audience: product, playtest moderators
wave_id: PA-W1
---

# Pre-Alpha волна 1 — операционный лист

Заполнить **до** рассылки приглашений. Протокол: [`PRE_ALPHA_PLAYTEST_PROTOCOL.md`](PRE_ALPHA_PLAYTEST_PROTOCOL.md) · KPI: [`handbook/KPI_AND_PHASES.md`](../handbook/KPI_AND_PHASES.md).

Шаблоны: [`templates/`](templates/README.md).

---

## Решения команды (бывш. протокол §10)

| # | Вопрос | Решение волны 1 |
|---|--------|-----------------|
| 1 | Один шаблон или любой? | **По умолчанию «Студент»** (`mq_game_basic_v1`) — сравнимый фидбек. Исключение: второй проход для стресс-шаблона — отдельная микро-волна. |
| 2 | Жёсткий дедлайн? | **Нет.** Soft-напоминание через 3–4 дня («если ещё не играли — опрос до …»). |
| 3 | Где сырые ответы опроса? | **Google Form → Sheet** (или Яндекс.Формы). Доступ: product + 1 модератор. PII минимум; в git **не** коммитить ответы. 152-ФЗ: без паспортных данных; при сомнении — юрист. |
| 4 | Созвоны? | **Только асинхрон** в волне 1. До **3** коротких интервью (15 мин) **по желанию** после опроса — не в приглашении массово. |
| 5 | MQ-116 | Закрыта; не блокер. Онбординг O1 — желателен, иначе мини-бриф из [`templates/PRE_ALPHA_INVITE_RU.md`](templates/PRE_ALPHA_INVITE_RU.md). |

---

## Заполнить перед стартом

| Поле | Значение | Готово |
|------|----------|--------|
| **wave_id** | `PA-W1-____-__` | [ ] |
| **Игра (браузер/PWA)** | `https://avyakunichkin-code.github.io/telegram-mini-app/#/` | [ ] |
| **API health** | `GET …/api/health` → 200 (см. [`ops/DEPLOY.md`](../ops/DEPLOY.md)) | [ ] |
| **Commit / deploy** | `new_functions` @ `8608d48` (деплой `npm run deploy` 2026-05-30) | [x] |
| **Канал фидбека** | TG-чат / группа: `________` | [ ] |
| **Опрос** | URL формы: `________` (текст: [`templates/PRE_ALPHA_SURVEY_COPY.md`](templates/PRE_ALPHA_SURVEY_COPY.md)) | [ ] |
| **Трекер** | Sheet: `________` (шаблон: [`templates/PRE_ALPHA_WAVE1_TRACKER.md`](templates/PRE_ALPHA_WAVE1_TRACKER.md)) | [ ] |
| **Модератор** | Имя, SLA «читаю раз в день» | [ ] |

**Telegram Bot / TMA:** если бот ещё не в проде — в приглашении явно: «открыть ссылку в браузере» ([`landing/README.md`](../../landing/README.md)).

---

## Скрипт §5 (готовый текст)

Скопировать из [`templates/PRE_ALPHA_INVITE_RU.md`](templates/PRE_ALPHA_INVITE_RU.md), подставив три URL/канала из таблицы выше.

Краткая версия для пересылки:

1. Игра: `{{GAME_URL}}` → **Игра** → **Студент** → 30–45 мин, цель **4-й период**.
2. Застряли → `{{FEEDBACK_CHANNEL}}` + скрин.
3. Опрос: `{{SURVEY_URL}}`.

---

## Smoke 2026-05-30 (авто + ручное)

| # | Проверка | Результат | Примечание |
|---|----------|-----------|------------|
| S1 | `GET /api/health` | **PASS** 200, DB connected | Холодный старт **~12.6 s**; warm **~0.4 s** — предупредить тестеров «первый вход может ждать» |
| S2 | GitHub Pages SPA | **PASS** 200 | `index-BJBTGvlj.js`, CSS 200 |
| S3 | Лендинг `/landing/` | **PASS** 200 | |
| S4 | CORS `Origin: github.io` | **PASS** | OPTIONS + GET `/api/game/templates` 200, **«Студент»** в каталоге |
| S5 | `npm run test:utils` | **PASS** 9/9 | PW1 lifecycle (локально) |
| S6 | `pytest` bootstrap + MQ116 | **PASS** 11/11 | Локально, in-memory/TestClient |
| S7 | Регистрация → игра → период | **РУЧНО** | Открыть [#/game](https://avyakunichkin-code.github.io/telegram-mini-app/#/game) в браузере |
| S8 | TMA + PW1 resume A–D | **РУЧНО** | Telegram, когда бот привязан к URL |
| S9 | DevTools: нет CORS | **РУЧНО** | Вместе с S7 |

---

## Чеклист «кнопка старт» (§3 протокола)

- [x] Smoke S1–S6 (см. таблицу выше)
- [ ] §3 протокола — полный ручной прогон S7–S9 + PW1 resume на **реальном** TMA (iOS или Android)
- [ ] В канале фидбека закреплена строка билда: «стенд от `YYYY-MM-DD`, commit `…`».
- [ ] Опрос развёрнут, тестовый ответ проверен.
- [ ] Приглашения ушли **10–20** контактам; в трекере отмечены «приглашён».

---

## После волны (7 дней)

1. Посчитать gate/target по [`KPI_AND_PHASES.md`](../handbook/KPI_AND_PHASES.md).
2. Retro 30 мин → **PA-G2** (можно ли расширять круг).
3. Обновить [`handbook/FEATURE_STATUS.md`](../handbook/FEATURE_STATUS.md), при необходимости — `PRE_ALPHA_WAVE1_RESULTS.md`.
4. Блокеры → issues; повтор волны или микро-волна 5–8 человек.

---

*Пилот wave-0:* [`PRE_ALPHA_PLAYTEST_WAVE0_RESULTS.md`](PRE_ALPHA_PLAYTEST_WAVE0_RESULTS.md).
