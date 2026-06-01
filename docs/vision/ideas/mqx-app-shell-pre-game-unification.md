# MQX — оболочки pre-game и кнопки

**Статус:** утверждено направление (2026-05-25)  
**Спека:** [`specs/SPEC_APP_SHELL.md`](../../specs/SPEC_APP_SHELL.md)  
**Lab:** [`design-lab/pre-game-shell/`](../../../design-lab/pre-game-shell/)

## Problem Statement

**Как нам сделать так, чтобы от входа до старта партии игрок видел один визуальный язык MQX (оболочка + кнопки), без смешения TGUI, разных рамок и «чужого» hero при загрузке сессии?**

## Решения (зафиксировано)

| Вопрос | Решение |
|--------|---------|
| Login / Register | **Два route** (`/login`, `/register`) — без unified tabs |
| Процесс | **Только через design-lab** → ★ → `mqx/` → `#/dev/mqx` → prod |
| Кнопки | **Везде `MqxButton`** (pre-game, меню, модалки игры; TGUI — `AppRoot`, `Modal`, `Spinner`, `Input`) |

## Recommended Direction

**Волна D** эпика [`mqx-ui-unification.md`](mqx-ui-unification.md):

### Три режима оболочки (не одна рамка на всё)

| ID | Компонент / класс | Экраны |
|----|-------------------|--------|
| `PreGame.Bubble` | `MonetkaBubbleScreen` | `/login`, `/register`, стартовое меню |
| `PreGame.Flow` | `MqxMonetkaDialogScreen` + `mqx-frame--flat-flow` | новая игра (режим, шаблон) |
| `Game.Play` | `GameScreenLayout` + S5 без `mqx-frame` на контенте | партия |
| `Game.TabHero` | `MqxTabHero` | вкладки, меню в игре |

**Исключение снять:** `AuthGuard` loading → `PreGame.Bubble`, не `MqxTabHero` «Сессия».

### Кнопки MQX

| Было (TGUI) | Стало (`MqxButton`) |
|-------------|---------------------|
| `mode="filled"` stretched | `variant="primary"` `stretched` |
| `mode="outline"` stretched | `variant="secondary"` `stretched` |
| `mode="plain"` stretched | `variant="ghost"` `stretched` |
| `size="s"` filled/outline | `size="compact"` + primary/secondary |

## Key Assumptions to Validate

- [ ] Monetka bubble на входе + flat flow на новой игре не путают (5-секундный тест).
- [ ] `MqxButton` на узких экранах ≥ 44px по hit-area.
- [ ] Два route login/register остаются понятными без табов C.

## MVP Scope

**In:**

- Lab [`pre-game-shell/`](../../../design-lab/pre-game-shell/) — матрица экранов + кнопки ★
- `MqxButton`: `ghost`, `link`, `destructive`, `stretched`, `compact`
- Prod: Login, Register, StartMenu, NewProfileKind, GameTemplatePick, AuthGuard, MenuPremium
- Модалки `GameScreen` / `MqxConfirmDialog` — primary/secondary
- `#/dev/mqx` секция «Pre-game + кнопки»

**Out:**

- Unified auth tabs (вариант C)
- `BaseParamsScreen` / Plan
- `FinancePremium` / «Капитал» (волна C)
- Admin Watchtower
- Замена `Input` / `Modal` TGUI

## Not Doing

- Одна видимая `mqx-frame` на всех экранах — против S5
- Prod без lab ★
- Новые цвета вне `BRANDBOOK_MQX`

## Open Questions

- `EventsTriggerButton` и legacy `InsuranceSection` — в D.1 или отдельным PR после ★ lab?
