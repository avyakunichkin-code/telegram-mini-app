---
layer: audits
kind: qa
status: draft
last_reviewed: 2026-09-07
audience: qa, engineering, agents
doc_type: audit
verdict: DRAFT
supersedes:
source: code + tests review 2026-09-07 (не live-плейтест в этой сессии)
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/qa
  - tvoy-hod/status/draft
aliases:
  - "QA-аудит механик"
  - AUDIT_qa_mechanics_2026-09-07
---
# QA-аудит: ТВОЙ ХОД (механики и системы)

**Kind:** `qa` · **Дата снимка:** 2026-09-07 · **Verdict:** DRAFT (не канон, не ADR).

Канон адреса: [`../README.md`](../README.md). Kind: [`README.md`](README.md). Шаблон: [`../../templates/AUDIT.md`](../../templates/AUDIT.md).

Смежные снимки того же дня: продукт [`../product/2026-09-07-product-game-design.md`](../product/2026-09-07-product-game-design.md), архитектура [`../engineering/2026-09-07-architecture.md`](../engineering/2026-09-07-architecture.md). **Не дублировать** GD-выводы (длина кампании, FTUE, монетизация): здесь только «можно ли сломать / воспроизвести / покрыть тестом».

Это **не** Unity/Unreal. Пошаговая экономика FastAPI + React PWA. «AI» = picker событий (RNG), guidance O2/O3, headless-политики баланса. Combat-AI нет.

При конфликте: **код + тесты** → spec → `SPEC_PRODUCT.md` → vision. Аудит ниже vision.

---

## Сводка

- **Объект:** TB1 core loop (зарплата → события → «Закрыть месяц» → `process_period_end`), деньги, поражение, Victory v2, события YAML, PWA-клиент, CI.
- **QA-зрелость: 6 / 10.** Доменные pytest (пирамида G1–G4, ~380 collected) — сильный якорь. **Дыры:** нет concurrent-тестов на close/choose/salary, клиент не шлёт `Idempotency-Key`, pytest **не** в PR CI, живой RNG событий без seed в логах.
- **Находки:** 🔴 **5** · 🟡 **12** · 🟢 **8**
- **Главный QA-риск:** два параллельных денежных POST закрывают два месяца или дважды применяют эффект выбора; UI защищает только одну вкладку.

### Топ-3 самых рискованных бага

**1. Двойное закрытие месяца (`POST /api/game/time/next`) — 🔴 C1**

Шаги:

1. Авторизоваться, открыть активную партию, период N, cash > 0.
2. Отправить **два параллельных** `POST /api/game/time/next` с одним JWT (вторая вкладка, curl + UI, retry сети). `Idempotency-Key` нет, `FOR UPDATE` нет.
3. Наблюдать `period_index` и cash.

Ожидание: второй запрос — no-op / 409 «период N уже закрыт».  
Факт: оба вызывают `process_period_end` → два инкремента, двойной burn/долги, пропуск визуального месяца и спавна событий.

Быстрая проверка: см. чек-лист C1.

**2. Legacy `POST /api/game/period/complete-period` без экономики — 🔴 C2**

Шаги:

1. JWT активной партии, период N, cash 15k, burn > 0.
2. `POST /api/game/period/complete-period` (FE **не** вызывает; эндпоинт публичный).
3. Сравнить cash и `period_index` с `POST /api/game/time/next`.

Ожидание: 410 Gone / тот же пайплайн, что `time/next`.  
Факт: `period_index += 1` без burn, долгов, needs, поражения, expire/spawn событий (`services/period/complete.py`). Читерский скип месяца.

**3. Гонка `POST /api/game/events/{id}/choose` — 🔴 C4**

Шаги:

1. Pending-событие с `cash_delta < 0`, на счёте хватает **ровно на один** выбор.
2. Два параллельных POST с одним `choice_id` до первого `commit`.
3. Смотреть транзакции `event_cash` и `EventInstance.status`.

Ожидание: один apply, второй 404 «already resolved».  
Факт: фильтр `status == pending` без row-lock; оба могут списать cash / выдать актив / закрыть цепочку дважды.

---

## Источники и пробелы

**Читали:** `game/period.py`, `services/game/time.py`, `services/period/{salary,complete}.py`, `services/events/service.py` (`choose_event`, `expire_pending_events_for_closed_period`), `idempotency.py`, `database.get_db`, `finance/period_close_preview.py`, `routers/period_actions.py`, `hooks/useGame.js`, `api/client.js`, `DashboardPremium.jsx`, `.github/workflows/`, `backend/tests/README.md`, `test_period_event_pool_failure.py`, `PRE_ALPHA_PLAYTEST_FEEDBACK.md` (α-FB-17/19).

