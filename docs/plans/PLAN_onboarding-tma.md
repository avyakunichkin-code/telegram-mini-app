---
layer: plan
status: draft
last_reviewed: 2026-05-20
spec: ../specs/features/SPEC_onboarding-tma.md
epic: O1
---

# Plan: Онбординг TMA (O1)

**Принцип:** утвердить в design-lab, затем MQX → prod.

**Поворот 2026-05-20:** вместо Mission Brief (3 карточки) — **guided coach** на `GameScreen` ([`onboarding-guided/`](../../design-lab/onboarding-guided/)).

---

## Карта документов эпика

| # | Документ | Статус | Когда трогать |
|---|----------|--------|----------------|
| 1 | [`onboarding-tma-mission-brief.md`](../vision/ideas/onboarding-tma-mission-brief.md) | draft | Продукт, scope |
| 2 | [`CHARACTER_MONETKA.md`](../reference/CHARACTER_MONETKA.md) | approved | Тон Монетки |
| 3 | [`design-lab/onboarding-guided/`](../../design-lab/onboarding-guided/) | **★ утверждён** | Копирайт, APPROVED |
| 3b | [`design-lab/onboarding-brief/`](../../design-lab/onboarding-brief/) | superseded | Архив |
| 4 | [`SPEC_onboarding-tma.md`](../specs/features/SPEC_onboarding-tma.md) | approved | Guided coach |
| 5 | `PLAN_onboarding-tma.md` (этот файл) | draft | Дорожная карта |
| 6 | [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) | O1 | Задачи |
| 7 | [`TRACEABILITY.md`](../TRACEABILITY.md) | O1 | Статус |
| 8 | [`TMA_USER_FLOWS.md`](../foundation/TMA_USER_FLOWS.md) | чеклист | После внедрения |

---

## Фазы

### Фаза 0 — Утверждение ✅

- ~~Mission Brief A~~ superseded.
- **2026-05-20:** guided coach 5 шагов — [`onboarding-guided/APPROVED.md`](../../design-lab/onboarding-guided/APPROVED.md).

---

### Фаза 1 — Guided coach (текущая)

| # | Задача | Слой |
|---|--------|------|
| 1.0 | Автостарт **простейшего** шаблона после Game Mode (если ещё нет) | Frontend+Backend |
| 1.1 | MQX: `OnboardingCoach` + spotlight + `MonetkaBubble` | Frontend |
| 1.2 | `#/dev/mqx` секция | Frontend |
| 1.3 | `onboarding_state` + `onboarding_step`; PATCH | Backend |
| 1.4 | Поля в overview; coach на `GameScreen` при `draft` | Frontend |
| 1.5 | Гейты: 10 с (шаги 1,3), salary, cushion; skip×2 | Frontend |
| 1.6 | `data-onboarding-anchor` на целевых элементах | Frontend |
| 1.7 | pytest + `npm run build` | QA |

---

### Фаза 2 — Повтор и метрики (отложено)

| # | Задача |
|---|--------|
| 2.1 | «Повторить обучение» в меню — **после** изучения поведения |
| 2.2 | События аналитики: шаг, skip, время до `brief_done` |

---

### Фаза 3 — Доработки по плейтесту

| # | Задача |
|---|--------|
| 3.1 | Настраиваемая длительность практики (сейчас 10 с фикс) |
| 3.2 | Опционально: события / цель победы отдельным шагом |

---

## Оценка

| Фаза | Срок |
|------|------|
| 0 | ✅ |
| 1 | 3–4 дня |
| 2 | TBD |
| 3 | по плейтесту |

---

## Зависимости

- MQ-116 ✅
- Pre-Alpha: желателен **фаза 1** до плейтеста
