---
layer: plan
epic_id: M1.2
phase: define
status: draft
owner: product
last_reviewed: 2026-09-07
spec:
idea: ../vision/ideas/post-playtest-wave1-two-directions.md
related:
  - ../audits/product/2026-09-07-product-game-design.md
  - ../audits/engineering/2026-09-07-architecture.md
  - ../audits/qa/2026-09-07-mechanics.md
  - ../audits/ux/2026-09-07-player-surface.md
  - ../audits/liveops/2026-09-07-community.md
  - ../audits/ai/2026-09-07-runtime-and-dev-ai.md
  - ../audits/ai/2026-09-07-ai-proposals.md
  - ../plans/PLAN_PLT.md
  - ../decisions/ADR-013-game-only-drop-plan-mode.md
  - ../plans/PLAN_game-only.md
traceability: ../TRACEABILITY.md
next_skill: incremental-implementation
verdict: DRAFT
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/draft
aliases:
  - "Сводный план production-ready"
  - PLAN_production-ready
  - "Объединённый план: аудиты + Game-only"
---
# Сводный план доработки: ТВОЙ ХОД

**Эпики:** `M1.2` (Game для своих) + `GO` (только Game, [ADR-013](../decisions/ADR-013-game-only-drop-plan-mode.md)) · **Статус:** DRAFT — не канон, пока человек не сказал APPROVED.  
**Источники аудитов (DRAFT, 2026-09-07):** [продукт](../audits/product/2026-09-07-product-game-design.md) · [архитектура](../audits/engineering/2026-09-07-architecture.md) · [QA](../audits/qa/2026-09-07-mechanics.md) · [UX](../audits/ux/2026-09-07-player-surface.md) · [Live Ops](../audits/liveops/2026-09-07-community.md) · [AI](../audits/ai/2026-09-07-runtime-and-dev-ai.md).  
**Game-only:** idea [`game-only-drop-plan-mode`](../vision/ideas/game-only-drop-plan-mode.md) · детализация срезов [`PLAN_game-only.md`](PLAN_game-only.md) (не второй roadmap).

Это **один** план текущей доработки: синтез **шести** аудитов (product / engineering / qa / ux / liveops / ai) **и** вырезание режима Plan. Не седьмой аудит. Дубли схлопнуты, взята **максимальная** критичность, техдолг связан с эффектом на игрока. RICE: Reach ≈ когорта CA **100** (волна 10–20 = Reach **20** где явно); Impact 3/2/1/0.5; Confidence 0.8/0.5/0.2; Effort в человеко-неделях.

**Не ломать:** TB1 без таймера, два кошелька, сгорание зарплаты, YAML ADR-008, Victory v2, 4 шаблона, этика (нет pay-to-win / CTA советника в α).

**Не делать в этом плане:** advisor CTA, battle pass, daily streak, energy, Discord, лидерборд, E1-редактор «свой бюджет», микросервисы, второй `save_kind`. **M2.0 Plan — cancelled.** Колонку `save_kind` не дропать в α (GO-05 опционален).

---

## Ключевые выводы

- **Главный технический риск:** регрессия экономики уезжает в Pages без pytest, а `POST /time/next` (и choose/salary) без lock закрывает **два хода** или удваивает деньги. Игрок и баланс-sim больше не источник истины.
- **Главный продуктовый риск:** игра учит копить подушку, burn списывается только с `cash` — «правильный» игрок проигрывает; поверх этого кампания 40–60 ходов с повторами карточек и **нулевыми D1/D7**.
- **Что нельзя выпускать без исправления** (gate «можно звать людей / ставить билд»):
  1. Идемпотентный close + 410 `/complete-period` + concurrent-тесты (QA C1/C2/C3/C4, Eng C5/M20).
  2. Required CI: pytest + FE unit **до** Pages (Eng C1/C6, QA C5).
  3. Fail-fast `SECRET_KEY` (Eng C3). Argon2 — до любой базы с реальными паролями (Eng C2).
  4. **Честный close:** превью «со счёта ~N ₽» + chip, что подушка не платит жизнь (Product C1/C4, UX U2, LiveOps предусловие).
  5. Не слать TG «сегодня не закрыл ход» (LiveOps L6).
  6. **Честный старт:** нет плитки Plan / «Скоро»; `plan` не создаётся (ADR-013, GO-01/02).

