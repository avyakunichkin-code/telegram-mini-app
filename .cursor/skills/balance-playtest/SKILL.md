---
name: balance-playtest
description: >-
  Runs headless 30-40 period balance simulation, compares JSON report to baseline,
  produces diff markdown. Use for /balance-playtest after economy/events/seeds changes.
  Does not replace economy-reviewer (pytest/code) or human playtest.
argument-hint: "[policy: tutorial|safety_first|passive] [periods: 40]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Shell
---

# Balance playtest (/balance-playtest)

**Количественная** проверка баланса: детерминированный бот, JSON, diff к baseline.

**Не путать с:**

| Инструмент | Когда |
|------------|--------|
| **`economy-reviewer`** | ревью diff, pytest gate |
| **`game-economy-and-victory`** | правки `period.py`, victory, seeds |
| **`event-analysis`** | read-only обзор YAML каталога |
| Человек в TMA | UX, «нравится», тайминг сессии |

**Мантра:** *Скрипт считает числа · Skill запускает и читает diff · Subagent выносит verdict.*

**Evidence-based:** вердикт только по JSON-отчёту, `balance_diff` и exit code — не «на глаз»; воспроизведение через `balance_playtest.py` / manifest.

**Safety:** не merge по балансу при флаге REGRESSION; обновление baseline — только по явному согласию; не трактовать сдвиг метрик как «лучше» без продукта; при риске ложного PASS — **security** gate через pytest + `economy-reviewer`.

## Прочитай сначала

- [`docs/balance/README.md`](../../../docs/balance/README.md)
- [`docs/decisions/ADR-009-metrics-dictionary-tb1.md`](../../../docs/decisions/ADR-009-metrics-dictionary-tb1.md)
- [`backend/scripts/balance_simulate.py`](../../../backend/scripts/balance_simulate.py)
- [`backend/scripts/balance_diff.py`](../../../backend/scripts/balance_diff.py)

**Satellites:** после правок движка → **`test-driven-development`** + **`economy-reviewer`**; спорные цифры → **`doubt-driven-development`**.

**Дальше:** `game-economy-and-victory`, `test-driven-development` (см. `catalog.yaml` → `next_skill`).

## Параметры (по умолчанию)

| Параметр | Default |
|----------|---------|
| template | `mq_game_basic_v1` (Студент) |
| periods | `40` |
| policy | `tutorial` |
| baseline | `docs/balance/baselines/main__student_tutorial_40p.json` |

Дополнительно по запросу: `safety_first`, `passive`.

---

## Workflow

### 1. Полный прогон (рекомендуется)

```powershell
cd backend
python scripts/balance_playtest.py
```

Читает [`docs/balance/baselines/manifest.yaml`](../../../docs/balance/baselines/manifest.yaml), гоняет все эталоны, пишет `docs/balance/reports/latest_diff__*.md` и `playtest_summary_latest.json`.

Exit code `1` = хотя бы один сценарий с флагами `REGRESSION`.

### 2. Один сценарий

```powershell
python scripts/balance_simulate.py --policy tutorial --periods 40 --out ../docs/balance/reports/current.json --format md
python scripts/balance_diff.py --current ../docs/balance/reports/current.json --baseline ../docs/balance/baselines/main__student_tutorial_40p.json --out ../docs/balance/reports/latest_diff.md
```

Baseline для `safety_first`: `main__student_safety_first_40p.json`.

### 3. Интерпретация (в ответе пользователю)

Кратко:

- **win_at_period**, **goals_met**, **defeated**
- **cash_p12 / p20 / p40**, **periods_to_safety_3x**
- флаги из diff

**Не** решать «30000 лучше 20000» без продукта — только «сдвиг относительно baseline».

### 4. Verdict

Итог для пользователя и `catalog`: **PASS** (OK) · **CONCERNS** (REVIEW) · **FAIL** (REGRESSION LIKELY). Baseline принят явно → **COMPLIANT** с новым эталоном; без согласования на merge → **NON-COMPLIANT** по процессу.

```text
## Balance playtest — VERDICT: OK | REVIEW | REGRESSION LIKELY

### Сценарий
template / policy / periods / git

### Сводка (3–5 строк)
...

### Diff highlights
...

### Рекомендация
- merge по балансу: да/нет/нужен human playtest
- обновить baseline: да/нет
```

### 5. Обновление baseline

Только если пользователь **явно** принял новый эталон:

```powershell
python scripts/balance_simulate.py --policy tutorial --periods 40 --out ../docs/balance/baselines/main__student_tutorial_40p.json
```

+ запись в `docs/foundation/DOC_SYNC_LOG.md`.

---

## Когда вызывать

- После изменений `backend/app/game/period.py`, `victory/`, `data/events/mvp11/`, seeds, `victory_config_json`
- После серии событий в YAML (крупный PR)
- Ручной `/balance-playtest` — всегда ок

**Не** блокировать каждый коммит до стабилизации baseline.
