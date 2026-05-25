# Agent Skills ТВОЙ ХОД — что использовать и когда

Скиллы лежат в `.cursor/skills/` репозитория (проектные процедуры). Дополнительно доступны **глобальные** скиллы Cursor (`babysit`, `canvas`, `ci-investigator`, и т.д.) — их не дублируем в проекте.

Ориентир по стеку: **FastAPI + PostgreSQL + React TMA**, см. [`CLAUDE.md`](../../CLAUDE.md).

---

## Высокая ценность (часто)

| Скилл | Зачем в этом репозитории |
|-------|---------------------------|
| **frontend-ui-engineering** | MQX, Telegram UI, карточки, a11y-паттерны; **при работе с `mqx/` и новыми UI-паттернами — строго по FLOW** в [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) |
| **design-lab-mqx** | Макеты в `design-lab/`: self-contained CSS, `sync-lab.ps1`, без `../` в HTML; правило `money-quest-design-lab.mdc` |
| **spec-driven-development** | Новые фичи и контракты — сначала spec (`docs/specs/`) |
| **incremental-implementation** | Крупные изменения по шагам без монолитных PR |
| **debugging-and-error-recovery** | Периодная экономика, race на overview, ошибки API |
| **api-and-interface-design** | Эндпоинты `/api/...`, поля overview, синхронизация с `api.js` |
| **test-driven-development** | Логика `game_period`, расчёты — регрессии дорого стоят |
| **code-review-and-quality** | Перед merge UI и экономики |
| **git-workflow-and-versioning** | Ветки, атомарные коммиты по пользовательским правилам |
| **planning-and-task-breakdown** | Бэклог по слоям (docs), разбиение задач |
| **context-engineering** | Длинные сессии агента, что класть в rules vs skills |
| **using-agent-skills** | Навигация по каталогу скиллов |

---

## Средняя ценность (по ситуации)

| Скилл | Когда включать |
|-------|----------------|
| **browser-testing-with-devtools** | Визуальная проверка TMA, DOM, сеть (нужен MCP Chrome DevTools) |
| **documentation-and-adrs** | Архитектурные решения, изменение публичного API |
| **source-driven-development** | Официальные доки telegram-ui / React при спорных паттернах |
| **doubt-driven-development** | Высокие ставки: победа MVP, списания периода, деньги игрока |
| **deprecation-and-migration** | Переход `mode` → `save_kind`, смена контрактов |
| **security-and-hardening** | JWT, ввод пользователя, новые интеграции |
| **code-simplification** | После фазы роста `FinanceSection` и подобного |
| **performance-optimization** | CLS/LCP TMA, тяжёлые списки, лишние ререндеры |
| **idea-refine** | Продуктовые гипотезы до спеки (опционально bash-скрипт в папке — только Unix) |
| **social-changelog-posts** | Посты в соцсети по коммитам/сессии, трекер тем, картинки с Монеткой; **не трогает код** — [`docs/marketing/`](../marketing/) |
| **code-review-and-quality** | Перед merge; для лендинга после смены MQX — сверка со [`LANDING_SCREENSHOTS.md`](../specs/LANDING_SCREENSHOTS.md) |

---

## Низкая ценность в ближайшее время

| Скилл | Почему отложено |
|-------|------------------|
| ~~**ci-cd-and-automation**~~ | В репозитории нет `.github/workflows`; скилл удалён из проекта — вернуть при появлении CI |
| ~~**shipping-and-launch**~~ | MVP без формализованного релизного контура — вернуть перед продакшеном |

Если CI или чеклист релиза появятся — восстановите папки из резервной копии Cursor Skill Hub или скопируйте из другого проекта.

---

## Мета

| Скилл | Назначение |
|-------|------------|
| **project-cursor-skills-layout** | Где лежат Rules vs Skills в этом репозитории (`disable-model-invocation`: не дергать модель без нужды) |

---

## Связка Rules ↔ Skills

- **Rules** (`.cursor/rules/*.mdc`) — постоянные или по маске файлов (frontend/backend).
- **Skills** — процедуры по запросу («проведи ревью», «напиши spec»).

Спека UI: [`docs/specs/SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md).

**MQX / компонентная база:** правила `money-quest-frontend-mqx.mdc` и скилл **frontend-ui-engineering** обязаны отсылать к единому процессу [`DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) — варианты в `design-lab/` → утверждение → `mqx/` → `#/dev/mqx` → prod (не пропускать этапы без явного согласования или исключения «багфикс/hotfix»).

**Лендинг / скрины:** после заметной смены UI в игре — `cd landing && npm run capture-screens` (app-режим), обновить `last_capture` в [`landing/public/screens/README.md`](../../landing/public/screens/README.md); не снимать с `design-lab/dashboard/index.html` или `capital-page/#phone-demo` ([`LANDING_SCREENSHOTS.md`](../specs/LANDING_SCREENSHOTS.md)).

---

*Обновляйте таблицы при появлении CI, релизного процесса или нового домена (например Canvas SDK).*
