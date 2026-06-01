# Аудит Agent Skills — 2026-06-01

**Цель:** актуализировать карту скиллов, сверить `catalog.yaml` ↔ `SKILL.md` ↔ docs, решить что чистить.

**Проверки:** `node .cursor/skills/skill-test/_static-check.mjs` → **29 COMPLIANT**, 0 warnings.  
**Роутер:** `.cursor/rules/tvoy-hod-router.mdc` (фаза «контент и данные»).  
**Фаза:** [`SKILLS_PHASE_CONTENT_AND_DATA.md`](SKILLS_PHASE_CONTENT_AND_DATA.md).

---

## 1. Сводка по `catalog.yaml`

| `status` | Кол-во | Где `SKILL.md` |
|----------|--------|----------------|
| **active** | **17** | `.cursor/skills/<name>/` |
| **optional** | **12** | `.cursor/skills/<name>/` (`tier: deferred` или `support`/`meta`) |
| **archived** | **11** | `.cursor/skills/_archived/<name>/` |

**Итого в репозитории:** 29 рабочих + 11 archived = **40** записей в каталоге.

> Ранее в [`CURSOR_SKILLS.md`](CURSOR_SKILLS.md) было «15 active / 11 optional» — **устарело** (добавлены `critical-test-scenarios`, `event-analysis`, `balance-playtest`, `project-handbook-documentation` и др.).

### `tier: core` (primary по умолчанию)

`idea-refine`, `spec-driven-development`, `create-event`, `event-analysis`, `game-economy-and-victory`, `api-and-interface-design`, `design-lab-mqx`, `frontend-ui-engineering`, `incremental-implementation`, `test-driven-development`, `critical-test-scenarios`, `using-agent-skills`.

### `tier: support`

| Скилл | `status` | Когда |
|-------|----------|--------|
| `planning-and-task-breakdown` | active | Epic / MQ-* из spec |
| `code-review-and-quality` | active | Перед merge |
| `balance-playtest` | active | `/balance-playtest` после economy/events |
| `project-handbook-documentation` | active | GDD/handbook для людей |
| `documentation-and-adrs` | optional | ADR, границы доменов |

### `tier: deferred` (`status: optional`)

`browser-testing-with-devtools`, `code-simplification`, `context-engineering`, `deprecation-and-migration`, `doubt-driven-development`, `performance-optimization`, `release-tma`, `security-and-hardening`, `social-changelog-posts`, `telegram-mini-app-runtime`.

### `tier: meta`

`skill-test`, `project-cursor-skills-layout` (optional).

### Subagents (не skills)

`economy-reviewer`, `economy-balance-runner`, `mqx-ui-reviewer` — [`.cursor/agents/`](../.cursor/agents/), триггеры в `catalog.yaml` → `agents:`.

---

## 2. Слой вне каталога (не удалять, не путать)

### `frontend-react/.agents/skills/`

Vendored / adjunct-гайды для React (подключены через workspace rules, **не** в `catalog.yaml`):

| Пакет | Назначение |
|-------|------------|
| `react-best-practices` | Перф, waterfalls, bundle (AGENTS.md) |
| `composition-patterns` | Compound components |
| `accessibility`, `frontend-design`, `seo`, `vite` | Узкие FE-темы |

**Правило:** продуктовые процедуры — только `.cursor/skills/`; `.agents/` — справочник по React, без `writes_to` в репо-конвейер.

### Глобальные Cursor skills

`babysit`, `ci-investigator`, `thermo-nuclear-code-quality-review`, … — в [`CURSOR_SKILLS.md`](CURSOR_SKILLS.md) не дублируем.

---

## 3. Актуализация «используемых» (что трогать при работе)