Волна **10–20 до пунктов 1–4 и 6 = вред репутации**, не ускорение α. Бэклог «PA-W1 = единственный P0» **устарел** этим планом.

---

## Сводка тем (дубли схлопнуты)

Критичность = max по аудитам. ID источников: P=product, E=engineering, Q=qa, U=ux, L=liveops.

| Тема | Max | Откуда | Продуктовое следствие | RICE | Фаза |
|------|-----|--------|------------------------|------|------|
| Гонки close / salary / choose; нет FE Idempotency-Key | 🔴 | Q-C1/C3/C4, E-C5, Q-M3 | Двойной месяц / двойная зарплата → «цифры врут», сломанный плейтест | 100×3×0.9 / 0.6 ≈ **450** | P0 |
| `/complete-period` без экономики | 🔴 | Q-C2 > E-M20 | Читерский скип burn; репутация α | 20×3×0.95 / 0.1 ≈ **570** | P0 |
| Pytest не в CI; Pages без тестов | 🔴 | E-C1/C6, Q-C5 | Сломанный билд у тестеров; нельзя добавлять события спокойно | 100×3×0.9 / 0.4 ≈ **675** | P0 |
| SHA-256 пароли + default SECRET_KEY | 🔴 | E-C2/C3 | Утечка JWT/дампа = чужие партии | 100×3×0.8 / 0.3 ≈ **800** | P0 |
| Три пути схемы БД | 🔴 | E-C4 | Drift staging/prod → «нельзя быстро катить YAML/seeds» | 100×2×0.7 / 1 ≈ **140** | P0 |
| Подушка vs burn + скрытое списание | 🔴 | P-C1/C4, U-U2, L-предусловие; Q-M7 сценарий | GO после «правильной» игры; NPS/D7 | Preview: 100×3×0.8 / 1.2 ≈ **200**; смена правила: 100×3×0.5 / 2 ≈ **75** (нужен spec) | P0 preview / P1 правило |
| Инверсия главной (close сверху, зарплата внизу) | 🔴 | U-U1, P-FTUE/C5 | Уход на 3-й минуте | 100×2×0.7 / 1.5 ≈ **93** | P1 (lab) |
| Кампания 40–60p × 2 карточки | 🔴 | P-C2, L-L1/L5 | Нет mid-game, выгорание, нечего анонсировать | 100×3×0.6 / 3 ≈ **60** | P1 spec+V2-BAL, P2 контент |
| Нет когорт D7; WAVE1 пустой | 🔴 | P-C3, L-L11 | Слепые полёты; фидбек не замкнут | 20×3×0.8 / 1 ≈ **48** (волна) + PLT 100×2×0.7 / 1.5 ≈ **93** | P1 после P0 |
| Player TG daily nag | 🔴 | L-L6 (согласуется с P: не daily) | TB1 «пауза ок» → chore | 100×2×0.8 / 0.1 ≈ **1600** (просто **не включать**) | P0 freeze |
| Стек оверлеев событий | 🟡 | U-U7, Q-M9, α-FB-19 ⬜ | Ложные тапы, BLOCKER если подтвердится | 20×2×0.4 / 1 ≈ **16** | P1 после скрина |
| Event pool fail → пустой месяц | 🔴 | AI-C1 > Q-M2; E закрыл M17 как лог | Игрок: «пропали карточки» | 100×2×0.8 / 0.3 ≈ **533** | **P0-parallel** (PR-14, с close) |
| Skip необязательных событий close | 🟡 | Q-M1 vs spec «2 события» | Контент не доходит; needs-GO | 100×1×0.4 / 0.5 ≈ **80** | P1 **решение spec** |
| Смесь ход/месяц | 🟡 | U-U3, Q-m1 | O3 учит «ход», toast «месяц» | 100×1×0.8 / 0.2 ≈ **400** | P1 copy |
| `period.py` → services.events | 🟡 | E-M1/M7 | Медленный YAML/sim без FastAPI → срыв контент-дропа | 100×1×0.5 / 2 ≈ **25** | P2 |
| Пустой пул / RNG не в логах | 🟡 | Q-M5 | Нельзя воспроизвести «не та карточка» | 50×1×0.5 / 0.5 ≈ **50** | P2 |
| Капитал empty / IA | 🟡 | U-U13, α-FB-06 | «Нечего делать» на 2-й вкладке | 100×1×0.5 / 1 ≈ **50** | P2 |
| Достижения без экрана | 🟡 | L-L2, M12 | Нет социального крючка | 100×0.5×0.4 / 2 ≈ **10** | P3 |
| Health 200 при мёртвой БД | 🟡 | E-M10 | Render не режет инстанс | 100×1×0.7 / 0.1 ≈ **700** | P0 (дешёвый) |
| Плитка «Скоро» / второй save | 🔴 | ADR-013, P-C6, α-FB-14 | Ложный выбор 30+ до шаблонов; FAQ «когда План?» | 100×2×0.8 / 0.4 ≈ **400** | **P1 до WAVE1** (GO-01/02); хвост GO-03…05 в P2 |

