---
layer: ux
status: approved
last_reviewed: 2026-06-01
platform: Telegram Mini App
screen_id: character-pick
prod_route: GameTemplatePickScreen
---

# UX Spec: Выбор персонажа (старт Game)

> **Replaces copy:** «Шаблон» / «сценарий» → **«персонаж» / «жизнь»** где уместно  
> **Lab:** [`design-lab/game-templates/persona-portraits-round/`](../../../design-lab/game-templates/persona-portraits-round/) ★ портреты · [`game-templates/`](../../../design-lab/game-templates/) копирайт

---

## Purpose & Player Need

Игрок выбирает **чью жизнь прожить**, понимая отличие не только по деньгам, но по **поддержке и жёсткости** потребностей.

*«Какой персонаж мне подходит — мягкий старт или сложная жизнь?»*

---

## Copy decisions (approved)

| Было | Стало |
|------|-------|
| Выбор шаблона | **Выбор персонажа** |
| Сложность шаблона | **Стиль жизни** / подпись под карточкой |
| template description | + строка **поддержка:** «Подсказки на дашборде» / «Минимум подсказок, сильные последствия» |

### Подписи per persona (черновик)

| template | Заголовок | Подзаголовок (1 строка) |
|----------|-----------|-------------------------|
| `mq_game_basic_v1` | Студент | Мягче последствия, больше подсказок |
| `mq_game_tight_budget_v1` | Специалист | Сбалансированная жизнь |
| `mq_game_mortgage_stress_v1` | Семья | Акцент на связях и быте |
| `mq_game_debt_stack_v1` | Предприниматель | Сильное давление, мало подсказок |

**Не обещать** в UI разные правила поражения — поражение одинаково ([ADR-005](../../decisions/ADR-005-character-needs-state-and-defeat.md)).

---

## Layout changes (минимальные)

- Screen title: **Выбор персонажа**.
- Под title: lead 1 предложение — «У каждой жизни свой ритм и свои потребности: комфорт, статус, связи, здоровье.»
- Карточки: `MqxStarterScenarioPicker` с **растровыми портретами** (`usePersonaPortraits`, по умолчанию `true`) + bullets из API.
- Ассеты: `frontend-react/src/assets/character-portraits/`; пересборка — `npm run persona-portraits:process` (см. lab README).
- SVG I-Scene (`ScenarioIllustrations`) — **не** канон шага 2; остаётся в коде как fallback при `usePersonaPortraits={false}`.

---

## Acceptance Criteria

1. Видимый заголовок «Выбор персонажа» на экране старта Game.
2. У каждой карточки есть отличимая строка про стиль жизни/поддержку.
3. Нет формулировок «шаблон сложности» без контекста жизни.
4. Plan mode tile не затронут.
5. У каждой карточки виден **отличимый** портрет персонажа (не одинаковое лицо на всех ролях).
