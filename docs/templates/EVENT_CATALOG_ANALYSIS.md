# Event Catalog Analysis — шаблон отчёта

Скопируйте в `docs/vision/analysis/event-catalog-<topic>-<YYYY-MM-DD>.md` или отдайте в чат по `/event-analysis`.

**Чеклист skill:** [`.cursor/skills/event-analysis/SKILL.md`](../../.cursor/skills/event-analysis/SKILL.md) · **Баланс:** [`event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md)

```yaml
scope: all | domain:<name> | tier:<n> | persona:student|professional|pairs
catalog: mvp11
date: YYYY-MM-DD
analyst: agent | human
verdict: HEALTHY | GAPS | CONCERNS | BLOCKED
```

## Executive summary

- …
- …

## Контракт (SPEC_mvp-11 / mq116)

| Метрика | Факт | Норма |
|---------|------|-------|
| Всего defs | | ≥12 |
| Tier 1 | | ≥6 |
| Tier 2–3 | | ≥4 |
| Tier ≥4 | | ≥2 |
| pytest validate | pass / fail | pass |
| balance_contract baseline | N | 0 после EVT1-105 |

## По доменам (`event_domain`)

| domain | count | keys (кратко) | заметки |
|--------|-------|---------------|---------|
| consumption | | | |
| housing | | | |

## Персоны (до `audience_json`)

| key | студент | про | prereq hint |
|-----|---------|-----|-------------|
| mq11_friend_outing_student | ✓ | — | forbid car |

**Пары без второй половины:** …

## Баланс trade-off (§1–4, §6)

См. [`event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md).

| key | free lunch? | Pareto? | отказ 0₽ + needs+? | max \|cash\| | % student | % pro |
|-----|-------------|---------|---------------------|--------------|-----------|-------|
| | | | | | | |

**Автолинт:** `pytest tests/unit/events/test_event_balance_contract.py` — только §1/§3; **не** §10/§11.

## Lifecycle и повтор (§10) — обязательно при scope all / housing / consumption

См. [`event-repeat-and-state-ladder.md`](../vision/ideas/event-repeat-and-state-ladder.md).

| key | repeat_policy | cooldown | repeat_max | −lifestyle / downgrade? | рекомендуемый класс | CONCERNS? |
|-----|---------------|----------|------------|-------------------------|---------------------|-----------|
| mq11_downsize_flat | | | | да | B | |
| mq11_home_internet | | | | да (ветка «дешевле») | B | |
| mq11_relocation_bonus | | | | нет | A | |

**CONCERNS:** `repeatable` без cooldown на defs с повторным удешевлением жилья/тарифа.

## Согласованность осей needs (§11)

| key | event_domain | needs_axis_map (ожид.) | факт needs+ | mismatch? |
|-----|--------------|------------------------|-------------|-----------|
| | housing | comfort primary | | health+ без health-темы? |

**CONCERNS:** tier-1 soft_offer с тройным needs+ или health+ на чистом жилье без `balance_exception`.

## Цепочки и особые типы

| chain / type | keys | complete? |
|--------------|------|-----------|
| family_money | request → callback | ✓ |
| used_car | offer → deadline | ✓ |
| needs_risk | | |
| global_macro | | |

## Дубли и перегруз

- …

## Gaps (рекомендации, без автозаписи в YAML)

| P | gap | suggested domain | next |
|---|-----|------------------|------|
| P1 | lifecycle B для housing keys | housing | `/create-event` + EVT1-105 |
| P1 | free lunch в tier-1 | consumption | rebalance + brief |

## Risks / handoff

- [ ] После правок каталога → `economy-reviewer` + `pytest -k event`
- [ ] EVT1-105: baseline 0 + §10/§11 по всему каталогу
- [ ] Крупный UI → design-lab