---

## Дорожная карта

Зависимости: **целостность денег → честный UI и честный старт (без «Скоро») → люди**. Не параллелить волну 10–20 с гонками close. GO **не** класть в тот же PR, что lock `/time/next`.

```text
P0 integrity + secrets + CI          (PR-01…06, 08, 09; PR-03 ‖ PR-05 ‖ PR-14)
  └── P0 honesty preview               (PR-07; после PR-01)
        └── P1 GO-01/02 без «Скоро»    ‖  lab dashboard + copy (PR-10…12)
              └── P1 WAVE1 (PR-15/16)    вход: P0 + GO-01
                    └── P2 GO-03…04 + victory act 1 + YAML pack
                          └── P3 Season 0 / polish; GO-05 опционально
```

**Параллель безопасно:** GO-01 с P0 (старт vs `period.py`); **PR-03 ‖ PR-14 ‖ PR-05** (разные поверхности). **Не параллелить:** WAVE1 с открытым lock close или с плиткой Plan.

### Фаза 1: Stabilization (P0)

**Вход:** freeze Game-only; нет Plan/CTA/daily TG-4 / battle pass.  
**Выход:** два curl не закрывают два хода; `/complete-period` 410; CI красный ломает merge; close показывает списание со счёта; `SECRET_KEY` без default в prod.

| ID | Задача | Max | Метрики | Зависимости | Skill | Effort |
|----|--------|-----|---------|-------------|-------|--------|
| **PR-01** | Lock + идемпотентность `time/next`; ключ `profile+period` | 🔴 | 0 двойных close в concurrent pytest | — | api + TDD | 0.4 н |
| **PR-02** | Concurrent salary + choose; FE `Idempotency-Key` | 🔴 | cash +1×; один `selected` | PR-01 паттерн | api + TDD | 0.5 н |
| **PR-03** | `POST /complete-period` → 410 | 🔴 | TestClient 410 | — | api + TDD | 0.1 н |
| **PR-14** | Флаг `events_spawn_failed` в close | 🔴 AI-C1 | Игрок/Watchtower видят пустой пул | после/вместе PR-01 (тот же close DTO) | api + TDD | 0.3 н |
| **PR-04** | Required CI pytest + `test:unit`; Pages `needs: test` | 🔴 | PR без тестов не зелёный | — | release-web | 0.4 н |
| **PR-05** | Fail-fast `SECRET_KEY`; health 503 если БД мертва | 🔴/🟡 | Старт без ключа падает; Render режет | — | security / incremental | 0.2 н |
| **PR-06** | Argon2id + rehash on login | 🔴 | Старый sha256 ещё логинит | PR-05 | security | 0.3 н |
| **PR-07** | Close preview на CTA + chip «подушка ≠ жизнь» | 🔴 | 8 реплеев: игрок называет списание до тапа; GO≤P5 падает | preview API есть | design-lab **короткий** или hero copy без новой сетки → FE | 1.2 н |
| **PR-08** | Канон migrate до старта API (убрать тройной DDL) | 🔴 | Один путь схемы | db-baselines | 1 н |
| **PR-09** | Freeze: не включать TG шаблон 4; не CTA советника | 🔴 | Config / чеклист запуска | LiveOps | 0 |