| Ось (сейчас) | Primary | Satellites |
|--------------|---------|------------|
| События YAML | `create-event` | `test-driven-development`, `event-analysis` |
| Каталог read-only | `event-analysis` | → `create-event` |
| Период / победа / seeds | `game-economy-and-victory` | `test-driven-development`, `doubt-driven-development`, `balance-playtest` |
| API + FE контракт | `api-and-interface-design` | `test-driven-development`, `critical-test-scenarios` |
| UI prod | `frontend-ui-engineering` | `design-lab-mqx`, `code-review-and-quality` |
| UI lab | `design-lab-mqx` | → `frontend-ui-engineering` |
| Дашборд / sheet суммы | `frontend-ui-engineering` | `design-lab-mqx` (если меняется layout) |

**Недавний канон UI (2026-06):** подушка = `MqxCapitalSheet` + `InvestProductForm` (`mqx-sheet--amount`), без дублирующих subtabs — см. [`docs/ux/screens/dashboard.md`](../ux/screens/dashboard.md).

**Обновлено в каталоге:** `frontend-ui-engineering` → `must_read` включает `docs/ux/screens/dashboard.md`.

---

## 4. Кандидаты на «уборку» — вердикт

### Не удалять (намеренно deferred)

Все **12 optional** — не мусор, а **приглушение автоподключения** в фазе контента. Явный вызов (`/release-tma`, `/social-changelog`, …) остаётся валидным.

| Скилл | Почему оставить |
|-------|-----------------|
| `social-changelog-posts` | Есть `docs/marketing/` (посты, черновики) |
| `release-tma` | Guardrails перед выкаткой |
| `telegram-mini-app-runtime` | TMA-специфика отдельно от MQX |
| `doubt-driven-development` | Satellite для economy |
| `context-engineering` + `project-cursor-skills-layout` | Разные задачи (rules vs layout каталога); overlap терпим |

### Уже удалены ранее (не восстанавливать)

`ci-cd-and-automation`, `shipping-and-launch`, `source-driven-development`, `debugging-and-error-recovery`, `git-workflow-and-versioning` — см. [`CURSOR_SKILLS.md`](CURSOR_SKILLS.md) § «Удалённые из репозитория».

### `_archived/` (11 studio)

Оставить как есть: `disable-model-invocation`, явный вызов только по запросу GDD/studio.

### Orphan-папки / битые spec

**Нет:** все 29 non-archived имеют `SKILL.md` + spec; лишних папок в `.cursor/skills/` нет.

### Мёртый код внутри скиллов

| Артефакт | Статус |
|----------|--------|
| `safetyFundAmountPresets()` | Убран из UI; функция удалена из util (2026-06); остаётся `suggestSafetyFundAmount` |

---

## 5. Рекомендации (следующий проход, не блокер)

1. **Code-judo UI forms** — уже сделано: один `InvestProductForm` для депозита и подушки.
2. **`useMqxSheetScrollLock`** — вынесен; при желании подключить в `EventCarouselOverlay` / `AdminDrawer` (сейчас дублируют effect).
3. **Объединить meta-скиллы** — только если мешают: `context-engineering` ⊂ `project-cursor-skills-layout`; пока **не трогать**.
4. **Периодический прогон:** `node .cursor/skills/skill-test/_static-check.mjs` + выборочно `spec` / `context` после правок `catalog.yaml`.
5. **Не архивировать** `code-simplification` / `performance-optimization` до отдельной фазы «инженерный контур».

---

## 6. Действия по итогам аудита (2026-06-01)

- [x] Отчёт `SKILLS_AUDIT_2026-06-01.md`
- [x] Исправлены счётчики в `CURSOR_SKILLS.md`
- [x] `catalog.yaml` → `updated: 2026-06-01`, `dashboard.md` в `frontend-ui-engineering`
- [ ] По запросу: `/skill-test spec` для `create-event` / `game-economy` после крупных правил
- [ ] По запросу: второй проход «уборки» — только если появится скилл без вызовов 6+ месяцев

---

*Следующий аудит: при смене фазы (release/CI) или добавлении >3 новых скиллов.*
