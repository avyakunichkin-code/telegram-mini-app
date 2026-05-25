---
layer: plan
status: active
last_reviewed: 2026-05-26
tracks: backlog, pre-alpha, m12, i1, pw1, e1, a0
source: ../backlog/PRODUCT_BACKLOG.md
---

# План работ: май 2026 (из беклога)

Решения продукта (2026-05-26):

| # | Решение |
|---|---------|
| 1 | **T1** (turn-based без таймера) — **не** в ближайший спринт; эпик в беклоге, реализация после α |
| 2 | **I1** — два явных трека: покупка/каталог и выплата (claim); см. фазу 1 ниже |
| 3 | **E1** — **пауза реализации**; сначала повторная аналитика (фаза E1-R) |
| 4 | Обновить [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md): T1, «В работу сейчас», статус E1 |

---

## Фаза 0 — Pre-Alpha gate (P0)

### Task 0.1: Синхронизация документации M11 и cooldown

**Описание:** В [`GAME.md`](../../GAME.md) §0.2 и связанных doc всё ещё может фигурировать «cooldown не реализован» и незакрытая приёмка M11. Привести GAME, [`MVP_AUDIT_VS_SPEC.md`](../foundation/MVP_AUDIT_VS_SPEC.md) и [`TRACEABILITY.md`](../TRACEABILITY.md) в соответствие с кодом (`game_rules`, миграция 0007, `test_mq116_acceptance.py`).

**Критерии приёмки:**
- [ ] GAME.md §0.2: cooldown ✅, M11 ✅, достижения 🟡, ссылка на PRODUCT_BACKLOG
- [ ] TRACEABILITY: эпик M11 / MQ-116 — implemented (или эквивалентный статус)
- [ ] MVP_AUDIT: пункты tier/cooldown/repeat отмечены с отсылкой к тестам

**Проверка:** ревью diff только в `docs/`; `pytest -q backend/tests/test_mq116_acceptance.py` (регрессия).

**Зависимости:** нет · **Объём:** S (Doc)

---

### Task 0.2: PW1-004 — прогон checklist resume (A–D)

**Описание:** Ручной QA по [`PW1_RESUME_PLAYTEST_CHECKLIST.md`](../foundation/PW1_RESUME_PLAYTEST_CHECKLIST.md): блокировка экрана, возврат в TMA/PWA, смена вкладки, длинная пауза. Цель — подтвердить, что `visibilitychange` + `refreshGameState` не оставляют рассинхрон периода/таймера с сервером.

**Критерии приёмки:**
- [ ] Таблица прогона: 2 устройства (iOS + Android или iOS + desktop TMA), билд/коммит указан
- [ ] Сценарии A–D пройдены с итогом PASS/FAIL по каждому
- [ ] P0-баги (если есть) заведены с шагами воспроизведения

**Проверка:** заполненный checklist в doc или комментарий в журнале беклога.

**Зависимости:** нет · **Объём:** S (QA)

---

### Task 0.3: Пилот Pre-Alpha (10–20 игроков)

**Описание:** Операционный прогон по [`PRE_ALPHA_PLAYTEST_PROTOCOL.md`](../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md): набор когорты, фиксированный билд, модерация сессии, короткий опрос (вклад vs cash, подушка, «что такое период»). Не измеряем D7/NPS — только играбельность и понимание базовых понятий.

**Критерии приёмки:**
- [ ] 10–20 участников, явное предупреждение «сырая версия»
- [ ] Сводка: % дошедших до периода 3–4, топ-3 боли, список багов P0/P1
- [ ] Решение go / no-go для следующего этапа (запись в журнале беклога или DOC_SYNC_LOG)

**Проверка:** таблица ответов + 1 страница выводов.

**Зависимости:** 0.1 желательно; 0.2 — PASS для resume · **Объём:** M (Product)

---

### Checkpoint 0

- [ ] Доки не противоречат коду M11/PW1
- [ ] Resume не блокирует набор
- [ ] Есть отчёт плейтеста, не только субъективное «норм»

