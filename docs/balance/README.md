# Balance playtest (симуляция партии)

Детерминированный прогон **N периодов** через headless API (`TestClient` + SQLite), фиксированные **политики бота**, JSON-отчёт и **diff** к baseline.

**Словарь метрик:** [`docs/decisions/ADR-009-metrics-dictionary-tb1.md`](../decisions/ADR-009-metrics-dictionary-tb1.md)  
**Пороги diff:** [`THRESHOLDS.md`](THRESHOLDS.md)

## Быстрый старт

```powershell
cd backend
# Все эталоны из manifest (tutorial + safety_first)
python scripts/balance_playtest.py

# Или PowerShell-обёртка
.\scripts\balance_playtest.ps1

# Один сценарий
python scripts/balance_simulate.py --policy tutorial --periods 40 --out ../docs/balance/reports/current.json --format md
python scripts/balance_diff.py --current ../docs/balance/reports/current.json --baseline ../docs/balance/baselines/main__student_tutorial_40p.json
```

## Политики бота

| ID | Поведение |
|----|-----------|
| `tutorial` | зарплата → события (max affordable Δcash) → подушка 5k (1×) → депозит 10k @12% (1×) |
| `safety_first` | то же по событиям; переводы в подушку до `safety_fund_baseline_target` |
| `passive` | зарплата → события (min affordable Δcash); без проактивной подушки/инвеста |

Бот **не** заменяет плейтест человеком; ловит регрессии формул и данных.

**Воспроизводимость:** по умолчанию `--rng-seed 42`. Для «живого» пула: `--rng-seed -1`.

## Каталоги

| Путь | Назначение |
|------|------------|
| `baselines/manifest.yaml` | список эталонов и параметров |
| `baselines/*.json` | эталонные снимки (в git) |
| `reports/` | локальные прогоны, diff, `playtest_summary_latest.json` |

## Обновить baseline

После согласования «новый эталон»:

```powershell
cd backend
python scripts/balance_playtest.py --update-baselines
```

Или один файл:

```powershell
python scripts/balance_simulate.py --policy safety_first --periods 40 --out ../docs/balance/baselines/main__student_safety_first_40p.json
```

+ запись в `docs/foundation/DOC_SYNC_LOG.md`.

## Инструменты агента

| Инструмент | Роль |
|------------|------|
| Skill **`/balance-playtest`** | процедура; полный прогон = `balance_playtest.py` |
| Subagent **`economy-balance-runner`** | оркестрация + verdict |
| **`economy-reviewer`** | код + pytest (не симуляция) |

**Hook:** правки `game/`, `victory/`, `seeds/`, `data/events/mvp11/` → напоминание запустить playtest.

## Pytest

```powershell
cd backend
python -m pytest -q tests/test_balance_simulate.py
```
