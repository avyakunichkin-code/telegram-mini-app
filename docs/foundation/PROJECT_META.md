# ТВОЙ ХОД — метаданные проекта

Снимок **на 2026-06-01** (локальный репозиторий). Цель — одна страница «о масштабе проекта» для онбординга, отчётов и плейтеста. Числа **не** подменяют [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) и [`TRACEABILITY.md`](../TRACEABILITY.md) как источник статусов работ.

**Как обновлять:** пересчитать раздел [§7](#7-как-пересчитать-локально) раз в спринт или перед Pre-Alpha / релизом; дату снимка менять в шапке.

---

## 1. О продукте (кратко)

| Поле | Значение |
|------|----------|
| **Название** | ТВОЙ ХОД |
| **Формат** | Telegram Mini App (PWA / standalone в работе) |
| **Жанр** | Финансовая грамотность, пошаговые «месяцы», события, цели победы |
| **MVP в prod** | Game mode, шаблоны старта, Victory v2 (chain), события MVP 1.1, инвестиции, страховки, Z-NEEDS (ядро) |
| **Канон продукта** | [`SPEC_PRODUCT.md`](SPEC_PRODUCT.md) · [`handbook/GAME.md`](../handbook/GAME.md) |
| **Техонбординг** | [`CLAUDE.md`](../../CLAUDE.md) |
| **Стек** | Backend: FastAPI, SQLAlchemy, PostgreSQL · Frontend: React + Vite, MQX · Миграции: SQL-файлы + лёгкая автомиграция в `main.py` |

---

## 2. Время и git

| Метрика | Значение | Примечание |
|---------|----------|------------|
| **Первая фиксация в git** | **2026-04-30** (`init`) | Дата «старта отсчёта» в этом документе |
| **Последний коммит (на снимок)** | 2026-05-31 | |
| **Календарных дней с `init`** | **32** | До 2026-06-01 включительно |
| **Коммитов в `HEAD`** | **173** | Вся история в текущей ветке |

> Если нужна «дата идеи до репозитория» — зафиксируйте вручную в таблице ниже; git её не знает.

| Веха (опционально) | Дата |
|--------------------|------|
| Решение о TMA / MVP | _заполнить при необходимости_ |
| Pre-Alpha wave 1 | см. [`PRE_ALPHA_WAVE1_OPS.md`](PRE_ALPHA_WAVE1_OPS.md) |

---

## 3. Репозиторий: файлы

Исключены: `node_modules`, `.git`, `__pycache__`, `.pytest_cache`, `dist`, `build`, `.venv`.

| Область | Файлов (.md / код) | Комментарий |
|---------|-------------------|-------------|
| **Документация** `docs/**/*.md` | **179** | Все markdown в `docs/` |
| **Backend** `*.py` | **179** | `backend/`, без кэшей |
| **Frontend** `src` | **134** `.jsx` + **63** `.js` | Без `node_modules` |
| **SQL-миграции** | **43** | `backend/migrations/` |
| **Контент событий** YAML | **13** | `data/events/` (MVP 1.1 каталог) |
| **Design Lab** (все файлы) | **410** | Прототипы и статика lab |
| **Agent skills** `SKILL.md` | **40** | `.cursor/skills/` |

---

## 4. Объём кода (строки)

Подсчёт: непустые строки через обход файлов (PowerShell `Measure-Object -Line`), **без** построчного анализа AST. Погрешность ± несколько процентов из‑за пустых строк и generated-кода.

### 4.1 Продакшен-код (основной ориентир)

Пути: `backend/`, `frontend-react/src/`, `landing/` · расширения: `.py`, `.js`, `.jsx` · без `design-lab`.

| Расширение | Строк |
|------------|------:|
| `.py` | ~18 400* |
| `.jsx` | ~10 100* |
| `.js` | ~5 000* |
| **Итого prod** | **~32 100** |

\*Сумма по prod-путям на снимок; отдельно по всему репо `.py` ≈ 18 766.

### 4.2 Весь репозиторий (включая стили lab)

| Расширение | Строк | Заметка |
|------------|------:|---------|
| `.css` | ~65 400 | Большая доля — `design-lab/` и MQX-стили |
| `.py` | ~18 800 | Включая тесты |
| `.jsx` | ~10 100 | |
| `.js` | ~5 000 | |
| `.sql` | ~1 100 | Миграции |
| **Итого (все перечисленные)** | **~100 400** | Не использовать как «размер продукта» без контекста |

**Рекомендация для отчётов:** указывать **§4.1 (~32k строк prod)**; CSS и lab — отдельной строкой.

---

## 5. Документация (структура)

| Слой | Кол-во .md | Где |
|------|------------|-----|
| **Specs** (features + gameplay + корень) | **20** | `docs/specs/` |
| **ADR** | **9** (+ README) | `docs/decisions/` |
| **Plans** | **11** (+ README) | `docs/plans/` |
| **Vision / ideas** | **~38** уникальных | `docs/vision/ideas/` |
| **Handbook** | пакет GDD | `docs/handbook/` |
| **Backlog** | 2 основных файла | `PRODUCT_BACKLOG`, `TELEGRAM_BACKLOG` |

Конвейер: [`DOCUMENTATION_SYSTEM.md`](../DOCUMENTATION_SYSTEM.md) · карта: [`docs/README.md`](../README.md).

---

## 6. Бэклог и эпики

Источники: [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) (сводка эпиков), [`TRACEABILITY.md`](../TRACEABILITY.md) (idea → spec → plan).

### 6.1 Эпики в сводке PRODUCT_BACKLOG (14 шт.)

| Статус | ID | Комментарий |
|--------|-----|-------------|
| ✅ Закрыто в коде / P1 | **G1**, **M11**, **V2**, **I1**, **T1** | Plan UI и плейтест M11/α — отдельно |
| 🟡 В работе / частично | **CN1**, **O1**, **A0**, **PW1**, **AF1** | |
| ⏸ На паузе (2026-05-30) | **M12**, **E1** | idea-refine / ждём spec |
| ⬜ Не начато / гейт | **α**, **TG1** | Pre-Alpha, Telegram backlog |

**Грубо:** ~5 эпиков «основной контур сделан», ~5 «в полёте», ~2 пауза, ~2 открытые волны.

### 6.2 Чеклисты в PRODUCT_BACKLOG

| Метрика | Значение |
|---------|----------|
| Строк `- [ ]` / `- [x]` | **100** |
| Выполнено `[x]` | **59** |
| Открыто `[ ]` | **41** |
| Упоминаний `MQ-*` в файле | **16** |

### 6.3 TELEGRAM_BACKLOG

| Метрика | Значение |
|---------|----------|
| Чеклист-пункты | **12** |

### 6.4 Тесты (автоматизация)

| Область | Значение |
|---------|----------|
| **pytest** (сбор) | **269** тестов |
| **Vitest / FE** `*.test.js` | **8** файлов |

---

## 7. Игровой контент и инфраструктура

| Метрика | Значение |
|---------|----------|
| YAML-файлы событий (mvp11) | **13** |
| SQL-миграции | **43** |
| Game starter templates | **4** в prod (tutorial + 3 сценария; см. seeds / `game_starter_templates`) |
| Событий на период (канон TB1) | **2** | ADR-009, SPEC_PRODUCT §3.3 |

---

## 8. Варианты оформления (что выбрали и альтернативы)

| Вариант | Суть | Плюсы | Минусы |
|---------|------|-------|--------|
| **A. Одна таблица** | Всё в 15 строк | Быстро читать | Быстро устаревает, нет методологии |
| **B. Dashboard (выбран)** | Разделы: продукт → время → код → docs → бэклог | Удобно обновлять по §7; честно про CSS/lab | Длиннее одной таблицы |
| **C. `PROJECT_META.json` + MD** | JSON для CI/скриптов, MD для людей | Авто-дашборд в CI | Нужен скрипт и дисциплина |
| **D. Только в handbook** | Раздел в `GAME.md` | Рядом с GDD | Смешивает дизайн и инженерию |

**Текущий выбор:** **B** в `docs/foundation/`. При росте команды имеет смысл добавить **C** (`scripts/project-meta.ps1` → JSON) без удаления этой страницы.

---

## 9. Как пересчитать локально

PowerShell из корня репозитория:

```powershell
# Даты git
git log --reverse --format="%ai" -1
git rev-list --count HEAD

# Файлы docs
(Get-ChildItem docs -Recurse -Filter *.md -File).Count

# Строки prod-кода (py + js + jsx, без design-lab)
$paths = @('backend','frontend-react\src','landing')
$exts = '.py','.js','.jsx'
$exclude = 'node_modules|\.git|__pycache__|\.pytest_cache|design-lab'
$total = 0
Get-ChildItem $paths -Recurse -File | Where-Object {
  $exts -contains $_.Extension -and $_.FullName -notmatch $exclude
} | ForEach-Object {
  $total += (Get-Content $_.FullName | Measure-Object -Line).Lines
}
"PROD_LINES=$total"

# pytest
Set-Location backend; python -m pytest --collect-only -q 2>&1 | Select-String "tests collected"
```

Чеклисты бэклога:

```powershell
Select-String -Path docs\backlog\PRODUCT_BACKLOG.md -Pattern '^- \[x\]' | Measure-Object
Select-String -Path docs\backlog\PRODUCT_BACKLOG.md -Pattern '^- \[ \]' | Measure-Object
```

---

## 10. Связанные документы

| Документ | Зачем |
|----------|--------|
| [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) | Актуальные задачи P0–P3 |
| [`TRACEABILITY.md`](../TRACEABILITY.md) | Эпики и статусы spec/plan |
| [`DOC_SYNC_LOG.md`](DOC_SYNC_LOG.md) | Когда код и docs расходились |
| [`handbook/FEATURE_STATUS.md`](../handbook/FEATURE_STATUS.md) | Матрица фич для людей |
| [`KPI_AND_PHASES.md`](../handbook/KPI_AND_PHASES.md) | Фазы и метрики продукта |
