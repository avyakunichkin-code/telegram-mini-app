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
| 1 | **T1 / TB1** — ✅ реализован 2026-05-26; follow-up **TB1.1** (чипы плана) — backlog |
| 2 | **I1** — два явных трека: покупка/каталог и выплата (claim); см. фазу 1 ниже |
| 3 | **E1** — **пауза реализации**; сначала повторная аналитика (фаза E1-R) |
| 4 | Обновить [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md): T1, «В работу сейчас», статус E1 |

---

## Фаза 0 — Pre-Alpha gate (P0)

### Task 0.1: Синхронизация документации M11 и cooldown

**Описание:** В [`GAME.md`](../../GAME.md) §0.2 и связанных doc всё ещё может фигурировать «cooldown не реализован» и незакрытая приёмка M11. Привести GAME, [`MVP_AUDIT_VS_SPEC.md`](../foundation/MVP_AUDIT_VS_SPEC.md) и [`TRACEABILITY.md`](../TRACEABILITY.md) в соответствие с кодом (`game_rules`, миграция 0007, `test_mq116_acceptance.py`).

**Критерии приёмки:**
- [x] GAME.md §0.2: cooldown ✅, M11 ✅, достижения 🟡, ссылка на PRODUCT_BACKLOG
- [x] TRACEABILITY: эпик M11 / MQ-116 — implemented (или эквивалентный статус)
- [x] MVP_AUDIT: пункты tier/cooldown/repeat отмечены с отсылкой к тестам

**Проверка:** ревью diff только в `docs/`; `pytest -q backend/tests/test_mq116_acceptance.py` (регрессия).

**Статус:** ✅ выполнено 2026-05-26.

**Зависимости:** нет · **Объём:** S (Doc)

---

### Task 0.2: PW1-004 — прогон checklist resume (A–C, TB1)

**Описание:** Ручной QA по [`PW1_RESUME_PLAYTEST_CHECKLIST.md`](../foundation/PW1_RESUME_PLAYTEST_CHECKLIST.md) (TB1: без таймера). Автопроверка §0a + **2 прогона в Telegram TMA** (iOS + Android).

**Критерии приёмки:**
- [x] Чеклист обновлён под TB1; §0a автотесты PASS (2026-05-26)
- [ ] Таблица: **2 TMA-прогона**, commit/URL заполнены
- [ ] Сценарии **A–C** PASS на обоих (D = N/A)
- [ ] Итог §2: PASS / FAIL / PASS с оговорками

**Проверка:** `npm run test:utils` в `frontend-react`; колонки «Прогон 1/2» в checklist.

**Зависимости:** нет · **Объём:** S (QA) + ~15 мин ручной TMA

**Статус:** 🟡 частично — автопроверка ✅; ожидает 2× TMA.

---

### Task 0.3: Пилот Pre-Alpha (10–20 игроков)

**Статус:** 🟡 **PA-W1-2026-06** — ops готов; ждём деплой pin + URL опроса/фидбека + рассылку. См. [`PRE_ALPHA_WAVE1_OPS.md`](../foundation/PRE_ALPHA_WAVE1_OPS.md) §«3 шага».

**Критерии приёмки:**
- [ ] 10–20 участников, явное предупреждение «сырая версия»
- [ ] Сводка в [`PRE_ALPHA_WAVE1_RESULTS.md`](../foundation/PRE_ALPHA_WAVE1_RESULTS.md): % до периода 3–4, топ-3 боли, P0/P1
- [ ] Решение go / no-go (PA-G1…G3)

**Проверка:** таблица ответов + retro 30 мин.

**Зависимости:** deploy prod · **Объём:** M (Product)

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

**Файлы:** `backend/app/routers/` achievements, `test_achievements/engine.py`, `api/game.js`

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

**Статус:** ✅ 2026-06-01 — `InsuranceSection` + locked accordion (`MqxCapitalMechanicLocked`), ApiError в тостах.

**Критерии приёмки:**
- [x] При `capital_insurance` unlocked — покупка и отмена полиса работают end-to-end
- [x] При locked — подсказка из целей победы (без XP)
- [x] UI MQX-паттерн аккордеона
- [x] Премия в period end / overview (prod)

---

