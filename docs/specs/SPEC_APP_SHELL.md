---
layer: spec
status: active
last_reviewed: 2026-05-25
audience: frontend, design-lab, agents
---

# App Shell MQX — pre-game и кнопки

**Идея:** [`mqx-app-shell-pre-game-unification.md`](../vision/ideas/mqx-app-shell-pre-game-unification.md)  
**Бренд:** [`BRANDBOOK_MQX.md`](../reference/brandbook/BRANDBOOK_MQX.md) · **Цикл UI:** [`DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md)

---

## 1. Цель

Единый визуальный язык от `/login` до `GameScreen`: предсказуемые оболочки и **только `MqxButton`** для действий (не `@telegram-apps/telegram-ui` `Button`).

**Исключения TGUI (остаются):** `AppRoot`, `Modal`, `Spinner`, `Input`, `Cell` где нет MQX-аналога.

---

## 2. Режимы оболочки

| Режим | React | CSS-маркер | Когда |
|-------|-------|------------|-------|
| **PreGame.Bubble** | `MonetkaBubbleScreen` | `mqx-auth-monetka`, `mqx-frame--pre-game`, TGS (`showLottieBackdrop`) | Login, Register, Start menu, AuthGuard loading |
| **PreGame.Flow** | `MqxMonetkaDialogScreen` | `mqx-flow--monetka-dialog`, `mqx-frame--flat-flow` | New game: режим, шаблон |
| **Game.TabHero** | `MqxShell` + `MqxTabHero` | `mqx-tab-page` | Капитал, аналитика, меню в игре |
| **Game.Play** | `GameScreenLayout` | `mqx-tab-page--dash-unified`, без рамки контента | Дашборд S5 |

**Запрещено:** `MqxTabHero` на auth-формах и проверке токена.

---

## 3. Маршруты (IA)

| Route / state | Оболочка | Кнопки |
|---------------|----------|--------|
| `/login` | Bubble | `MqxButton` |
| `/register` | Bubble | `MqxButton` |
| `AuthGuard` loading | Bubble + TGS, copy «Секунду, листаю полки» | — |
| Start menu | Bubble | `MqxButton` |
| New profile kind | Flow | `MqxButton` |
| Game templates | Flow | `MqxButton` |
| `GameScreen` | Play / TabHero | `MqxButton`, `mqx-action-chip` |

Login и register — **раздельные route**, без табов.

**Рамка `mqx-frame`:** на PreGame.Bubble и Flow — **без внешней обводки** (`border` / `box-shadow` сняты через `mqx-frame--pre-game` или `mqx-frame--flat-flow`). Внутренний пузырь Монетки с градиентом и хвостом сохраняется.

**Design-lab v2:** [`design-lab/pre-game-shell/`](../../design-lab/pre-game-shell/) — `sync-lab.sh` включает `auth-flow` + `new-game-mode` + локальные стили prod-классов.

---

## 4. `MqxButton` — контракт

| `variant` | Назначение | Бывший TGUI |
|-----------|------------|-------------|
| `primary` | Главный CTA | `filled` |
| `secondary` | Вторичный CTA | `outline` |
| `ghost` | Третичный / «Выйти» | `plain` |
| `link` | Текстовая ссылка в форме | `<button>` в `mqx-auth-monetka__link` |
| `destructive` | Опасное действие | `destructive` |
| `hero-filled` / `hero-outline` | Hero дашборда | — |

| Prop | Назначение |
|------|------------|
| `stretched` | `width: 100%` в колонке действий |
| `size="compact"` | Компакт в строке (`size="s"`) |

Стили: `index.css` `.mqx-btn*`. Lab: [`design-lab/pre-game-shell/`](../../design-lab/pre-game-shell/).

---

## 5. Design-lab → prod

1. Раунд [`design-lab/pre-game-shell/`](../../design-lab/pre-game-shell/) — все pre-game экраны + кнопки ★.
2. Явное ★ в чате.
3. Секция в `#/dev/mqx`.
4. PR: компоненты из §3, grep без `Button` из telegram-ui в user flows (кроме исключений §1).

---

## 6. Приёмка

- [ ] Login / Register / Start / New game визуально из одной системы (lab = prod).
- [ ] Loading auth без TabHero.
- [ ] `rg "Button.*@telegram-apps"` в `LoginForm`, `RegisterForm`, `StartMenuScreen`, `new-game/`, `MenuPremium`, `GameScreen` (модалки) — 0.
- [ ] `UI_CONSISTENCY_AUDIT` обновлён.

---

## 7. Не в scope

- Plan / `BaseParamsScreen`
- Расширение вкладки «Капитал» (`FinancePremium`) — не legacy `FinanceSection`
- CI-скриншоты лендинга