**Параллельно:** PR-03 ‖ PR-05; PR-01→02; PR-14 с PR-01 (close path); PR-07 после 01 (иначе preview врёт на двойном close).

**Не в P0:** смена правила «burn с подушки» (нужен spec + balance-playtest); победа 12–18p; полный reorder дашборда; волна 10–20; вырезание Plan (GO — P1, отдельный PR).

### Первые шаги (сессии агента)

Не начинать с lab дашборда, YAML-пака, BT или GO-03. Один primary на сессию. TDD до кода.

| # | Слот | Зачем | Файлы (ориентир) | Verify |
|---|------|--------|------------------|--------|
| **1** | **PR-03** | Самый дешёвый 🔴: читерский skip экономики | `routers/period_actions.py`, `services/period/complete.py`; новый pytest | `POST /complete-period` → **410**; FE по-прежнему не зовёт |
| **2** | **PR-01** | Двойной месяц ломает всё остальное | `services/game/time.py` `go_to_next_period`, lock профиля, идемпотентность close | два параллельных `time/next` → один `period_index` |
| **3** | **PR-14** | AI C1: cognition не молчит | `period.py`, close payload, FE toast/chip | инжект fail → `events_spawn_failed`; unit уже есть |
| **4** | **PR-02** | Тот же паттерн lock на salary/choose + FE `Idempotency-Key` | salary/choose services, `api.js` | concurrent pytest; DevTools заголовок |
| **5** | **PR-04** | Gate LLM/YAML | `.github/workflows` + Pages `needs` | PR без pytest красный |

Дальше P0: PR-05/06 секреты, PR-08 схема, PR-07 preview (после 01), PR-09 freeze (0 кода). GO-01 — **отдельный PR**, можно после шага 1.

### Фаза 2: Core, Game-only старт, Onboarding (P1)

**Вход:** P0 exit (или GO-01 параллельно P0, если PR не пересекается с `period.py`).  
**Выход:** нет плитки «Скоро»; `plan` start → 400; PA-G1–G3 на n≥10; цикл читается сверху вниз; словарь «ход» везде.

Детали файлов GO — [`PLAN_game-only.md`](PLAN_game-only.md). Здесь только слот в очереди.

| ID | Задача | Max | Метрики | Зависимости | Effort |
|----|--------|-----|---------|-------------|--------|
| **GO-01** | «Новая игра» → сразу шаблоны; нет «Скоро» | 🔴 ADR-013 | 0 экрана режима; 0 copy «План скоро» | Canon Sync `new-game-mode` | 0.4 н |
| **GO-02** | `POST start` `save_kind=plan` → 400 | 🔴 | TestClient 400; SQL count(plan) до выкладки | GO-01 можно тем же PR | 0.3 н |
| **PR-10** | Lab дашборд: действия под hero; needs compact в P1 | 🔴 U1 | Q1≥3.5; salary до close без охоты | design-lab-mqx → FE | 1.5 н |
| **PR-11** | Copy: ход vs месяц; empty событий; pill «с хода 3»; lock-табы | 🟡 | 0 смеси в grep UI | — | 0.3 н |
| **PR-12** | Scroll к salary в O3; CLS strip (α-FB-17) | 🟡 | PA-T2 «не прыгает» | PR-10 якоря | 0.4 н |
| **PR-13** | Spec: skip событий close vs mandatory-all | 🟡 Q-M1 | Решение в SPEC_PRODUCT | documentation | 0.2 н |
| **PR-15** | Заполнить WAVE1 ops URL; чат+опрос; SLA BLOCKER; FAQ «Плана не будет» | 🔴 L-L11 | 100% инвайтов с каналом | люди, не код | 0.5 н календаря |
| **PR-16** | PA-W1 10–20 | 🔴 P-C3 | PA-A1, Q6≤20% | **P0 + GO-01 + PR-15** (GO-02 желателен) | 1 н календаря |
| **PR-17** | `last_seen_at` / D7-прокси (PLT-107) | 🔴 P-C3 | Можно назвать return | PLT | 0.4 н |
| **PR-18** | Spec+sim: акт 1 победы 12–18p (V2-BAL) | 🔴 P-C2 | `win_at` в balance-playtest | game-economy + doubt | 1 н |
| **PR-19** | Гипотеза правила подушки (burn / auto-withdraw) | 🔴 P-C1 | A/B нет; 8 реплеев + sim `safety_first` P20 alive | spec-driven **до** кода | 0.5 н doc + 1.5 н если go |
| **PR-20** | Overlay z-index после скрина α-FB-19 | 🟡 | Nav не кликается сквозь карточку | lab | 0.8 н |

