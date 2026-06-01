---
name: design-lab-mqx
description: Design-lab rounds for MQX — self-contained HTML/CSS, sync-lab scripts, serve without broken ../ paths. Use when creating or editing design-lab/, layout variants, or before saying a lab mockup is ready for review.
argument-hint: "[design-lab theme or round path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Shell
---


# Design-lab MQX

## Прочитай сначала (ТВОЙ ХОД)

- [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md)
- [`docs/specs/SPEC_FRONTEND_UI.md`](../../../docs/specs/SPEC_FRONTEND_UI.md)
- [`docs/specs/UI_CONSISTENCY_AUDIT.md`](../../../docs/specs/UI_CONSISTENCY_AUDIT.md) — что ★ / ⚠ / 📋 lab
- [`docs/vision/ideas/mqx-ui-unification.md`](../../../docs/vision/ideas/mqx-ui-unification.md) — волны A/B/C
- [`design-lab/dashboard/APPROVED.md`](../../../design-lab/dashboard/APPROVED.md) (и `APPROVED.md` **темы раунда**, если есть)
- [`.cursor/rules/tvoy-hod-design-lab.mdc`](../../../.cursor/rules/tvoy-hod-design-lab.mdc), [`.cursor/rules/tvoy-hod-canon-sync.mdc`](../../../.cursor/rules/tvoy-hod-canon-sync.mdc)
- **[`docs/agents/DESIGN_LAB_NAVIGATION.md`](../../../docs/agents/DESIGN_LAB_NAVIGATION.md)** — хаб vs round vs parity vs `#/dev/mqx` (**прочитать при сомнении «куда смотреть»**)
- Отложенные идеи без spec: [`docs/agents/DESIGN_IMPROVEMENTS_BACKLOG.md`](../../../docs/agents/DESIGN_IMPROVEMENTS_BACKLOG.md)

**Куда писать:** `design-lab/<тема>/`. **Дальше:** `frontend-ui-engineering`.

## Навигация (обязательно)

| Задача | Действие |
|--------|----------|
| Показать/сравнить макеты | **`cd design-lab && npx serve .`** → хаб `/` (поиск), не `serve` в подпапке раунда |
| Новый раунд в хабе | Пункт в `design-lab/nav.manifest.json` → `cd frontend-react && npm run design-lab:build-nav` |
| Блоки дашборда на одной странице | `dashboard/parity-generated-page-round/` (генерится `design-lab:build`) |
| Блоки **Капитала** на одной странице | `finance/parity-generated-page-round/` |
| После ★ в React | `#/dev/mqx` |

Полная таблица: [`DESIGN_LAB_NAVIGATION.md`](../../../docs/agents/DESIGN_LAB_NAVIGATION.md).

## When to use

- Новый раунд или вариант в `design-lab/<тема>/`
- Правки `design-lab/**/styles.css` или родительских `styles.css` / `styles-monetka.css`
- Пользователь видит «голый» HTML без стилей в lab
- Перед сдачей макета на утверждение
- **Перед prod-кодом**, если другой скилл (frontend-ui-engineering, frontend-design) собирается менять UX в `*Premium.jsx` / `mqx/` — **сначала этот скилл**, lab, утверждение

Полный продуктовый цикл: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

## ⛔ Gate: без lab — без prod

Агент **не имеет права** менять компоновку/паттерны в prod, пока нет lab-раунда (или обновлённого `APPROVED.md` + parity) и явного утверждения пользователя. Retroactive: если prod уже изменён — создать parity round и синхронизировать docs в том же PR.

## Why styles break

`npx serve .` **не раздаёт родительские каталоги**. Любой `href="../..."` в `index.html` даёт 404.

## Self-contained layout (обязательно)

```
design-lab/<тема>/<round>/
  index.html          # только ./lab-base.css, ./styles.css, ./assets/...
  styles.css          # стили раунда
  lab-base.css        # AUTO — не править руками
  sync-lab.sh         # пересборка (bash, канон)
  assets/
    monetka-mascot.png
```

## Workflow

### 1. Создать или изменить макет

- Пишем варианты в `styles.css` раунда и при необходимости в `design-lab/<тема>/styles.css` (общие токены).
- В `index.html` — **только относительные `./` пути**.

### 2. Sync

**Канон — только bash:**

```bash
cd design-lab/<тема>/<round>
./sync-lab.sh
```

**Events (все раунды):**

```bash
cd design-lab/events
./sync-all-rounds.sh
```

**Без bash в PATH (Windows):**

```bash
cd frontend-react
npm run design-lab:sync-round -- design-lab/<тема>/<round>
```

