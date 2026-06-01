# Skill Spec Test: /create-event

**Date:** 2026-05-31  
**Spec:** `.cursor/skills/specs/build/create-event.md`  
**Skill:** `.cursor/skills/create-event/SKILL.md`

---

## Case 1: Happy Path — событие для студента

**Fixture:** «Скидка на стриминг для студента, soft_offer, −500₽».

**Expected behavior (skill coverage):**

| Step | Verdict | Notes |
|------|---------|-------|
| 1. Читает persona-profiles + SPEC + EVENT_BRIEF | PASS | «Прочитай сначала» + Workflow §1 |
| 2. content_class, event_slot, audience_template_keys | PASS | §Модель, Workflow §0–1 |
| 3. Brief + кнопки с needs social/health | PASS | §4 + §11 + persona-profiles; ось по теме |
| 4. Unique key → `data/events/mvp11/<domain>.yaml` | PASS | §5, ADR-008 |
| 5. `pytest -k event` | PASS | §6 Verify |
| 6. Verdict COMPLETE | PASS | Таблица Verdict |

**Assertions:**

- [PASS] Отдельный key; не `variants[]` — § «Генерация пары», чеклист; явный запрет `variants[]` в теле SKILL нет, но `event-balance-rules.md` (must_read) требует **новый `definition_key`** на вариант текста.
- [PASS] `profile` + `audience: all` — отклоняется («ошибка автора», чеклист **profile ≠ all**).
- [PASS] audience = фильтр; universal pair = два key + два audience — §Модель п.1, § «Генерация пары».
- [PASS] Каждый choice: needs+ ⇒ cash− / burn / needs− — §4 ссылается на event-balance-rules §1–3, чеклист «Баланс».
- [PASS] lifecycle_class / cooldown для downgrade — §10, Workflow §4, чеклист.
- [PASS] needs_axis_map по теме — §11, EVENT_BRIEF, Workflow §4.

**Case Verdict:** PASS

---

## Case 2: Пара student + professional

**Fixture:** «Та же механика кофе, два профиля».

**Expected behavior:**

| Step | Verdict |
|------|---------|
| Два key (`_student`, `_pro`), разный текст и needs_delta | PASS — § «Генерация пары Student / Professional» |
| Verdict COMPLETE или CONCERNS без pytest | PASS — таблица Verdict |

**Case Verdict:** PASS

---

## Protocol Compliance

- [PASS] Ask-before-write — «**Могу записать**» + черновик до Write (§ Согласование).
- [PASS] Handoff `test-driven-development` — «Дальше» + Satellites в «Прочитай сначала».

---

## Overall Verdict: **PASS**

0 case failures, 0 protocol gaps. Единственная мягкая зона: запрет `variants[]` не продублирован в теле SKILL (есть в `event-balance-rules.md` и rule `tvoy-hod-events.mdc`) — не блокирует spec.

## Recommended follow-up

- Опционально: одна строка в SKILL «**Не** `variants[]` — отдельный `definition_key` на вариант» для полного совпадения с spec без must_read.
- `/skill-test spec game-economy-and-victory` — следующий core behavioral pass.
