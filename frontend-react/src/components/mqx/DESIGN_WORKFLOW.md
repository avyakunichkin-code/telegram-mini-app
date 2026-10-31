# MQX — процесс дизайна и внедрения

Согласованный цикл: **сначала варианты → выбор → (при необходимости ещё раунд) → утверждение → только потом код в приложении.**

Медленно, по слоям (примитивы → каркасы → домен → экраны), но каждый блок проходит полный цикл.

## ⛔ Для агента (обязательно)

| Действие | Разрешено без lab? |
|----------|-------------------|
| Hotfix: опечатка, токен, a11y-label без смены layout | Да |
| Новый/изменённый layout, порядок блоков, CTA, sheet, accordion | **Нет** — `design-lab/` → утверждение → prod |
| «Улучшить UX» блока на дашборде / финансах | **Нет** — сначала lab-раунд или обновление `APPROVED.md` |

Скиллы: **design-lab-mqx** (шаг 1) + **frontend-ui-engineering** (шаги 4–5). Сатellite **frontend-design** — не пропускает lab.

---

## Этапы

| # | Этап | Где | Результат |
|---|------|-----|-----------|
| **0** | Задача | Чат / бэклог | Что делаем, где в UI, ограничения (TMA, бренд) |
| **1** | Варианты | `design-lab/<тема>/` | 2–5 статичных макетов (HTML/CSS), без React |
| **2** | Выбор | Чат | Один вариант или гибрид (например «D + chip из B») |
| **2b** | Повтор | `design-lab/` снова | Если не зашло — новый раунд, не правим prod |
| **3** | Утверждение | Чат | Явное «утверждаем X» — без этого в prod не идём |
| **4** | MQX + каталог | `mqx/` + `#/dev/mqx` | React-компонент, стили `mqx-*`, секция в витрине |
| **5** | Внедрение | `*Premium.jsx`, экраны | Подключение только утверждённого компонента |

**Запрещено:** сразу править игровые экраны, минуя design-lab и утверждение (кроме мелких багов и hotfix).

---

## Правила вариантов (design-lab)

- **2–5 вариантов** на один блок, не больше (иначе сложно выбрать).
- Подписи **A, B, C…** и короткая заметка «идея» в `README.md` папки.
- Одинаковые **тестовые данные** во всех вариантах (как в `asset-cards`).
- Только **канон бренда:** Quest Violet, emerald/danger по смыслу, `mqx-*` / токены из `styles/tma-base.css` (`#root`).
- **Русский** в видимых подписях.
- Светлая и тёмная тема — по необходимости, переключатель в витрине.

Запуск локально:

```bash
cd design-lab
npx serve .
# → корневой index.html — навигатор по всем витринам и prod parity
```

Или точечно:

```bash
cd design-lab/<тема>/<раунд>
npx serve .
```

Пересборка навигатора и dashboard parity: `cd frontend-react && npm run design-lab:build`

### Self-contained стили (обязательно)

`serve` отдаёт **только текущую папку** — пути `../styles.css` в HTML дают **404**.

| Файл в раунде | Роль |
|---------------|------|
| `lab-base.css` | Сборка общих стилей (`sync-lab.sh`, не править руками) |
| `styles.css` | Стили вариантов этого раунда |
| `assets/monetka-mascot.png` | Копия маскота при необходимости |

В `index.html` только `./lab-base.css`, `./styles.css`, `./assets/...`.

**Events:** `design-lab/events/sync-all-rounds.sh` или `./sync-lab.sh` в папке раунда.

Правило (path-scoped): `.claude/rules/design-lab.md`. Скилл: `design-lab-mqx`.

---

## Правила утверждения

Утверждение считается полученным, когда в чате есть явная формулировка, например:

- «Утверждаем вариант **B**»
- «Берём **D**, chip ставки как в каталоге»
- «В prod — **G**, доработки только в design-lab до следующего раунда»

До этого этапа **4–5 не начинаем**.

---

## Правила внедрения (MQX)

После утверждения:

1. Компонент(ы) — в `frontend-react/src/components/mqx/` (подпапки: `primitives/`, `metrics/`, `layout/`, …).
2. Стили — классы `mqx-*` в `frontend-react/src/styles/` (модуль по экрану, см. `styles/README.md`; barrel `index.css`), без inline hex в компонентах.
3. Экспорт — через `mqx/index.js`.
4. Секция в **`#/dev/mqx`** — обязательна до подключения к игре.
5. Подключение к prod — **один экран / один сценарий** за PR, чтобы проще откатить.

---

## Canon Sync (обязательный шаг после внедрения)

Если паттерн **утверждён** и мы его **внедрили** в `frontend-react`, то в том же PR (или сразу следующим маленьким PR) нужно обновить канон `design-lab`:

- обновить `design-lab/<theme>/APPROVED.md` (что теперь канон, что запрещено, порядок блоков),
- обновить `design-lab/<theme>/README.md` (как смотреть актуальный “prod parity”),
- при необходимости добавить/обновить **page-round** (“страница целиком”), чтобы видеть реальную композицию до новых правок.

Смысл: чтобы следующий раунд начинался не “по памяти”, а от актуального канона.

