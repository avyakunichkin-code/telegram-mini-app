# Design improvements — backlog (не в скиллах до spec)

**Назначение:** идеи из UI-аудита (2026-05), которые **ещё не готовы** для обязательных правил агента.  
**В скиллах сейчас:** только то, что ссылается на существующие spec, токены, lab ★ и [`UI_CONSISTENCY_AUDIT.md`](../specs/UI_CONSISTENCY_AUDIT.md).

---

## Готово к правилам (уже в скиллах / spec)

| Тема | Источник правды |
|------|-----------------|
| Lab → ★ → MQX → prod | `DESIGN_WORKFLOW.md`, `design-lab-mqx`, `frontend-ui-engineering` |
| Self-contained lab, sync-lab | `tvoy-hod-design-lab.mdc`, `design-lab-mqx` |
| Canon Sync после prod | `tvoy-hod-canon-sync.mdc`, `release-tma` |
| Приоритет волны C (Финансы / капитал) | [`mqx-ui-unification.md`](../vision/ideas/mqx-ui-unification.md), `UI_CONSISTENCY_AUDIT` |
| Токены, типографика, tg-theme | `SPEC_FRONTEND_UI`, `tma-base.css`, `BRANDBOOK_MQX` |
| Row actions, capital IA | `SPEC_FRONTEND_UI` § Row Actions, capital-page ★ |
| Empty/error (цель) | Эпик B1 в unification; использовать `MqxCapitalEmpty` где уже есть |
| A11y Basic | `docs/ux/accessibility-requirements.md` |
| Juice A/C/D в prod | `design-lab/game-ui/juice-round/APPROVED.md` |
| UI states + icons (B1–B3) | [`design-lab/ui-states-unified/APPROVED.md`](../../design-lab/ui-states-unified/APPROVED.md) → `MqxCapitalEmpty`, `MqxStateError`, `MqxStateSkeleton`, ritual SVG |
| B4 — цели на дашборде | `MqxGoalDash` ★; `MqxLevelDash` / `.mqx-fin-empty` сняты |
| E2 / E5 — события | [`tails-round`](../../design-lab/events/tails-round/APPROVED.md) — halo + clamp/scroll |

---

## Сыровато — сначала spec / lab, потом скилл

| # | Идея | Что додумать | Куда положить потом |
|---|------|--------------|---------------------|
| D1 | **Motion tokens** (`--mq-motion-fast` …) | Шкала длительностей, reduced-motion, список компонентов | `tma-base.css` + `BRANDBOOK_MQX` + `SPEC_FRONTEND_UI` |
| D2 | **Haptic** (Telegram `HapticFeedback`) | Когда: зарплата, +cash, шаг цели; флаг отключения | `SPEC_FRONTEND_UI` или `SPEC_APP_SHELL` + hook |
| D3 | **Баннер «Рекомендуемое сейчас»** на главной | Продуктовые правила приоритета из `periodStatus` | `docs/ux/screens/dashboard.md` + lab round |
| D4 | **Финансы: простой / полный режим** | Порог unlock, что скрывать в MVP | idea-refine + `capital-page` lab |
| D5 | **Микрокопирайт: neutral / caution / celebrate** | Таблица фраз, запреты (казино-тон) | `BRANDBOOK.md` § голос |
| D6 | **Spacing / elevation tokens v2** | Имена, не дублировать ad-hoc в `mqx-*` | `styles/README.md` |
| D7 | **Juice B (Risk)** | Утвердить в lab | `game-ui/juice-round` → skill только после ★ |
| D9 | **Victory vs GoalDash** — один паттерн целей | B4, продукт + API | spec victory / dashboard |
| D10 | **Sparklines в аналитике** | Данные timeseries, плотность на 320px | `SPEC_ANALYTICS` + lab |
| D11 | **Квартальный competitive review** | Процесс, не автоматизация | `docs/agents/` runbook (опционально) |
| D12 | **Variable display font** в hero | Вес бандла, fallback | brandbook + perf gate |

---

## Критерий «можно в SKILL.md»

1. Есть **утверждение ★** или нормативный текст в `SPEC_*` / ADR.  
2. Агент может **проверить** без догадок (файл, класс, чеклист).  
3. Нет конфликта с открытым lab (не внедрять `dashboard-dual-accordion` и т.п.).

При закрытии пункта D* — перенести строку в «Готово» и одну строку в `frontend-ui-engineering` или `design-lab-mqx`.