**Не выдумывать (нет данных в этой сессии):**

- Live-прогон двойного `time/next` на Render (вывод по коду).
- p95 latency, фактический retry браузера.
- Повторный balance-playtest после DL1; baseline 2026-05-29 может быть устаревшим.
- Скрин α-FB-19 от автора (статус ⬜ в плейтесте).
- Покрытие строк coverage.xml.

---

## По категориям

### Game Systems

#### 🔴 C1 — Двойной `POST /time/next` закрывает два месяца

| | |
|--|--|
| Где | `services/game/time.py` `go_to_next_period`; `game/period.py` `process_period_end` всегда `period_index += 1` + `commit`; FE `periodEndInFlightRef` только в одном табе |
| Критичность | Потеря прогресса, двойной burn, пропуск событий |
| Приоритет | P0, до внешней волны плейтеста |

**Шаги:** см. Топ-3 #1. Вариант UI: медленный ответ Render → игрок жмёт «Закрыть месяц» во второй вкладке.

**Ожидание vs факт:** идемпотентное закрытие периода N vs два полных close.

**Чек-лист (3–5):**

1. Два параллельных curl `time/next` → `period_index` вырос на **1**, не на 2.
2. Cash-дельта = один burn+долги, не два.
3. В БД один набор транзакций закрытия на closed_period_index.
4. UI: две вкладки, обе жмут close → одна ошибка/no-op, одна сводка.
5. После фикса: тест concurrent close в `tests/integration/api/`.

---

#### 🔴 C2 — `/complete-period` двигает месяц без `process_period_end`

| | |
|--|--|
| Где | `routers/period_actions.py` + `services/period/complete.py` |
| Приоритет | P0 (выключить эндпоинт) |

**Шаги:** см. Топ-3 #2. Повтор N раз = N месяцев без lifestyle.

**Ожидание vs факт:** один канонический close vs два несовместимых пайплайна. Pytest на `/complete-period` **нет**.

**Чек-лист:**

1. OpenAPI/роут ещё отвечает 200 (не 410).
2. После вызова cash не уменьшился на burn, `period_index` +1.
3. Pending-события периода N **не** expired (expire только в основном пайплайне).
4. FE `api.js` не содержит `complete-period` (сейчас так — регресс, если вернут).
5. После фикса: контракт-тест 410 или redirect на тот же инвариант, что `time/next`.

---

#### 🟡 M1 — Необязательные события можно скипнуть закрытием месяца

| | |
|--|--|
| Где | `go_to_next_period` блокирует только `pending_mandatory_blocking_event_titles`; `expire_pending_events_for_closed_period` → `expired` |
| Приоритет | P1 уточнить vs spec «2 события/период» |

**Шаги:** получить 2 pending без `mandatory`; не выбирать; «Закрыть месяц».

**Ожидание (продукт TB1):** игрок **видит и решает** 2 карточки.  
**Факт:** close проходит, инстансы expired, needs decay всё равно идёт.

**Чек-лист:**

1. Close без выбора → 200, события `expired`.
2. Mandatory pending → 400 с русским текстом про обязательные.
3. Следующий период: новые 2 pending (если пул жив).
4. Зафиксировать в spec: skip разрешён или close disabled пока pending > 0.
5. Acceptance: «месяц без ответа по карточкам».

---

#### 🟡 M2 — Падение пула событий не откатывает close

| | |
|--|--|
| Где | `period.py` ~627–637 `except Exception` + лог ERROR |
| Приоритет | P1 наблюдаемость + алерт; игрок видит пустой месяц |

**Шаги:** смоделировано в `test_period_event_pool_failure.py` (это **задокументированное** поведение, не молчаливый pass).

**Ожидание игрока:** в новом месяце 2 карточки.  
**Факт:** месяц закрыт, `period_index` +1, pending может быть 0. QA: silent empty month.

**Чек-лист:**

1. Pytest pool boom → close ок, лог с `exc_info`.
2. Ручной: после close `GET /events/pending` не пустой (sanity билда).
3. Watchtower/логи Render: нет `Period event pool failed`.
4. Нет второго close «вслепую», если pending=0 и это не задумано.
5. После фикса: флаг в period_close «events_spawn_failed».

---

#### 🟡 M4 — Два поражения в одном close: cash побеждает needs

| | |
|--|--|
| Где | `process_period_end`: cash streak ≥ 3 → `is_active=0`; needs GO только если профиль ещё активен |
| Приоритет | P2 аналитика / финал |

