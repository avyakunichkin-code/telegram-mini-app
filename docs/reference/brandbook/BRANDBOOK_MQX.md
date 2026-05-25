# ТВОЙ ХОД — Product UI (MQX)

**Версия:** 1.0 (слой Product UI брендбука v2)  
**Дата:** май 2026  
**Аудитория:** frontend, дизайн lab, агенты Cursor  

**Связанные документы:**  
[`BRANDBOOK.md`](BRANDBOOK.md) (identity, лого, голос, Монетка) · [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) · [`DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) · стили [`styles/README.md`](../../../frontend-react/src/styles/README.md) (barrel [`index.css`](../../../frontend-react/src/index.css))

**PDF:** [`brandbook-mqx-print.html`](brandbook-mqx-print.html) → печать **Product UI Guidelines**.

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
| Guided onboarding | 5 шагов | 2026-05-20 | [`onboarding-guided/APPROVED.md`](../../../design-lab/onboarding-guided/APPROVED.md) | `OnboardingCoach` |
| New game mode pick | R2 + I1 | 2026-05-20 | [`new-game-mode/APPROVED.md`](../../../design-lab/new-game-mode/APPROVED.md) | `NewProfileKindScreen`, `MqxSaveKindPicker` |
| Финансы: порядок разделов | Capital | — | [`capital-page/flows-round/`](../../../design-lab/capital-page/flows-round/) | `FinancePremium` аккордеоны |
| Цель на дашборде | G1 chain | 2026-05 | [`dashboard/goal-chain-round/`](../../../design-lab/dashboard/goal-chain-round/) | `MqxGoalDash` |
| Лендинг (скрины UI) | — | 2026-05-25 | capture app / lab fallback | [`LANDING_SCREENSHOTS.md`](../../specs/LANDING_SCREENSHOTS.md) |
| Pre-game shell + кнопки | P1–P6 | 2026-05-25 | [`pre-game-shell/`](../../../design-lab/pre-game-shell/) | `MqxButton`, Bubble/Flow — [`SPEC_APP_SHELL.md`](../../specs/SPEC_APP_SHELL.md) |
| Шкала типографики MQX | type-scale | 2026-05-25 | [`type-scale-round/APPROVED.md`](../../../design-lab/type-scale-round/APPROVED.md) | `#root` в `styles/tma-base.css`, dashboard в `styles/mqx/dashboard.css` |

Mission Brief (3 карточки) — **superseded** guided onboarding.

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
| Онбординг | `OnboardingCoach`, `MqxMonetkaDialogScreen` | Spotlight + Монетка |

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
| `--mq-warning` | `#D97706` | Время, ожидание |
| `--mqx-ink` | из `tg-theme-text` | Текст MQX-блоков |
| `--mqx-glass-strong` … `softer` | mix с `tg-theme-bg` | Карточки «стекло» |

Полная таблица identity-цветов (Coin Gold, Ink, Mist…) — [`BRANDBOOK.md` §4](BRANDBOOK.md#4-цветовая-палитра).

---

## 5. Типографика TMA

На `#root` (★ type-scale-round, display **A = 26px**):

| Токен | px | Роль |
|-------|-----|------|
| `--mq-fs-display` | 26 | Таймер hero compact |
| `--mq-fs-stat` | 34 | Крупная KPI-цифра (аналитика), не считать в «4 уровнях» экрана |
| `--mq-fs-title` | 20 | Крупные заголовки экрана |
| `--mq-fs-heading` | 14 | Заголовки секций (`mqx-finance-static__title`) |
| `--mq-fs-body` | 15 | Основной текст |
| `--mq-fs-caption` | 12 | Суммы в chip, pill, подсказка периода |
| `--mq-fs-small` | 11 | Подписи chip действий |
| `--mq-fs-micro` | 10 | Kicker (label chip, «Период») |

Веса: `--mq-fw-regular` 400, `--mq-fw-medium` 550, `--mq-fw-bold` 700, `--mq-fw-heavy` 800.  
Межстрочные: `--mq-lh-tight` 1.15, `--mq-lh-body` 1.42, `--mq-lh-relaxed` 1.45.

Системный стек платформы; **не** подключать Inter в TMA без продуктового решения.  
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
- [ ] Суммы с ₽, период с номером, таймер с единицами  
- [ ] Прошёл `#/dev/mqx` после изменения `mqx/`  

---

*Конец Product UI (MQX) · печать: `brandbook-mqx-print.html`.*
