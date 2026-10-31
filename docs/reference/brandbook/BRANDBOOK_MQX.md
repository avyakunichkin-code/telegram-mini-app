---
tags:
  - tvoy-hod/layer/reference
aliases:
  - "ТВОЙ ХОД — Product UI (MQX)"
  - BRANDBOOK_MQX
---
# ТВОЙ ХОД — Product UI (MQX)

**Версия:** 1.1 (слой Product UI брендбука v2)  
**Дата:** май 2026; реестр ★ и статусы — 2026-10-29  
**Аудитория:** frontend, дизайн lab, агенты Claude Code  

**Связанные документы:**  
[`BRANDBOOK.md`](BRANDBOOK.md) (identity, лого, голос, Монетка) · [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) · [`DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) · стили [`styles/README.md`](../../../frontend-react/src/styles/README.md) (barrel [`index.css`](../../../frontend-react/src/index.css))

**PDF:** [`brandbook-mqx-print.html`](brandbook-mqx-print.html) → печать **Product UI Guidelines**.

> **Что здесь актуально (2026-10-29).** С октября 2026 вид игры задают ★ BG-1…BG-3 «настольная игра» ([ADR-014](../../decisions/ADR-014-brand-direction-board-game.md), [`board-game/APPROVED.md`](../../../design-lab/board-game/APPROVED.md)). Токены, типографика, объём и движение — **дизайн-система MQX v3** ([`design/`](../../../design/README.md)) и рантайм [`styles/tokens.css`](../../../frontend-react/src/styles/tokens.css). Разделы 4–5 и чеклист §9 ниже описывают v1 (май 2026: стекло, `--mq-violet`, шрифты 10–11 px) и оставлены как история — при конфликте прав v3 и `APPROVED.md` ([C-1](../../../CONVENTIONS.md)). Актуальный чеклист — §9a.

---

## 1. Что такое MQX

**MQX** — премиум-слой поверх `@telegram-apps/telegram-ui`: hero, стеклянные карточки, нижняя навигация, токены, согласованные с темой Telegram. Цель — одно приложение на всех вкладках, старте и auth.

Новый видимый UI: **design-lab → ★ → `mqx/` → prod** (исключение: багфикс/hotfix без смены дизайна).

---

## 2. Реестр утверждений UI ★

| Решение | ID | Дата | Lab | Prod |
|---------|-----|------|-----|------|
| Логотип full / compact | G1, G2 | 2026-05-20 | [`brand-logo/APPROVED.md`](../../../design-lab/brand-logo/APPROVED.md) | `BrandLogo`, `BrandMark` |
| Dashboard unified | S5 + L3 | 2026-05 | [`dashboard/APPROVED.md`](../../../design-lab/dashboard/APPROVED.md) | `DashboardPremium`, `mqx-tab-page--dash-unified` |
| Guided onboarding (O2) | strip A ★ | 2026-06-01 | [`onboarding-o2/APPROVED.md`](../../../design-lab/onboarding-o2/APPROVED.md) | `MqxGuidanceStrip`, `GameGuidanceLayer` |
| New game mode pick | R2 + I1 | 2026-05-20 | [`new-game-mode/APPROVED.md`](../../../design-lab/new-game-mode/APPROVED.md) | `NewProfileKindScreen`, `MqxSaveKindPicker` |
| Портреты 4 персонажей | P-P | 2026-06-01 | [`game-templates/persona-portraits-round/APPROVED.md`](../../../design-lab/game-templates/persona-portraits-round/APPROVED.md) | `PersonaPortrait`, `MqxStarterScenarioPicker`, `MqxNeedsDash` |
| Капитал: Details \| Actions | Capital | — | [`capital-page/details-actions-round/`](../../../design-lab/capital-page/details-actions-round/) | `FinancePremium` v2, tab label «Капитал» |
| Цель на дашборде | G1 chain | 2026-05 | [`dashboard/goal-chain-round/`](../../../design-lab/dashboard/goal-chain-round/) | `MqxGoalDash` |
| Лендинг (скрины UI) | — | 2026-05-25 | capture app / lab fallback | [`LANDING_SCREENSHOTS.md`](../../specs/LANDING_SCREENSHOTS.md) |
| Pre-game shell + кнопки | P1–P6 | 2026-05-25 | [`pre-game-shell/`](../../../design-lab/pre-game-shell/) | `MqxButton`, Bubble/Flow — [`SPEC_APP_SHELL.md`](../../specs/SPEC_APP_SHELL.md) |
| Шкала типографики MQX | type-scale | 2026-05-25 | [`type-scale-round/APPROVED.md`](../../../design-lab/type-scale-round/APPROVED.md) | `#root` в `styles/tma-base.css`, dashboard в `styles/mqx/dashboard.css` |
| Дашборд «настольная игра», токены v2, Nunito + Manrope | ★ BG-1 | 2026-10-14 | [`board-game/hybrid-round/`](../../../design-lab/board-game/hybrid-round/) | `DashboardPremium`, `styles/mqx/board.css`, `tokens.css` |
| Остальные экраны в стиле BG | ★ BG-2 | 2026-10-15 | [`board-game/screens-round/`](../../../design-lab/board-game/screens-round/) | события, Капитал, Аналитика, Меню, Вход, Выбор жизни, финал |
| Одна рамка на уровень | ★ BG-3 | 2026-10-25 | [`board-game/frames-round/`](../../../design-lab/board-game/frames-round/) (E) | главная, Капитал · Действия, Аналитика (2026-10-26) |
| Превью конца хода «Спишется · останется» | ★ PR-07 | 2026-10-26 | [`board-game/close-preview-round/`](../../../design-lab/board-game/close-preview-round/) (A) | `MqxDashboardHero`, `MqxFinancePeriodBlock`, `buildTurnTip` |
| «Чернильный край» (необрутализм A) | пробно, не ★ | 2026-10-28 | [`board-game/neobrutal-a-round/`](../../../design-lab/board-game/neobrutal-a-round/README.md), [`ink-sheets-round/`](../../../design-lab/board-game/ink-sheets-round/README.md) | слой `styles/mqx/ink.css`, `utils/mqxStyle.js`; `?style=classic` — без слоя |
| Маскоты: Монетка на ободе, Квитя, напарники | review | 2026-10-29 | [`mascots/`](../../../design-lab/mascots/) | — (в prod не переносить без «утверждаем») |

Mission Brief (3 карточки) — **superseded** guided onboarding. Dashboard S5 и стеклянные карточки — **superseded** ★ BG-1 (ADR-014).

---

## 3. Каркас экрана

| Уровень | Класс / компонент | Назначение |
|--------|-------------------|------------|
| Страница | `app-shell mq-page`, `mq-page--auth` | Поля, `mq-page__decor` (`prefers-reduced-motion`) |
| Колонка | `#root`, max-width **480px** | Одна колонка TMA |
| Рама | `mqx-screen` → `mqx-frame` | `--mqx-surface-a/b`, не «вечный белый» в тёмном TG |
| Оболочка | `MqxShell` | header + `mqx-content` |
| Таб-hero | `MqxTabHero` | `BrandLogo variant="compact"` (G2) |
| Старт / auth | `BrandMark` | G1 full по центру |
| Онбординг | `MqxGuidanceStrip`, `MqxMonetkaDialogScreen` | Bottom strip O2 + Монетка в диалогах |

**Dashboard (S5):** hero на всю ширину, контент без рамки `mqx-frame`, inset-разделители, таббар — активная **вся ячейка** градиентом.

---

## 4. Цвет в рантайме

**Приоритет:** `tg-theme-*` для фона и текста. CTA и табы — **Quest Violet** (`--mq-accent-fill`), не голубой акцент клиента по умолчанию.

| CSS-переменная | HEX (fallback) | Роль |
|----------------|----------------|------|
| `--mq-violet` | `#6D28D9` | CTA, активные табы |
| `--mq-violet-deep` | `#5B21B6` | Hover, ссылки |
| `--mq-emerald` | `#059669` | Плюс к деньгам |
| `--mq-danger` | `#DC2626` | Просрочка, ошибки |
| `--mq-warning` | `#D97706` | Предупреждение, ожидание |
| `--mqx-ink` | из `tg-theme-text` | Текст MQX-блоков |
| `--mqx-glass-strong` … `softer` | mix с `tg-theme-bg` | Карточки «стекло» |

Полная таблица identity-цветов (Coin Gold, Ink, Mist…) — [`BRANDBOOK.md` §4](BRANDBOOK.md#4-цветовая-палитра).

---

## 5. Типографика TMA

На `#root` (★ type-scale-round, display **A = 26px**):

| Токен | px | Роль |
|-------|-----|------|
| `--mq-fs-display` | 26 | Крупная цифра hero |
| `--mq-fs-stat` | 34 | Крупная KPI-цифра (аналитика), не считать в «4 уровнях» экрана |
| `--mq-fs-title` | 20 | Крупные заголовки экрана |
| `--mq-fs-heading` | 14 | Заголовки секций (`mqx-finance-static__title`) |
| `--mq-fs-body` | 15 | Основной текст |
| `--mq-fs-caption` | 12 | Суммы в chip, pill, подсказка периода |
| `--mq-fs-small` | 11 | Подписи chip действий |
| `--mq-fs-micro` | 10 | Kicker (label chip, «Период») |

Веса: `--mq-fw-regular` 400, `--mq-fw-medium` 550, `--mq-fw-bold` 700, `--mq-fw-heavy` 800.  
Межстрочные: `--mq-lh-tight` 1.15, `--mq-lh-body` 1.42, `--mq-lh-relaxed` 1.45.

Решение принято ([ADR-014](../../decisions/ADR-014-brand-direction-board-game.md)): отдельная пара webfont для PWA/web/TMA, конкретная пара — ★ раунда design-lab; до него — системный стек.  
Не более **четырёх** текстовых уровней на одном экране (иерархия, не считая tabular-цифры).

---

## 6. Компонентные паттерны

| Паттерн | Классы / компоненты |
|---------|---------------------|
| Карточка цели | `mqx-card mqx-card--goal` |
| Карточка раздела | `mqx-card`, `mqx-card__kicker`, `mqx-card__title` |
| KPI сетка | `mqx-grid2`, `mqx-mini`, `mqx-accent--*` |
| Капитал | `mqx-capital-card`, `MqxSubtab`, `MqxFinListRow`, `CapitalPositionCard` |
| Порядок разделов | **Доходы → Расходы → Инвестиции → Страховки → Имущество → Обязательства** |
| Сегмент каталог/позиции | **«Добавить \| Мои (N)»** внутри карточки раздела, не в hero |
| Строки | `mqx-fin-row`, `MqxFinListRow` + `MqxRowAction` |
| Поля | `.mq-field` (где Cell мешает клику) |
| Таббар | `.bottom-nav`, `--tma-tabbar-height: 64px` |

**Скругления:** `.mqx-frame` ~18px · крупные карточки ~22px · кнопки hero ~14px · body line-height **1.42**.

---

## 7. Модалки, события, движение

- Модалки: `.mqx-modal` + `.mqx-card`, действия `mq-modal-actions`.
- События: `role="dialog"`, `.mqx-events-*`, закрытие явной кнопкой; карусель + клавиатура.
- Копирайт модалок: **последствие** («сгорит зарплата»), не только «Внимание».
- `prefers-reduced-motion`: отключать декор и лишние слайды; смысл доступен без анимации.
- `focus-visible` фиолетовый; таббар `aria-current="page"`.

---

## 8. Голос в UI (кратко)

См. [`BRANDBOOK.md` §6](BRANDBOOK.md#6-голос-и-копирайт): **ты**, русский, без EN в production, без паники.

---

## 9. Чеклист экрана перед merge

- [ ] `MqxShell` / `MqxTabHero` или задокументированное исключение  
- [ ] Один доминирующий фиолетовый hero на вкладку  
- [ ] `--mqx-glass-*` + `tg-theme-*`, не голый белый в тёмном TG  
- [ ] `BrandLogo` G1 или G2, не flat SVG / MQ  
- [ ] Суммы с ₽, период с номером (#N), статусы без опоры только на цвет  
- [ ] Прошёл `#/dev/mqx` после изменения `mqx/`  

### 9a. Чеклист экрана (★ BG, v3) — актуальный

- [ ] Поле `mq-board`, клетки `mq-cell` без тени; объём (нижняя кромка) — только у нажимаемого  
- [ ] Одна рамка на уровень (★ BG-3): вложенный элемент не повторяет приём родителя  
- [ ] Один доминирующий фиолетовый блок на экран; красный — только риск, обычный расход нейтральный  
- [ ] Цвет, размер, радиус, длительность — токеном; новых HEX/rgba и шрифтов < 12 px нет (`check:style-discipline`, `check:mqx-ratchet`)  
- [ ] Главное действие — «Завершить ход»; обращение на «ты»; опасная кнопка названа действием («Продать», «Погасить»), не «Удалить»  
- [ ] Проверено в обоих стилях: `?style=ink` и `?style=classic`, светлая и тёмная тема  
- [ ] Состояния loading / empty / error; хит-зона ≥ 44 px; фокус виден  

---

*Конец Product UI (MQX) · печать: `brandbook-mqx-print.html`.*