**Шаги:** подогнать cash < 0 три месяца **и** все needs = 0 три периода к одному close.

**Ожидание:** либо оба reason в payload, либо приоритет задокументирован.  
**Факт:** `defeat_reason = cash_negative_streak`, needs не пишется.

**Чек-лист:**

1. Фикстура dual-GO → один reason, `is_active=0`.
2. Finale UI показывает этот reason.
3. Новая партия стартует (не вечный 404).
4. Документ поражения: порядок проверок.
5. Метрика Watchtower не теряет needs-GO.

---

#### 🟢 m2 — Устаревшие комментарии про XP

`salary.py` и `period.py` всё ещё упоминают XP при закрытии. Путает QA при разборе логов. Приоритет P3, правка комментариев.

**Чек-лист:** grep `XP` в `period.py` / `salary.py` = 0 или «legacy removed».

---

#### 🟢 m7 — Повтор зарплаты = 200 `already_claimed`, не 409

Последовательно это **корректная** идемпотентность (`test_double_claim_salary_idempotent_finite`). Путает контракт «повтор → ошибка» в skill G2.

**Чек-лист:** FE трактует `already_claimed` как info, не как crash; документация API совпадает с 200.

---

### AI (picker / guidance / симы)

#### 🟡 M5 — Живой RNG событий плохо воспроизводится

| | |
|--|--|
| Где | `_weighted_sample_without_replacement` (`-ln(U)/weight`); balance sim seed 42; live без seed в ответе/логах |
| Приоритет | P1 для баг-репортов контента |

**Шаги:** два одинаковых старта шаблона → разные `definition_key` на P1.

**Ожидание QA:** по `profile_id` + period восстановить, какие ключи выпали.  
**Факт:** без записи в `notification_log` / admin inspector ключи надо копать в `event_instances`.

**Чек-лист:**

1. После ensure: в БД 2 instance на period.
2. Admin/Watchtower показывает keys.
3. Headless `tutorial`/`safety_first` seed 42 стабилен локально.
4. Баг «не та карточка» всегда с `definition_key` + `period_index`.
5. Не сравнивать live-каталог с baseline 2026-05-29 без нового sim.

---

#### 🟡 M6 — Guidance/admin notify глотают исключения после choose/close

`choose_event`: `on_event_chosen` / `notify_event_chosen` в `except: pass`. Close: admin notify → warning. Игрок не видит сбой O2.

**Чек-лист:** ломаный guidance не откатывает choose; полоска O2 либо есть, либо явное отсутствие; лог не пустой при fail.

---

#### 🟢 m3 — Сид сима ≠ прод

Политики ботов и seed 42 не моделируют двойной клик и пустой пул. Не баг, ограничение воспроизводимости баланса.

---

### Economy

#### 🔴 C3 — Гонка `POST /claim-salary` (двойная выплата)

| | |
|--|--|
| Где | `services/period/salary.py`: check `already_claimed` → `adjust_balance` → commit; **нет** `Idempotency-Key` на роуте; нет `FOR UPDATE` |
| Приоритет | P0 |

**Шаги:** два параллельных `POST /api/game/period/claim-salary`. UI: `setBusyAction` после клика, но **две вкладки** или гонка до setState.

**Ожидание:** вторая выплата no-op, cash +1× salary.  
**Факт:** оба проходят check до commit → +2× salary. Последовательный повтор закрыт тестом.

**Чек-лист:**

1. Parallel curl → одна транзакция `salary`, cash +1×.
2. Две вкладки, обе жмут «Зарплата».
3. Последовательный повтор → `already_claimed: true`, баланс тот же.
4. После close месяца claim снова доступен один раз.
5. Тест concurrent claim (сейчас нет).

---

#### 🟡 M3 — Клиент никогда не шлёт `Idempotency-Key`

`frontend-react/src/api/client.js` не ставит заголовок. Даже contribute/withdraw/treat-self/invest на бэке идемпотентны **только если** ключ пришёл. Две вкладки = двойной перевод в подушку.

**Чек-лист:** DevTools → POST contribute **без** `Idempotency-Key`; две вкладки перевод 1000 → cash −1000 не −2000; после фикса заголовок UUID на денежные POST.

---

#### 🟡 M7 — Подушка не оплачивает burn (инвариант «невозможного» состояния)

Продуктовый C1: игрок переводит cash в safety, close списывает burn **только с cash**, streak → GO. Для QA это **валидный смертельный сценарий**, не «игрок вне карты».

**Шаги:** claim salary → contribute почти всё в подушку → close. Повторять до `negative_periods_count >= 3`.