---

## Очередь слоёв (дорожная карта)

| Спринт | Тема design-lab | После утверждения |
|--------|-----------------|-------------------|
| 1 | `primitives/` — кнопки, pills, chips, progress | `mqx/primitives/` |
| 2 | `shell/` — дашборд main (**D′ flat утверждён**) | **Внедрено:** `MqxDashStack`, `DashboardPremium` |
| 3 | `finance-insurance/` — **внедрено** | `InsuranceSection`, `Insurance*Card/Row/Picker`, Finance |
| 4 | `dashboard/` — S5 (история) → **★ BG-1 в prod** (2026-10-14, [ADR-014](../../../../docs/decisions/ADR-014-brand-direction-board-game.md), `board-game/hybrid-round/`, parity `dashboard/bg1-page-round/`) | DashboardPremium, `styles/mqx/board.css`, токены v2 |
| 5 | `events/` — pill, карточка, оверлей (**внедрено**) | `EventCard`, `EventCarouselOverlay`, `MqxPill` |
| 6 | `onboarding-o2/` — **★ утверждён** | `MqxGuidanceStrip`, `GameGuidanceLayer`, `MonetkaAvatar` |
| 7 | `achievements-progress/` — level collapsible + монетки + каталог | `MqxAchievementCoin`, `AchievementsScreen` |
| 8 | `dashboard-home-v2/` — эксперименты компоновок (архив) | — |
| 9 | ~~`dashboard-dual-accordion/`~~ | superseded **S5**; не внедрять |
| 10 | **`new-game-mode/`** — R2 + I1 ★ | `MqxMonetkaDialogScreen`, `MqxSaveKindPicker`, `NewProfileKindScreen` |
| 11 | **`game-templates/`** — compact + цвета ★; **`persona-portraits-round/`** ★ (pick/dash); **`scenario-icons/`** — архив I-Scene | `PersonaPortrait`, `MqxStarterScenarioPicker`, `MqxNeedsDash`, `GameTemplatePickScreen` |
| 12 | **`period-close/`** — хвостик ★; итог — **`game-ui/juice-round` C** | `MqxPeriodCloseRitual`, `MqxPeriodCloseTail` (sheet legacy в каталоге) |
| 13 | **`game-ui/juice-round/`** ★ A+C+D | `MqxJuiceGainFeedback`, `MqxPeriodCloseRitual`, `MqxSalaryWarnModal` |
| 13 | **`capital-page/details-actions-round/`** ★ v2 | `FinancePremium`: Детали \| Действия + sheets |
| 14 | `character-needs/dashboard-needs-v7-round/` e2e3 (история; на главной заменён ★ BG-1) | `MqxNeedsHelpSheet`, `MqxTreatSelfSheet`, events chips |
| 15 | **`board-game/screens-round/`** ★ BG-2 (2026-10-15) | события, Капитал, Аналитика, Меню, Вход, Выбор жизни, финал, таббар |
| 16 | **`board-game/frames-round/`** ★ BG-3 E + **`close-preview-round/`** ★ A (2026-10-25/26) | `DashboardPremium`, «Капитал · Действия», Аналитика; `MqxDashboardHero` (превью списания) |
| 17 | **`board-game/neobrutal-round/`** → **`neobrutal-a-round/`** K1 + **`ink-sheets-round/`** A — «Чернильный край», **пробно, не ★** (2026-10-28/29) | слой `styles/mqx/ink.css` под `data-mqx-style="ink"`, `utils/mqxStyle.js` |
| 18 | **`mascots/`** — `ink-mascots-round`, `companions-round`, `pregame-monetka-round` — **review** (2026-10-29) | — (ждёт «утверждаем»; `pregame-monetka` меняет канон BG-2) |

Текущий статус (2026-10-29): **все экраны партии — ★ BG-1…BG-3** «настольная игра» (токены v2, Nunito + Manrope), превью конца хода ★ PR-07; поверх — **пробный слой «Чернильный край»** (`ink.css`, по умолчанию включён, `?style=classic` — без него; не тронуты Аналитика, Меню, онбординг). Канон — [`design-lab/board-game/APPROVED.md`](../../../../design-lab/board-game/APPROVED.md), цель по токенам — дизайн-система v3 [`design/`](../../../../design/README.md). Дальше: ★ или откат «Чернильного края» после игры; маскоты и напарники (review); type & rhythm v3 (шрифты < 12 px, 4-pt отступы) — отдельным раундом lab.

---

## Роли

| Кто | Делает |
|-----|--------|
| **Вы** | Выбор варианта, утверждение, приоритет спринтов |
| **Агент / разработчик** | design-lab → MQX → витрина → внедрение по утверждению |

---

## Ссылки

- Бренд: [`docs/reference/brandbook/BRANDBOOK.md`](../../../../docs/reference/brandbook/BRANDBOOK.md)
- UI-контракт: [`docs/specs/SPEC_FRONTEND_UI.md`](../../../../docs/specs/SPEC_FRONTEND_UI.md)
- Живой каталог: [`README.md`](./README.md) → `#/dev/mqx`
- Оглавление design-lab: [`design-lab/README.md`](../../../../design-lab/README.md)
