---
layer: ux
status: approved
last_reviewed: 2026-05-26
feature: character-needs-phase-1
platform: Telegram Mini App (touch-first, 320–480px)
---

# UX: Потребности персонажа — сводка и решения

Мастер-документ для фазы 1. Детальные per-screen спеки — в [`screens/`](screens/). Продуктовая механика — [`specs/features/SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md).

**Следующий шаг:** design-lab → [`design-lab/character-needs/`](../../design-lab/character-needs/).

## Терминология (нейминг)

| Контекст | Термин |
|----------|--------|
| Механика, эпик CN1, design-lab, планирование | **Потребности** (Z-NEEDS) |
| Prod UI, заголовок секции | **Потребности** |
| Тех.ключи | `need_*`, `needs_*`, `needs_delta` — без переименования |
| Не про эту механику | `onboarding_state`, empty/loading UI state, React state в hooks |

---

## Цель UX-слоя

Игрок за короткий заход **видит «жизнь» рядом с деньгами**, понимает риск поражения и знает, что делать: **события** (основной путь) и редко **«Порадовать себя»** (запасной). Победа (Victory v2) остаётся отдельной мотивацией.

---

## Закрытые продуктовые решения (UI/UX)

| ID | Решение | Обоснование |
|----|---------|-------------|
| **UX-01** | Блок потребностей на **главной** сразу **после hero**, **до** «Финансы периода» (зона **Z-NEEDS** → Z1) | Жизнь персонажа — первый контекст месяца; деньги — второй слой; цель и действия ниже |
| **UX-02** | **Compact:** маскот слева (52×56) + **одна** горизонтальная шкала min-оси; **4 бара** — только в expand | Без вертикальных столбцов; без дубля статуса в collapsed |
| **UX-03** | Зоны: **≥40** норма · **<40** низко · **<30** истощение · **0** критично; справа от бара — **цветной текст** (жирный), не отдельный бейдж | Basic tier: бар + текст достаточно |
| **UX-04** | **«Порадовать себя»** — всегда **bottom sheet** с подтверждением; при **1 опции** — одна карточка + «Подтвердить» / «Отмена» | Игрок видит цену и `needs_delta` до списания |
| **UX-05** | **Treat-self и «?»** только **внутри раскрытого** аккордеона, справа; компактные (pill / link + ? в кружке 22–26px) | В collapsed — только маскот + одна шкала |
| **UX-06** | **«Помощь»** (`?`) → sheet со справочником (`maintenance` + `critical`); **обязательна для всех** персонажей | Hard без проактивных toast всё равно имеет путь |
| **UX-07** | **Студент (soft):** баннер при любой шкале **<40** (один раз за период или dismiss); **hard:** без баннера | `proactive_hints` из blueprint |
| **UX-08** | **Риск поражения:** при `needs_zero_periods_streak > 0` — баннер уровня critical в Z-NEEDS («N из 3 месяцев на нуле») | Игрок видит счётчик до game over |
| **UX-09** | **Закрытие месяца:** не блокировать; при `is_distressed` или `has_zero` — **предупреждение** в том же паттерне, что зарплата (`MqxSalaryWarnModal` family) | Согласовано с TB1 и onboarding |
| **UX-10** | **Онбординг O1:** потребности **не** в 5 шагах coach; **после `brief_done`** — одноразовый **intro-баннер** (dismiss → localStorage/profile flag) | Coach уже длинный; события в coach скрыты |
| **UX-11** | **События:** на кнопках выбора — чипы `needs_delta`; после выбора — juice на затронутых барах (reuse `MqxJuiceGainFeedback`) | Связь «ответил → полоска выросла» |
| **UX-12** | **Выбор персонажа:** экран шаблонов — копирайт **«Выбор персонажа»**; подзаголовок про **стиль жизни и поддержку**, не только «сложность» | Справедливость soft/hard |
| **UX-13** | **Plan mode:** блок needs **не показывается** (`needs.enabled: false`) | ADR-001 / architecture |
| **UX-14** | **Game over** `needs_depletion`: отдельный экран/слой как у cash-defeat (если есть) или modal full-screen с CTA «Новая игра» / меню | Единый тон поражения |

---

## Карта экранов и документов

| Тема | UX spec | Design-lab (план) |
|------|---------|-------------------|
| Блок на главной | [`screens/character-needs-dashboard.md`](screens/character-needs-dashboard.md) | `dashboard-needs-round/` |
| «Порадовать себя» | [`screens/character-needs-treat-self.md`](screens/character-needs-treat-self.md) | `treat-self-round/` |
| Справочник помощи | [`screens/character-needs-help.md`](screens/character-needs-help.md) | `help-sheet-round/` |
| События + needs_delta | [`screens/character-needs-events.md`](screens/character-needs-events.md) | `events-needs-chips-round/` (в `design-lab/events/`) |
| Выбор персонажа | [`screens/character-pick.md`](screens/character-pick.md) | `game-templates/` (доп. копирайт) |
| Закрытие месяца / поражение | [`screens/character-needs-period-defeat.md`](screens/character-needs-period-defeat.md) | `period-close/` + `defeat-round/` |
| Intro после онбординга | § Onboarding ниже | `needs-intro-banner-round/` |

**Изменение существующего:** [`screens/dashboard.md`](screens/dashboard.md) — зона Z-NEEDS и ссылки.

---

## HUD-философия (needs)

**Adaptive minimal:** на главной всегда виден **компактный** индикатор жизни; детали и действия — по раскрытию или sheet. Не дублировать 4 полные полоски на каждом табе. Аналитика и финансы — **без** needs в фазе 1.

---

## Глоссарий UI (RU)

| Ключ API | Видимая подпись |
|----------|-----------------|
| `comfort` | Комфорт |
| `status` | Статус |
| `social` | Связи |
| `health` | Здоровье |
| treat_self CTA | Порадовать себя |
| help CTA | Помощь (иконка `?` + `aria-label="Помощь по потребностям"`) |
| section title | Потребности |
| zero streak | «Риск поражения: N из 3 месяцев с нулём на шкале» |
| defeat title | Поражение: потребности на нуле три месяца подряд |

---

## Onboarding (после O1)

| Элемент | Поведение |
|---------|-----------|
| **Когда** | Первый показ `DashboardPremium` после `onboarding_state → brief_done` и `needs.enabled` |
| **Что** | Баннер под hero или над Z-NEEDS: 2 предложения + «Понятно» |
| **Копирайт (черновик)** | «Четыре полоски — комфорт жизни. Они медленно падают каждый месяц. Поднимать их удобнее в **событиях**; «Порадовать себя» — редкий запасной путь.» |
| **Повтор** | Не показывать после dismiss (`needs_intro_dismissed` на профиле или localStorage keyed by profile id) |
| **Coach** | Не добавлять шаг 6 в O1 v1 |

---

## MQX-компоненты (после утверждения lab)

| Компонент | Назначение |
|-----------|------------|
| `MqxNeedsSummary` | Compact: min + chevron + optional warning |
| `MqxNeedsBars` | 4 progress bars, зоны, labels |
| `MqxNeedsRiskBanner` | zero streak / distressed hint |
| `MqxTreatSelfSheet` | bottom sheet выбора/confirm |
| `MqxNeedsHelpSheet` | справочник |
| `MqxNeedsDeltaChips` | на EventCard choices |

Витрина: `#/dev/mqx` до подключения в `DashboardPremium`.

---

## Open questions (только playtest / lab)

| ID | Тема | Где решать |
|----|------|------------|
| LQ-01 | Маскот v1 / v2 / v3 | lab + prod asset |
| LQ-02 | Treat: pill vs outline vs text link | E1–E3 |
| LQ-03 | Help: 26px vs 22px vs violet ring | E1–E3 |
| LQ-04 | Treat-self sheet (следующий раунд) | treat-self-round |
| PQ-* | Числа баланса | SPEC §Open questions |

---

## Acceptance (сквозные, QA)

1. При `needs.enabled` на главной видна зона Z-NEEDS (compact); без enabled — зоны нет.
2. Раскрытие accordion показывает 4 бара с подписями RU и `aria-valuenow`.
3. Treat-self: sheet → confirm → POST; при кулдауне кнопка disabled + подпись «через N мес.».
4. Help sheet открывается с любого персонажа; тексты soft/hard различаются где задано в контенте.
5. Событие с `needs_delta`: чипы на choice; после выбора — обновление overview needs.
6. Закрытие месяца при `has_zero`: предупреждение; при streak≥3 после close — game over UI.
7. После `brief_done` один раз intro-баннер; dismiss скрывает навсегда для профиля.
8. 320px: compact row без горизонтального скролла; touch targets ≥44px.

---

## Связанные документы

- Vision: [`game-character-needs-foundation.md`](../vision/ideas/game-character-needs-foundation.md)
- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md)
- ADR: [005](../decisions/ADR-005-character-needs-state-and-defeat.md), [006](../decisions/ADR-006-treat-self-options-and-cooldown.md)
- Dashboard (базовый): [`screens/dashboard.md`](screens/dashboard.md)
- Design-lab: [`design-lab/character-needs/`](../../design-lab/character-needs/)
