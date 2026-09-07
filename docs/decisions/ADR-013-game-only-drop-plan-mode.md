---
status: accepted
date: 2026-09-07
deciders: проект (единственный владелец продукта)
tags:
  - tvoy-hod/layer/adr
aliases:
  - ADR-013
  - ADR-013-game-only-drop-plan-mode
  - "ADR-013: Только Game — отказ от режима Plan"
---

# ADR-013: Только Game — отказ от режима Plan

## Status

**Accepted** (2026-09-07).

Дополняет [ADR-001](ADR-001-save-kind-remove-light-hardcore.md): отказ от `light`/`hardcore` и введение `save_kind` остаются в силе. **Резерв `plan` под MVP 2.0** в ADR-001 **снят** этим ADR. ADR-001 не удалять.

## Context

С мая 2026 канон обещал два типа сохранения: **Game** (шаблоны, TB1, события, Victory v2) и **Plan** (ручной бюджет, мастер, префилл). В prod Plan — плитка **«Скоро»** при живом API (`save_kind=plan`, `BaseParamsScreen`, `PlanExpenseEditor`). Эпик **M2.0** числился обязательным 2.0.

Аудиты 2026-09-07 (product C6; UX α-FB-14; production-ready freeze) и разбор по ролям: [idea `game-only-drop-plan-mode`](../vision/ideas/game-only-drop-plan-mode.md). Два режима = два продукта до одного working loop. ЦА 30+ видит ложный выбор. Команда держит ветвления в start, events, funnel, analytics, скиллах.

Вырезание кода в одном PR не делаем: канон сначала, срезы — [`PLAN_game-only.md`](../plans/PLAN_game-only.md).

## Decision

1. **Один продукт = игра.** Новый профиль создаётся только с **`save_kind=game`** + **`template_key`** из `game_starter_templates`.
2. **Не создавать** профили `save_kind=plan`. `POST /api/game/start` (и эквиваленты) с `save_kind=plan` → **400**. UI не показывает плитку Plan / «Скоро».
3. **Не обещать** Plan Mode, MVP 2.0 как второй save, мастер «своей жизни» на старте. Эпик **M2.0 (Plan для своих) — cancelled**.
4. **Статьи расходов Game** (`profile_expense_lines`, burn из шаблона, эпик E1 волны A–C) **остаются**. CRUD «свой бюджет с нуля» как второй режим — **не делать**. Если после D7 понадобится редактор — отдельная идея **внутри Game**, не новый `save_kind`.
5. **Колонку `save_kind` не дропать** в том же релизе, что UI. До аудита prod-строк колонка живёт; каноническое значение — `game`. Сужение CHECK / удаление — срез GO-05.
6. **`EventDefinition.mode`:** канон фильтра — `game` \| `any`. Значение `plan` в YAML/сидах не открывает второй продукт; вычистка — GO-04.
7. **Canon Sync:** lab `design-lab/new-game-mode` (две плитки) устаревает; поток «Новая игра» → сразу шаблоны (или авто-Студент при 0 сейвов, как сейчас после выбора Игра). Не смешивать с экономикой периода / правилом burn подушки.

## Alternatives considered

1. **Вечная плитка «Скоро»** — отклонено: нулевой effort, ложный выбор, бьёт доверие 30+ (UX).
2. **Достроить M2.0 как второй продукт** — отклонено: product C6, два баланса, needs выключены в Plan, RICE ~7.5 vs ~80 у Game-only.
3. **Влить мастер бюджета в Game сейчас** — отклонено: усложняет FTUE до честного close и акта 1; не замена отказа от второго save.
4. **Удалить колонку `save_kind` сразу** — отклонено: нужны SQL-аудит plan-профилей и миграция; immutable не конвертирует plan→game без отдельного решения.

## Consequences

- Канон: `SPEC_PRODUCT` §0, `GLOSSARY`, `game-lexicon`, `CLAUDE.md`, handbook, TRACEABILITY, бэклог — Game only.
- Код до GO-01…03 **расходится с каноном** (плитка «Скоро» ещё в дереве) — это известный долг эпика GO, не отмена ADR.
- Исторические docs (evolution §II, post-playtest two-directions, SPEC_game-plan checklist Plan) читаются с баннером «Plan cancelled ADR-013».
- Тесты `test_plan_expenses_contract` и funnel `by_save_kind=plan` переписываются на срезах GO-02/03.
- Не путать: `InsurancePlanCard` / страховой тариф / `source_kind` статей burn ≠ `save_kind=plan`.

## Связанные артефакты

- Idea (роли GD / Architect / QA / UX / Live Ops / PO): [`game-only-drop-plan-mode.md`](../vision/ideas/game-only-drop-plan-mode.md)
- Срезы кода: [`PLAN_game-only.md`](../plans/PLAN_game-only.md)
- Предшественник: [ADR-001](ADR-001-save-kind-remove-light-hardcore.md)
- Spec G1 (Game path остаётся implemented): [`SPEC_game-plan.md`](../specs/features/SPEC_game-plan.md)
- Сводный план α: [`PLAN_production-ready.md`](../plans/PLAN_production-ready.md) — PR-35 cancelled