**Ожидание игрока:** подушка страхует месяц.  
**Факт:** GO при полном safety. Превью close должно показывать отрицательный cash.

**Чек-лист:**

1. Preview `estimate_period_close_preview` cash после close < 0 при большой подушке.
2. Три таких close → `game_over`, `cash_negative_streak`.
3. Safety не уменьшается от burn.
4. Сообщение UI не говорит «подушка спасёт».
5. Не путать с багом движка, пока spec не изменит правило.

---

#### 🟡 M8 — Ошибка расчёта страховых премий в preview → 0

`period_close_preview._estimate_insurance_premiums`: `except Exception: return 0.0`. Preview занижает списание vs факт close.

**Чек-лист:** полис активен → preview insurance > 0; сломанный полис не обнуляет остальные статьи без лога; сверка preview vs `period_close.breakdown`.

---

#### 🟢 m4 — Preview поражения `neg_streak >= 2` vs движок `>= 3`

Это **корректный** прогноз «этот close станет третьим минусом», не off-by-one. Риск — копирайт «два месяца» vs «три». Сверить тексты UI и тест `test_period_close_preview.py`.

---

#### 🟢 m5 — Промежуточный `float` при деньгах

`adjust_balance` + quantize 0.01 на записи. Длинная партия: копейки. Property-lite тесты есть; стресс 60 close с дробными купонами — руками/sim.

---

### UI

#### 🟡 M9 — Модалка событий vs nav (α-FB-19)

Плейтест ⬜ «нужен скрин». Классика TMA/PWA: overlay + bottom nav.

**Шаги (гипотеза):** pending overlay открыт → тап по вкладке «Капитал» / safe-area iOS.

**Ожидание:** scrim режет nav или nav скрыт.  
**Факт:** пересечение (не подтверждено в этой сессии).

**Чек-лист:** overlay открыт — nav не кликается; close overlay → nav ок; узкий 390×844 и desktop; нет двойного scroll.

---

#### 🟡 M10 — Онбординг прыгает (α-FB-17)

O2 в prod без scrim; статус «проверить на PA-T2». Layout shift = ложные тапы close/salary.

**Чек-лист:** P1 guidance без CLS; refresh во время strip; нет overlap с «Закрыть месяц»; PWA standalone.

---

#### 🟢 m1 — Смесь RU/EN в 400

`choice_id is required` vs «Сначала примите решение…» vs `Event not found or already resolved`. Игрок 30+ видит сырой ключ.

**Чек-лист:** все 4xx close/choose/salary — человекочитаемый RU; FE показывает `detail`, не stack.

---

#### 🟢 m8 — Close disabled при `syncing`

Защита от гонки UI. На медленной сети кнопка «мертвая» без пояснения = ложный баг «нельзя закрыть месяц».

**Чек-лист:** есть spinner/текст «синхронизация»; после ошибки кнопка снова active; `periodEndInFlightRef` сбрасывается в `finally` (сейчас да).

---

### Network / process

#### 🔴 C5 — Pytest/vitest не в PR CI

Workflows: `deploy-app.yml` (Pages), `skills-check.yml`. Регресс экономики может уехать в Pages/prod без красного gate.

**Ожидание:** merge/deploy после зелёного `pytest -q` + FE `test:unit`.  
**Факт:** локальный gate, не обязательный.

**Чек-лист:** PR без тестов всё равно зелёный; `period.py` можно сломать без CI; после фикса required check; Pages после тестов.

---

#### 🟡 M11 — Нет timeout/retry-политики на клиенте; retry = второй mutate

`fetch` без AbortSignal. Браузер/прокси повторяет POST → C1/C3/C4.

**Чек-лист:** DevTools Offline mid-POST; повтор не удваивает; timeout → понятная ошибка, не второй close.

---

#### 🟡 M12 — После GO часть API даёт 404 «нет активного профиля»

`get_active_game_profile` не создаёт новую партию, если есть мёртвый профиль. Bootstrap/`resolve_game_session` умеет `defeated`. Смешение клиентов/старых закладок → «пропал прогресс».

**Чек-лист:** GO → finale, не белый экран; повторный `time/next` 404 или явный game_over; «Новая игра» создаёт профиль; не вызывать `get_active_game_profile` на финале без ветки defeated.

---

#### 🟢 m6 — `get_db` без явного `rollback`

`finally: db.close()` — SQLAlchemy откатит незакоммиченное. Choose коммитит только в конце — частичный enqueue при 400 обычно безопасен. Слабая testability транзакций: нет явного контракта.

**Чек-лист:** 400 на choose при нехватке cash → нет `enqueue` в БД; нет полуприменённого insurance+fail cash.

