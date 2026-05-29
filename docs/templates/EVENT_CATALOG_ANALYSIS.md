# Event Catalog Analysis — шаблон отчёта

Скопируйте в `docs/vision/analysis/event-catalog-<topic>-<YYYY-MM-DD>.md` или отдайте в чат по `/event-analysis`.

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

## По доменам (`event_domain`)

| domain | count | keys (кратко) | заметки |
|--------|-------|---------------|---------|
| consumption | | | |

## Персоны (до `audience_json`)

| key | студент | про | prereq hint |
|-----|---------|-----|-------------|
| mq11_friend_outing_student | ✓ | — | forbid car |

**Пары без второй половины:** …

## Баланс (ориентиры, не вердикт «весело»)

| key | tier | max \|cash_delta\| | % student (62.5k) | % pro (100k) | отказ 0₽ |
|-----|------|-------------------|-------------------|--------------|----------|
| | | | | | |

## Цепочки и особые типы

| chain / type | keys | complete? |
|--------------|------|-----------|
| family_money | request → callback | ✓ |
| used_car | offer → deadline | ✓ |
| rescue | | |
| inactive | mq11_refinance_bank | |

## Дубли и перегруз

- …

## Gaps (рекомендации, без автозаписи в YAML)

| P | gap | suggested domain | next |
|---|-----|------------------|------|
| P1 | нет `_pro` для … | social_family | `/create-event` + brief? |

## Risks / handoff

- [ ] После правок каталога → `economy-reviewer` + `pytest -k event`
- [ ] Крупный UI → design-lab