---

## Фаза 1 — M12 + I1 + PW1 prod (P1)

### Task 1.1: Контракт `GET /api/achievements` и тесты

**Описание:** Backend достижений уже есть (`achievement_engine`, сиды). Зафиксировать стабильную форму ответа API (цепочки, шаги, `unlocked_at`, без legacy XP), синхронизировать [`frontend-react/src/api/game.js`](../../frontend-react/src/api/game.js) и [`SPEC_achievements.md`](../specs/features/SPEC_achievements.md) § API. Добавить интеграционные тесты с БД: пустой профиль, после unlock, после period end.

**Критерии приёмки:**
- [ ] Ответ API документирован в spec и совпадает с реализацией
- [ ] `api/game.js` — единый вызов с обработкой `ApiError`
- [ ] `pytest`: минимум 3 кейса (empty / partial / full chain)

**Проверка:** `pytest -q` (achievement + api).

**Зависимости:** нет · **Объём:** M (Backend + api.js)

**Файлы:** `backend/app/routers/` achievements, `test_achievement_engine.py`, `api/game.js`

---

### Task 1.2: Design-lab → MQX → экран «Развитие» (M12 FE)

**Описание:** Полный UI эпика M12 по [`SPEC_achievements.md`](../specs/features/SPEC_achievements.md) §2 (гибрид B+C): утвердить [`design-lab/achievements-progress/`](../../design-lab/achievements-progress/), перенести в `mqx/` (`MqxAchievementCoin`, `AchievementsScreen`), пункт в меню + сворачиваемый блок на главной **без** 5-го таба в `BottomGameNav`. Toasts при unlock уже в `progressionToasts.js` — не дублировать.

**Критерии приёмки:**
- [ ] APPROVED в design-lab или обновлён README раунда
- [ ] Экран показывает цепочки, tier, locked/unlocked, недавние unlock
- [ ] Навигация: Меню → «Развитие»; на дашборде — блок (свёрнут по умолчанию допустимо)
- [ ] `npm run build` без ошибок

**Проверка:** ручной проход с живым API; `#/dev/mqx` при новых компонентах.

**Зависимости:** 1.1 · **Объём:** L (Frontend + MQX workflow)

---

### Task 1.3: I1-A — Покупка и каталог страховок (видимость)

**Описание (уточнение вопроса 2):**  
**Покупка** — то, что игрок делает сам: открыть «Страховки», выбрать продукт/объект (health / auto / …), заплатить премию, увидеть активный полис. В коде уже есть `InsuranceSection`, `InsuranceProductPicker`, `POST /api/insurance/buy` — задача довести до **приёмки Pre-Alpha**: каталог из design-lab/MQX, понятные карточки плана, ошибки через тосты, согласованность с `overview.mechanics.capital_insurance` (разблокировка после целей победы, не «уровень персонажа»).

**Критерии приёмки:**
- [ ] При `capital_insurance` unlocked — покупка и отмена полиса работают end-to-end
- [ ] При locked — понятный CTA/подсказка (из `character_unlocks` / victory, без упоминания XP)
- [ ] UI согласован с design-lab (если раунд есть) или текущим MQX-паттерном аккордеона
- [ ] Премия отражается в period end / overview (как сейчас в prod)

**Проверка:** ручной: купить → дождаться конца периода → премия списана.

**Зависимости:** нет · **Объём:** M (Frontend)

---

### Task 1.4: I1-B — Выплата по полису (claim) и связка с событиями

**Описание (вторая половина I1):**  
**Claim (выплата)** — не отдельная кнопка «получить страховку», а **срабатывание при страховом событии**: в `effects_json` выбора есть `insurance_claim` → backend (`apply_insurance_claim_from_effects`, `settle_insurance_claim`) находит полис, начисляет `payout_amount` на cash, ставит `claimed_period_index`. Нужно убедиться, что цепочка **работает в prod** и игрок **видит** результат (тост/строка в итоге события/периода), а не только тихое начисление.