---

## Рекомендации по тест-стратегии

### Автотесты в первую очередь (дополить пирамиду)

Порядок — по риску потери денег/прогресса. Слой: `tests/integration/api/` + один unit на lock-инвариант.

1. **Concurrent `POST /time/next`** — два клиента, один `period_index` шаг, один набор close-транзакций. Сейчас **нет**.
2. **Concurrent `choose`** на одном pending — один `selected`, cash один раз.
3. **Concurrent `claim-salary`** — cash +1×; существующий sequential `already_claimed` оставить.
4. **`/complete-period`** → 410 или тот же инвариант, что `time/next` (сейчас дыра).
5. **Close при mandatory pending** → 400, индекс не растёт (если ещё нет).
6. **GO затем денежный POST** — 404/409, не вторая экономика.
7. **Preview vs факт close** с активной страховкой (ловить M8).
8. FE: денежные POST ставят `Idempotency-Key`; vitest на `client.js`.

Не заменять это headless balance-playtest: sim не кликает дважды.

CI: required `pytest -q` + `npm run test:unit` на PR (пересечение с engineering C про CI).

### Ручные чек-листы перед каждым билдом (smoke 15 мин)

1. Старт шаблона студента → зарплата **1×** → две карточки → close **1×** → сводка burn видна.
2. Подушка round-trip: contribute → withdraw → cash сходится с UI.
3. Close **без** зарплаты → warn modal → confirm → нет выплаты за месяц.
4. Две вкладки: close / salary — нет двойного месяца и двойной зарплаты.
5. Довести до GO (подушка+burn или чит-касса) → finale, не вечный 404; новая партия.
6. PWA: lock/unlock телефона на экране события (PW1).
7. Pending overlay vs нижняя навигация (α-FB-19).

### Sanity после правок (где именно)

| Трогали | Обязательный sanity |
|---------|---------------------|
| `game/period.py`, `time.py`, snapshot | `pytest -q -k "period or time_next"` + ручной 1 close |
| `events/service.py`, YAML | `pytest -q -k event` + 1 choose + pending после close |
| `salary.py`, safety, invest, insurance | property-lite cash finite + 1 вкладка + 2 вкладки |
| Victory / overview | `test_overview_victory_contract` + UI целей |
| MQX overlay/nav/guidance | ручной α-FB-17/19, не только скрин |
| CI / deploy | зелёный pytest на том же SHA, что Pages |

Регрессия баланса чисел: `/balance-playtest` + diff baseline — **не** замена concurrent-тестов.

---

## План (для backlog, не spec)

| Фаза | Выход | Verify |
|------|--------|--------|
| P0 | Lock или серверный ключ close; 410 `/complete-period`; concurrent-тесты close/salary/choose; CI pytest | Два curl не двигают два месяца |
| P1 | FE `Idempotency-Key`; лог/payload spawn fail; spec skip-событий | Две вкладки подушка; pending после close |
| P2 | Dual-GO reason; preview insurance; RU 4xx; timeout fetch | Фикстуры + UI copy |
| P3 | XP-комментарии; явный rollback; seed в admin inspector | grep + док |

---

## Метрики готовности QA

| Метрика | Сейчас | Таргет | Как мерить |
|---------|--------|--------|------------|
| Concurrent-тесты close/choose/salary | нет | 3 теста green | pytest -k concurrent |
| Pytest в PR CI | нет | required | GitHub Checks |
| Идемпотентность с FE | заголовок не шлётся | все денежные POST | DevTools |
| `/complete-period` | 200, другой пайплайн | 410 или unified | TestClient |
| Воспроизведение события live | instance в БД, RNG без seed в API | key в логе/админке | Watchtower |
| α-FB-19 | ⬜ | закрыт скрином | плейтест |

---

## Не делаем (в этом снимке)

- Менять правило «burn только с cash» — продуктовый аудит C1; здесь только сценарий GO.
- Писать фиксы и concurrent-тесты в том же PR, пока человек не утвердил P0.
- UX-канон lab↔prod — kind `ux`.
- Каталог YAML gaps — `/event-analysis`, kind `content`.
- Security Argon2 / `SECRET_KEY` — engineering architecture; QA отмечает только как риск аккаунта, не как механику месяца.
- Выдавать live D1/D7 или новый balance JSON.

---

## Связь с другими аудитами 2026-09-07

| Kind | Что пересекается |
|------|------------------|
| engineering | CI, lock `/time/next`, SHA-256, `/complete-period` (M20), preview streak |
| product | Подушка vs burn, длина кампании, FTUE — не баги движка, пока нет нового spec |