**Параллель P1:** GO-01/02 ‖ PR-10 (старт vs дашборд). WAVE1 не стартует, пока GO-01 не в билде, которым играют люди.

### Фаза 3: Mid-game & Events (P2)

**Вход:** WAVE1 без BLOCKER; честный close. **Выход:** до P12 ≥8 уникальных историй; picker можно симить без FastAPI; Q11 «листание» снижается.

| ID | Задача | Max | Метрики | Effort |
|----|--------|-----|---------|--------|
| **GO-03** | Снять Plan UI / Watchtower-фильтр plan | 🟡 | Нет `planSetup`; funnel без живого сегмента plan | 0.5 н |
| **GO-04** | `EventDefinition.mode` plan → any/game | 🟡 | Фильтр пула не ветвится на plan | 0.4 н |
| **PR-21** | Внедрить V2-BAL акт 1 (если spec go) | 🔴 | `goals_met`>0 к P18 в sim | 1 н |
| **PR-22** | Cooldown/once повторов (α-FB-03) | 🟡 | unique keys / 10 ходов ↑ | 0.8 н |
| **PR-23** | EVT1 informational slot (3 новости / 12p) | 🟡 | Q11 <25% | 2 н |
| **PR-24** | Тематический YAML-пак 8–10 ключей (не 4-я карточка) | 🟡 L | Анонс в чате, не множитель | 2 н create-event |
| **PR-25** | Port picker из `period.py` (E-M1/M7) | 🟡 | Sim без HTTP | 2 н |
| **PR-26** | Капитал: видимый empty + deep-link «Вложить» | 🟡 | α-FB-06 закрыт на PA-T2 | 1 н lab |
| **PR-27** | Плотный ритуал close (3 строки + до/после) | 🟡 α-FB-18 | Сверка chip vs факт | 0.8 н |
| **PR-28** | `definition_key` в admin/логах + **spawn-set** (AI M1) | 🟡 | Баг контента воспроизводим | 0.4 н |
| **AI-01** | Опционально `rng_seed` на профиль (support replay) | 🟢 | Не включать всем в α | 1 н |

### Фаза 4: Live Ops & Polish (P3)

**Вход:** D7 ≥8% среди закрывших ≥1 период, **n≥50**. Иначе не открывать сезон/советника. Plan как второй продукт **не** открывать никогда (ADR-013).