Новый раунд: нативный `sync-lab.sh` по образцу [`capital-page/details-actions-round/sync-lab.sh`](../../../design-lab/capital-page/details-actions-round/sync-lab.sh) или [`game-templates/persona-portraits-round/sync-lab.sh`](../../../design-lab/game-templates/persona-portraits-round/sync-lab.sh). **Не** предлагать PowerShell `sync-lab.ps1` — устарело.

### 3. Verify

**Ревью для человека:** хаб `cd design-lab && npx serve .` → ссылка на раунд из навигации.

**Отладка раунда (404 CSS):**

```bash
cd design-lab/<тема>/<round>
./sync-lab.sh
npx serve .
```

В DevTools → Network: нет 404 на `.css` и `.png`.

**Автопроверка (CI / guardrails):**

```bash
cd frontend-react
npm run design-lab:check-rounds
```

Скрипт `scripts/check-design-lab-rounds.mjs`: нет `href="../…css"`, раунды с `sync-lab.sh` имеют актуальный `lab-base.css`. Входит в `design-lab:build` и `check:guardrails`.

### 4. Commit

Включить в коммит: `lab-base.css`, `assets/*`, `index.html`, `styles.css`, `sync-lab.sh`.

## Events-specific

| Раунд | sync-lab | lab-base включает |
|-------|----------|-------------------|
| `layout-round` | `./sync-lab.sh` → `events/_shared/sync-lab-round.sh` | `events/styles.css` + `styles-monetka.css` |
| `overlay-round` | то же | то же |
| `domains-round` | то же | + `layout-round/styles.css` при `ev-l3__` |
| `tails-round` | то же | + layout при необходимости |
| `capital-page/details-actions-round` | нативный `./sync-lab.sh` | flows + локальный `styles.css` |
| `character-needs/dashboard-needs-v7-round` | нативный `./sync-lab.sh` | `dashboard.css` (needs e2e3) |
| `game-templates/persona-portraits-round` | нативный `./sync-lab.sh` | game-templates + picker из prod |

После нового раунда events: добавить в `nav.manifest.json` → `npm run design-lab:build-nav`.

## Rules

- Cursor rule: `tvoy-hod-design-lab.mdc`
- MQX prod flow: `tvoy-hod-frontend-mqx.mdc`

## Качество раунда (из DESIGN_WORKFLOW — обязательно)

| Правило | Деталь |
|---------|--------|
| Варианты | **2–5** на один блок (A, B, C…), не больше |
| Данные | **Одинаковые** тестовые суммы/копирайт во всех вариантах |
| Язык | Видимый текст **на русском** |
| Бренд | Только канон: Quest Violet, emerald/danger по смыслу; токены из `styles/tma-base.css` / lab-base, **без новых hex** в вариантах |
| Подписи | В `README.md` раунда: идея каждого варианта + `npx serve .` + `./sync-lab.sh` |
| Тема TG | Светлая и тёмная — если экран в prod зависит от `tg-theme-*`, проверить оба |
| Не перерисовывать ★ | S5 dashboard, L3 events, pre-game ★ — новый lab только для **хвостов** (empty/error, capital, icons), см. unification |

**Приоритет lab:** **[`ui-states-unified/`](../../../design-lab/ui-states-unified/)** (B1+B2+B3 brief); **`capital-page/details-actions-round`** и **`character-needs/dashboard-needs-v7-round`** ★ в prod — только parity/hotfix. Не открывать параллельно 3+ крупных тем без запроса.

**Не предлагать в lab без явного запроса:** `dashboard-dual-accordion` (superseded), идеи из backlog D1–D12 без spec.

## Checklist (перед «готово»)

```
- [ ] index.html без ../ для статики
- [ ] ./sync-lab.sh запущен
- [ ] lab-base.css и assets закоммичены
- [ ] serve . — стили и Монетка на месте
- [ ] README раунда обновлён (запуск + sync)
- [ ] Новый round — пункт в `nav.manifest.json` + `design-lab:build-nav`
- [ ] Пользователю — ссылка через **хаб**, не только локальный `serve` в round
- [ ] 2–5 вариантов, одинаковые тест-данные, русские подписи
- [ ] Не дублирует уже ★ prod без пометки «полировка / хвост»
```

---

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

Перед созданием или изменением файлов в репозитории спроси: «Могу записать …?» — если пользователь не дал явное «делай» / «запиши».

## Следующий шаг

Утверждённый раунд → `frontend-ui-engineering` + canon sync (`tvoy-hod-canon-sync`).
