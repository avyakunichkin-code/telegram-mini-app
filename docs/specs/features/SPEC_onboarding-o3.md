---
layer: spec
status: approved
owner: product+frontend+backend
last_reviewed: 2026-06-05
tracks: O3, onboarding, pre-alpha
supersedes: SPEC_onboarding-o2.md
idea: ../../vision/ideas/onboarding-o3-hybrid-guidance.md
design_lab: ../../../design-lab/onboarding-o2/guidance-strip-round/
character_voice: ../../reference/CHARACTER_MONETKA.md
tags:
  - tvoy-hod/layer/spec
  - tvoy-hod/status/approved
  - tvoy-hod/topic/o3
  - tvoy-hod/topic/onboarding
  - tvoy-hod/topic/pre-alpha
aliases:
  - "Онбординг O3 — гибрид (spine + триггеры)"
  - O3
  - "SPEC onboarding o3"
  - SPEC_onboarding-o3
  - "Spec: Онбординг O3 — гибрид (spine + триггеры)"
---
# Spec: Онбординг O3 — гибрид (spine + триггеры)

## Objective

Снизить перегруз первой сессии после плейтеста PA: **5 шагов P1** в голосе Монетки, **1 шаг P2**, дальше **контекстные триггеры** (экран / событие), без «томика» на 3 периода.

**Scope:** шаблон «Студент», первый профиль user, `MqxGuidanceStrip` (O2 UI).

## Spine (curriculum)

### Период 1 — 5 шагов

| step | id | gate | CTA |
|------|-----|------|-----|
| 1 | `p1_period` | read | Понятно |
| 2 | `p1_flows` | read | Понятно |
| 3 | `p1_salary` | action_salary | Нажми «Зарплата» |
| 4 | `p1_cushion` | action_cushion | Нажми «Пополнить» |
| 5 | `p1_close` | action_close + debrief | Нажми «Закрыть месяц» |

### Период 2 — 1 шаг

| id | gate | Тема |
|----|------|------|
| `p2_new_month` | read | Новый цикл, зарплата снова активна |

## Триггеры (после spine)

| id | screen / условие | gate |
|----|------------------|------|
| `t_events_intro` | period ≥ 2, pending events | action_event |
| `t_finance_actions` | `screen_enter` → `finance:actions` | read |
| `t_finance_details` | `finance:details` | read |
| `t_needs` | `needs` (help sheet) | read |
| `t_farewell` | все выше завершены | farewell → `guidance_completed` |

Конфиг: `backend/app/guidance/triggers.py`, зеркало FE `GUIDANCE_SCREEN_TRIGGERS`.

## API

`PATCH /api/game/guidance`:

- `{ "action": "screen_enter", "trigger_id": "t_finance_actions" }`
- остальные action O2 без изменений

Overview: поле `is_trigger: bool`.

## Контракт «текущий месяц»

[ADR-011](../../decisions/ADR-011-period-effects-at-close.md): `process_period_end` списывает **актуальный** `compute_monthly_burn` (включая event lines периода).

## Acceptance

- [ ] Fresh start: beat `p1_period` → … → `p1_close` → debrief → `p2_new_month`
- [ ] После spine strip **не** спамит, пока нет `screen_enter` / событий
- [ ] «Вложить» → Капитал / **Действия** (P0)
- [ ] Событие −500 в P1 → close списывает −500 к базе burn
- [ ] pytest `test_guidance_o2`, `test_period_close_current_burn`

## Не в O3

Жильё студента, частота событий, recommended invest amounts, Event modal help book.