**Критерии приёмки:**
- [ ] Событие с `insurance_claim` при активном полисе → cash + деакивация полиса; без полиса — понятная 400/сообщение
- [ ] `payout_amount` из каталога/0008 используется (не только legacy `coverage_limit`)
- [ ] UI: после выбора в событии видно сумму выплаты (или в тосте периода)
- [ ] `pytest`: settle + apply_from_effects на фикстуре

**Проверка:** ручной сценарий: купить health → триггер события со claim → баланс вырос.

**Зависимости:** 1.3 (полис должен покупаться) · **Объём:** M (Backend + Frontend touch)

**Примечание:** если в α нет контентного события с claim — добавить **одно** тестовое событие в сиды или использовать существующее из каталога (зафиксировать в task notes).

---

### Task 1.5: PW1-104 — PWA на prod (CORS + env)

**Описание:** После PASS 0.2: разрешить origin установленной PWA, прописать `VITE_API_BASE_URL` в CI/CD, проверить install → login → игра.

**Критерии приёмки:**
- [ ] API с prod PWA origin без CORS-ошибок
- [ ] [`PWA_INSTALL.md`](../foundation/PWA_INSTALL.md) актуален (URL, env)

**Проверка:** установка PWA + один полный период.

**Зависимости:** 0.2 PASS · **Объём:** S (Ops + Backend config)

---

### Task 1.6: A0 env на Render (если ещё не закрыто)

**Описание:** `ADMIN_USER_IDS`, `OPS_TELEGRAM_BOT_TOKEN`, `OPS_TELEGRAM_CHAT_ID`, `ADMIN_WEB_BASE_URL` / `PUBLIC_APP_URL` для ссылок в ops-алертах.

**Критерии приёмки:**
- [ ] Watchtower `#/admin` доступен allowlist-пользователю на staging/prod
- [ ] Тестовый alert (register / period end) приходит в ops-чат

**Проверка:** ручной на Render.

**Зависимости:** нет · **Объём:** XS (Ops)

---

### Checkpoint 1

- [ ] «Развитие» открывается и наполняется из API
- [ ] Страховки: купить + (по возможности) claim на событии
- [ ] PWA prod не ломает API

---

## Фаза E1-R — Повторная аналитика расходов (до любого E1-110)

**Статус эпика E1:** реализация **заморожена** до завершения E1-R. Существующие [`PLAN_expenses.md`](PLAN_expenses.md) и [`TASKS_expenses.md`](../tasks/TASKS_expenses.md) остаются черновиком порядка работ **после** аналитики.

### Task E1-R1: Снимок экономики «как сейчас» vs «как будет с E1»

**Описание:** Сравнить текущую модель (`base_monthly_lifestyle_expense` + `delta` из событий, списание в `process_period_end`) с целевой из [`EXPENSES_SYSTEM.md`](../specs/gameplay/EXPENSES_SYSTEM.md): таблица по каждому game-шаблону — burn, cashflow, период до поражения, влияние на victory chain и достижения. Выход: 1–2 страницы с цифрами (можно SQL/скрипт или выгрузка overview на фикстурных профилях).

**Критерии приёмки:**
- [ ] Таблица: template_key × (base, delta типичный, итог outflow, win period estimate)
- [ ] Явно отмечены шаблоны, где E1 **ломает** текущий баланс (tutorial / harder / …)
- [ ] Рекомендация: менять сиды шаблонов / victory / события **до** или **вместе** с миграцией

**Проверка:** ревью с product; приложить к issue или `docs/vision/`.

**Зависимости:** нет · **Объём:** M (Analytics + Doc)

---

### Task E1-R2: Gap-анализ spec ↔ код ↔ UX

**Описание:** Пройти [`SPEC_expenses.md`](../specs/features/SPEC_expenses.md) и [`EXPENSES_LAYER_CHECKLIST.md`](../specs/economy/EXPENSES_LAYER_CHECKLIST.md) против prod: что уже частично есть (breakdown в analytics?, lifestyle в overview?), что дублирует E1, что out of scope для Game v1. Обновить spec: статус, open questions, non-goals.

