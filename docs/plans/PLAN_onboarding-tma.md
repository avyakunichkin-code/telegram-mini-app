---
layer: plan
status: draft
last_reviewed: 2026-05-19
spec: ../specs/features/SPEC_onboarding-tma.md
epic: O1
---

# Plan: Онбординг TMA (O1)

**Принцип:** больше времени на утверждение в design-lab, меньше переделок в prod.

---

## Карта документов эпика

| # | Документ | Статус | Когда трогать |
|---|----------|--------|----------------|
| 1 | [`onboarding-tma-mission-brief.md`](../vision/ideas/onboarding-tma-mission-brief.md) | draft | Продукт, scope |
| 2 | [`CHARACTER_MONETKA.md`](../reference/CHARACTER_MONETKA.md) | draft | После выбора варианта с персонажем |
| 3 | [`design-lab/onboarding-brief/`](../../design-lab/onboarding-brief/) | **раунд 1** | **Сейчас** — выбор A–F |
| 4 | [`SPEC_onboarding-tma.md`](../specs/features/SPEC_onboarding-tma.md) | draft → approved | После «утверждаем X» |
| 5 | `PLAN_onboarding-tma.md` (этот файл) | draft | Дорожная карта |
| 6 | [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) | O1 секция | Задачи P0/P1 |
| 7 | [`TRACEABILITY.md`](../TRACEABILITY.md) | O1 строка | Статус эпика |
| 8 | [`TMA_USER_FLOWS.md`](../foundation/TMA_USER_FLOWS.md) | чеклист | После внедрения |
| 9 | [`SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md) | при необходимости | § онбординг-оверлей |
| 10 | [`PRE_ALPHA_PLAYTEST_PROTOCOL.md`](../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md) | §3 онбординг | Перед плейтестом |

**Не в волне 1:** coach marks spec, отдельный `design-lab/onboarding-coachmarks/`.

---

## Фазы

### Фаза 0 — Утверждение (текущая)

| Шаг | Действие | Готово когда |
|-----|----------|--------------|
| 0.1 | Пройти `cd design-lab/onboarding-brief && npx serve .` | Просмотрены A–F, light/dark |
| 0.2 | Утвердить вариант + копирайт 3 шагов с Монеткой | В чате: «Утверждаем **X**» |
| 0.3 | Заполнить § «Утверждённый вариант» в `CHARACTER_MONETKA.md` | ID варианта зафиксирован |
| 0.4 | Spec → `approved` | SPEC_onboarding-tma без открытых вопросов |

**Выход из фазы 0:** явное утверждение. **Код prod не начинаем.**

---

### Фаза 1 — Mission Brief (MVP O1)

| # | Задача | Слой |
|---|--------|------|
| 1.1 | MQX: `MissionBriefOverlay` (+ Монетка SVG/CSS) | Frontend |
| 1.2 | `#/dev/mqx` секция | Frontend |
| 1.3 | `onboarding_state`: `draft` на start, PATCH `brief_done` | Backend |
| 1.4 | Поле в overview; показ оверлея на GameScreen при `draft` | Frontend |
| 1.5 | pytest + `npm run build` | QA |

---

### Фаза 2 — Меню «Повторить обучение»

| # | Задача |
|---|--------|
| 2.1 | Пункт в `MenuPremium` |
| 2.2 | Показ брифа без смены `brief_done` (локальный `replay` или флаг сессии) |

---

### Фаза 3 — Coach marks (отдельно)

| # | Задача |
|---|--------|
| 3.1 | `design-lab/onboarding-coachmarks/` (2 подсказки, период 1) |
| 3.2 | Утверждение → MQX → prod |

---

## Оценка

| Фаза | Срок |
|------|------|
| 0 | 1–3 дня (обсуждение, без кода) |
| 1 | 2–3 дня после 0 |
| 2 | 0.5 дня |
| 3 | 2 дня (отдельный спринт) |

---

## Зависимости

- MQ-116 ✅
- Pre-Alpha плейтест: желателен **фаза 1**, не блокер если есть текстовый бриф в протоколе