| ID | Задача | Max | Метрики | Effort |
|----|--------|-----|---------|--------|
| **PR-29** | Player TG: win/loss/achievement + **D+7** + `/quiet` | 🟡 | quiet<30%; return D7 | 2 н + ops PLT-201 |
| **PR-30** | Экран достижений (M12) после idea-refine | 🟢 | Не PvP | 3 н |
| **PR-31** | Sentry + request_id | 🟡 E-M15 | Crash-free | 0.6 н |
| **PR-32** | Desktop Tab-порядок (ADR-012) | 🟡 U-U20 | Primary CTA с клавиатуры | 0.3 н |
| **PR-33** | Season pack / macro | 🟢 | Только после акта 1 | 3–4 н |
| **PR-34** | CustDev советника 8–12 | 🟢 | Не CTA в игре | 2 н |
| **GO-05** | Опционально: CHECK `save_kind='game'` | 🟢 | После SQL count(plan)=0; колонку не дропать | 0.2 н |
| **PR-35** | ~~Plan M2.0~~ | — | **Cancelled** ADR-013 | — |

---

## Метрики готовности

Нет live D1/D7 — не выдумывать. «Сейчас» = факт на 2026-09-07.

| Метрика | Сейчас | Gate «звать CA» | Таргет production | Как мерить |
|---------|--------|-----------------|-------------------|------------|
| Двойной close | дыра в коде | 0 в concurrent pytest | 0 в prod 30д | pytest + Watchtower аномалии `period_index` |
| `/complete-period` | 200 cheat | 410 | 410 | TestClient |
| CI на PR | skills-only | pytest+unit required | + Pages after tests | GitHub Checks |
| Preview close на CTA | API есть, UI слабый | игрок называет списание | GO≤P5 ≤25% | 8 реплеев; `game_lost` |
| Плитка Plan / «Скоро» | в UI | нет в билде WAVE1 | нет | ручной старт «Новая игра» |
| PA-G1 BLOCKER | неизвестно | 0 | 0 | чат |
| PA-A1 ≥5 close | W0: 3–4p n=1 | ≥50% n≥10 | ≥60% | `period_economy_closings` |
| Q6 «нужна помощь» | нет | ≤20% | ≤15% | опрос |
| D7 | нет данных | ≥8% n≥50 (вход P3) | 12–15% niche | `last_seen` / PLT |
| D1 / D30 | нет | смотрим / TBD | 28% / 5% | та же |
| First win `win_at` | sim goals_met 0 к P16 | P18 в tutorial sim | 12–18p медиана | balance-playtest |
| Unique events / 10p | α-FB-03 | ≥6 | ≥8 к P12 | `event_chosen` keys |
| Spawn 2 events after close | нет live | 0 тихих fail | 100% | флаг PR-14; AI-аудит C1 |
| `/quiet` rate | бот не в ops | — | <30% | TG |
| NPS после 5p | не мерили | не в P0–P1 | ≥30 | опрос после CA |
| Crash-free | нет Sentry | нет BLOCKER | ≥99.5% | Sentry P3 |

---

## Риски и гипотезы (расхождения аудитов)

| Расхождение | Кто | Как решить |
|-------------|-----|------------|
| **Правило подушки:** менять движок (P) vs только показать (U) vs не награждать подушку в ивентах (L) | Product хочет снять ловушку; UX — честный UI; LiveOps — не усиливать до фикса | **P0 = show.** Правило — гипотеза H1: «если burn может идти с safety (или auto-withdraw 1× burn), GO≤P5 у safety_first падает без роста needs-GO». Проверка: spec → sim `safety_first` 40p + 8 реплеев. **Не A/B** до n≥200. |
| **Preview streak `>=2` vs движок `>=3`** | Eng M18 «UI врёт»; QA m4 «это прогноз третьего минуса» | Прототип копирайта «если закроешь сейчас — 3-й минус» vs смена константы. 5 человек + сверка `test_period_close_preview`. |
| **Пустой пул после close** | Eng закрыл M17 (лог есть); QA M2; AI C1 🔴 | **P0-parallel PR-14** (не ждать P1). Проверка: инжект fail → UI/флаг, не только лог. |
| **Skip событий close** | QA: дыра контента; spec TB1: блок только mandatory | Решить в spec (PR-13). Плейтест Q: «закрыл, не открыв карточки — ок?» |
| **Когда звать 10–20** | Старый бэклог: P0 = PA-W1; Eng/QA: сначала lock+CI | **Этот план:** волна = P1 после **P0 + GO-01**. Проверка: PR-01…07 green **и** нет «Скоро». |
| **α-FB-19 overlap** | UX/QA CSS-риск; нет скрина | Не P0. Прототип z-index в lab + 1 сессия со скрином. |
| **Daily TG для D7** | Типичный liveops vs L6+product TB1 | Не включать шаблон 4. Гипотеза H2: D+7 без daily даёт return без падения Q7. Проверка: CA n≥50, quiet rate, не A/B daily. |
| **Baseline 2026-05-29** | Product опирается (safety_first мёртв P3); после DL1 может быть устарел | Перепрогон `balance_playtest` **до** смены правила подушки. |
| **Акт 1 за 12–18p** | Product Critical; может сломать «серьёзную» фантазию 40–60 | Не код в P0. Гипотеза H3: медиана `win_at` 12–18 не роняет Q5 «цель мелковата» >30%. Плейтест + sim. |