### Task 1.4: I1-B — Выплата по полису (claim) и связка с событиями

**Статус:** ✅ 2026-06-01 — тост в `GameScreen`, preview `insurance_payout`, pytest claim/buy/cancel.

**Критерии приёмки:**
- [x] Событие с `insurance_claim` + полис → cash + деактивация; без полиса → 400
- [x] `payout_amount` из каталога
- [x] UI: тост после выбора
- [x] `pytest`: settle + apply + choose API + buy flow

---

### Task 1.5: PW1-104 — PWA на prod (CORS + env)

**Описание:** После PASS 0.2: разрешить origin установленной PWA, прописать `VITE_API_BASE_URL` в CI/CD, проверить install → login → игра.

**Критерии приёмки:**
- [x] API с prod PWA origin без CORS-ошибок
- [x] [`PWA_INSTALL.md`](../foundation/PWA_INSTALL.md) актуален (URL, env)

**Проверка:** установка PWA + один полный период.

**Зависимости:** 0.2 PASS · **Объём:** S (Ops + Backend config)

**Статус:** ✅ выполнено 2026-06-01 — prod PWA на iPhone (Safari → «На экран Домой»), игра работает; CI: `.github/workflows/deploy-app.yml` (`vars.VITE_API_BASE_URL` + fallback Render).

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

- [x] «Развитие» открывается и наполняется из API — ⏸ M12 out of α
- [x] Страховки: купить + claim на событии (I1-A/B, 2026-06-01)
- [x] PWA prod не ломает API (PW1-104, 2026-06-01)

---

## Трек CN1 — Потребности персонажа (Z‑NEEDS) (P1–P2)

> Документы: spec [`SPEC_game-character-needs`](../specs/features/SPEC_game-character-needs.md) · ADR-005/006 (`docs/decisions/`) · UX master [`CHARACTER_NEEDS_UX`](../ux/CHARACTER_NEEDS_UX.md).

### Task CN1-001: Каноничный one-pager правил needs

**Описание:** собрать в один короткий документ “правило игры” для needs (decay, пороги, поражение, treat-self, связь с событиями) — чтобы проверять детали без прыжков между ADR/spec/UX.

**Смотреть:**  
- ADR-005: [`ADR-005-character-needs-state-and-defeat.md`](../decisions/ADR-005-character-needs-state-and-defeat.md)  
- ADR-006: [`ADR-006-treat-self-options-and-cooldown.md`](../decisions/ADR-006-treat-self-options-and-cooldown.md)  
- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md)

**Критерии приёмки:**
- [ ] 1–2 страницы: правила + числа (где playtest) + “что считается поражением”
- [ ] Ссылки на исходные ADR/spec/UX

---

### Task CN1-010: Контент treat-self (3–4 опции на персонажа)

**Описание:** расширить `blueprint_json.needs.treat_self.options[]` до 3–4 вариантов на персонажа (разные акценты по осям), чтобы sheet выбора имел смысл.

**Смотреть:**  
- ADR-006: варианты, кулдаун, стоимость  
- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md) раздел «Порадовать себя»

**Критерии приёмки:**
- [ ] На каждом шаблоне game needs: `options.length >= 3` (или чётко зафиксировать исключения)
- [ ] У каждой опции: `id`, `title`, `needs_delta`, cost-правила (как в ADR/spec)

---

### Task CN1-011: Rescue-события и проверка `rescue_event_bias`

**Описание:** добавить/настроить 1–2 “rescue” события, которые поднимают needs с денежным trade-off, и проверить, что `player_support.rescue_event_bias` реально влияет на выборку.

**Смотреть:**  
- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md) (контент/события/needs_delta)  
- UX: [`character-needs-events.md`](../ux/screens/character-needs-events.md)

**Критерии приёмки:**
- [ ] Есть 1–2 rescue-события, которые **поднимают needs** и имеют понятный trade-off по cash/обязательствам
- [ ] Проверка bias: в плейтесте/скрипте видно отличие частоты выпадения rescue-событий при разных `rescue_event_bias`

---

### Task CN1-012: Поддержать `needs_delta` в effects событий (контракт + применение)