**Критерии приёмки:**
- [ ] Чеклист LAYER: каждый пункт — «уже есть / E1 / отложить»
- [ ] SPEC: раздел «Assumptions validated / invalidated» после E1-R1
- [ ] Список обязательных правок victory/achievements/event effects **до** волны A

**Проверка:** PR только в `docs/`.

**Зависимости:** E1-R1 · **Объём:** M (Doc)

---

### Task E1-R3: Решение go / reshape / defer + обновление плана

**Описание:** По итогам R1–R2: зафиксировать решение (полный E1 / урезанный MVP-E1 только breakdown без Plan / defer). Обновить [`PLAN_expenses.md`](PLAN_expenses.md), [`TASKS_expenses.md`](../tasks/TASKS_expenses.md), строку эпика в PRODUCT_BACKLOG. Только после **go** возобновлять E1-110…

**Критерии приёмки:**
- [ ] ADR или запись в DOC_SYNC_LOG с решением и датой
- [ ] PRODUCT_BACKLOG: E1 статус 🟡 analytics done → ⬜ implementation или 🔴 deferred
- [ ] Пересмотренный порядок PR (волна A) с учётом баланса

**Проверка:** ревью human.

**Зависимости:** E1-R2 · **Объём:** S (Doc)

---

### Checkpoint E1-R

- [ ] Нет старта миграций E1 до go
- [ ] Понятно, какие шаблоны и victory goals пересчитать

---

## Фаза 2 — A0 расширение (после α, P1–P2)

### Task 2.1: `GET /api/admin/metrics/summary` + KPI на `#/admin`

**Описание:** Агрегаты для ops: регистрации, старты игр, win/loss, воронка онбординга (brief_done/skip). Read-only, allowlist.

**Критерии приёмки:**
- [ ] Эндпоинт + тест с mock DB или фикстурой
- [ ] Карточки на Watchtower без лишнего PII

**Зависимости:** Checkpoint 0 желателен · **Объём:** M

---

### Task 2.2: Profile inspector (A3)

**Описание:** По user/profile id: период, cash, последние period closes, achievements, полисы — для разбора багов с плейтеста.

**Критерии приёмки:**
- [ ] UI `#/admin` → поиск → детальная read-only карточка
- [ ] Только `ADMIN_USER_IDS`

**Зависимости:** 2.1 опционально · **Объём:** M

---

### Task 2.3: `SPEC_admin-and-notifications.md`

**Описание:** Норматив Phase 1–2 (inbox, draft/publish) или явные non-goals до MVP 1.3.

**Критерии приёмки:**
- [ ] Spec draft/approved; ссылка из PRODUCT_BACKLOG

**Зависимости:** нет · **Объём:** S (Doc)

---

## Фаза T1 — Turn-based период (отложено)

**Не в спринт май 2026.** Эпик в беклоге для трассировки; старт после α и решения по таймеру из отчёта 0.3.

| ID | Задача (кратко) | Когда |
|----|-----------------|--------|
| T1-1 | BE: `sync_time` не двигает `period_index` | После α |
| T1-2 | FE: hero H2, убрать countdown/auto-next | После T1-1 |
| T1-3 | Doc + PW1 checklist под turn-based | После T1-2 |

См. [`turn-based-period-no-timer.md`](../vision/ideas/turn-based-period-no-timer.md).

---

## Порядок выполнения (рекомендуемый)

```
0.1 → 0.2 → [1.1 ‖ 1.3 ‖ 1.6] → 1.2, 1.4 → 1.5 → 0.3
[E1-R1 → E1-R2 → E1-R3]  // параллельно с 1.x, не блокирует α
2.x — после 0.3
T1 — по отдельному решению
```

---

## Журнал плана

| Дата | Запись |
|------|--------|
| 2026-05-26 | План создан; E1 → E1-R; T1 отложен; I1 разбит на A/B |