---

## Vertical slices (для агента)

| # | Срез | Phase | Skill | Satellites | Next |
|---|------|-------|-------|------------|------|
| 1 | PR-03 410, затем PR-01 lock, PR-14 spawn-flag | `build` | api-and-interface-design | TDD, critical-tests | PR-02 |
| 2 | PR-04 CI | `ship` | release-web | — | — |
| 3 | PR-05…06 secrets | `build` | security-and-hardening (явный вызов) | TDD | — |
| 4 | PR-07 honesty UI | `build` | design-lab-mqx → frontend-ui-engineering | critical-tests | — |
| 5 | PR-08 schema | `build` | db-baselines-and-migrations | TDD | — |
| 6 | **GO-01/02** старт без Plan | `build` | frontend-ui-engineering + api | TDD, Canon Sync | GO-03 в P2 |
| 7 | PR-10 dashboard | `build` | design-lab-mqx | — | frontend-ui |
| 8 | PR-18…19 economy spec | `define` | spec-driven-development | game-economy, doubt | incremental |
| 9 | PR-16 WAVE1 | `ship` | — (люди) | liveops чеклист | — |

---

## Checkpoints

- [ ] Человек: **APPROVED** этот план (или правки фаз)
- [ ] TRACEABILITY: M1.2 и GO ссылаются сюда как на **очередь**; GO-детали — `PLAN_game-only`
- [ ] «В работу сейчас» в backlog синхронизирован
- [ ] P0 PR-01…09 done + verify
- [ ] GO-01 в билде WAVE1; GO-02 желателен
- [ ] WAVE1 не стартовала раньше P0 **и** GO-01
- [ ] Утверждённое правило подушки / акта 1 → **spec**, не правка канона из аудита
- [ ] AI: не заводить BT/GOAP/player-LLM; C1/C3 закрываются PR-14 и PR-04

## Связь с AI-аудитом

Снимок [`audits/ai/2026-09-07-runtime-and-dev-ai.md`](../audits/ai/2026-09-07-runtime-and-dev-ai.md). Кросс-роли: [`ai-proposals`](../audits/ai/2026-09-07-ai-proposals.md). Новых эпиков «нейросеть NPC» нет.

| AI-ID | Сводный ID |
|-------|------------|
| C1 пустой месяц | PR-14 |
| C2 тонкий каталог | PR-18, PR-22…24 |
| C3 LLM без pytest | PR-04 |
| M1 replay picker | PR-28 (+ spawn); AI-01 опционально |
| M2 skip | PR-13 |
| M3 info-слот | PR-23 |
| M6 mode=plan | GO-04 |

## Не делаем

Не заменяет [`PLAN_PLT.md`](PLAN_PLT.md) (инфра, funnel, бот). Не заменяет [`PLAN_game-only.md`](PLAN_game-only.md) (файлы и Done-критерии GO). Не заменяет отдельные SPEC. Не список MQ-* на каждый grep аудита. Не внедряет BT/GOAP/ML-Agents ([AI-аудит](../audits/ai/2026-09-07-runtime-and-dev-ai.md)).