**Описание:** зафиксировать и реализовать поддержку `needs_delta` как эффекта события: whitelist, валидация и применение на `choose`, чтобы UI мог честно показывать чипы до выбора.

**Смотреть:**  
- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md) раздел «События: влияние на потребности (`needs_delta`)»  
- UX spec: [`character-needs-events.md`](../ux/screens/character-needs-events.md)  
- Кодовые точки (для реализации, когда дойдём): `backend/app/routers/events.py` (allowed effects + choose), `backend/app/events/choice_impacts.py` (preview), `backend/app/needs/engine.py` (clamp/set)

**Критерии приёмки:**
- [ ] `needs_delta` разрешён/валидируется и применяется на `choose`
- [ ] Контентные события с `needs_delta` есть в каталоге
- [ ] UI показывает чипы по UX-канону и после выбора значения needs совпадают с сервером

---

### Task CN1-020/021: Полировка Z-NEEDS UI и копирайта

**Описание:** привести UI needs к UX-канону: compact/expand, help sheet, treat-self CTA, риск поражения (streak), тексты и тон.

**Смотреть:**  
- UX master: [`CHARACTER_NEEDS_UX.md`](../ux/CHARACTER_NEEDS_UX.md)  
- UX экраны: [`character-needs-dashboard.md`](../ux/screens/character-needs-dashboard.md), [`character-needs-help.md`](../ux/screens/character-needs-help.md), [`character-needs-treat-self.md`](../ux/screens/character-needs-treat-self.md)

**Критерии приёмки:**
- [ ] На главной: compact Z‑NEEDS + раскрытие в 4 бара
- [ ] Help sheet доступен всегда; treat-self корректно disabled на cooldown
- [ ] Copy соответствует UX-решениям (без обвиняющего тона)

---

### Task CN1-022: Предупреждения периода и поражение по needs (UI)

**Описание:** предупреждение перед “Закрыть месяц” при distressed/zero-streak и корректный экран поражения `needs_depletion`.

**Смотреть:**  
- UX spec: [`character-needs-period-defeat.md`](../ux/screens/character-needs-period-defeat.md)

**Критерии приёмки:**
- [ ] Warning modal при триггерах (distressed / zero streak)
- [ ] При `needs_depletion` показывается defeat UI, не обычный успех

---

### Task CN1-030: Баланс decay/штрафов (playtest 10–15 периодов)

**Описание:** плейтест и подбор параметров (`periods_to_empty_target`, штрафы distressed по профилям soft/standard/hard), зафиксировать выводы.

**Смотреть:**  
- ADR-005: decay и поражение  
- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md) (assumptions + open questions)

**Критерии приёмки:**
- [ ] Короткий отчёт с цифрами и решением “какие значения оставляем”

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

## Фаза T1 — Turn-based период (✅ TB1, 2026-05-26)

| ID | Задача | Статус |
|----|--------|--------|
| T1-1 | BE: `sync_time` не двигает `period_index` | ✅ |
| T1-2 | FE: hero H2, «Закрыть месяц» | ✅ |
| T1-3 | Doc + PW1 checklist | ✅ |
| TB1.1 | Чипы плана месяца в hero | backlog |

См. [`PLAN_turn-based-period-no-timer.md`](PLAN_turn-based-period-no-timer.md), [`turn-based-period-no-timer.md`](../vision/ideas/turn-based-period-no-timer.md).

---

## Порядок выполнения (рекомендуемый)

```
0.1 → 0.2 → [1.1 ‖ 1.3 ‖ 1.6] → 1.2, 1.4 → 1.5 → 0.3
[E1-R1 → E1-R2 → E1-R3]  // параллельно с 1.x, не блокирует α
2.x — после 0.3
TB1.1 — чипы плана (опционально после α)
```

---

## Журнал плана

| Дата | Запись |
|------|--------|
| 2026-05-26 | TB1 (T1) implemented в prod + docs |
| 2026-05-26 | План создан; E1 → E1-R; T1 отложен → позже закрыт TB1; I1 разбит на A/B |
| 2026-06-01 | Task 1.5 PW1-104 PASS — PWA prod Safari iOS, CI env |
| 2026-06-01 | Pre-Alpha PA-W1-2026-06 — ops-лист, smoke, RESULTS template |
