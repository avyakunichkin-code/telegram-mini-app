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

Правило Cursor: `tvoy-hod-design-lab.mdc`. Скилл: `design-lab-mqx`.

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
| 4 | `dashboard/` — **S5 ★ в prod**; хвосты: empty/error, иконки | DashboardPremium |
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
| 14 | **`character-needs/dashboard-needs-v7-round/`** ★ e2e3 | `MqxNeedsDash`, `MqxNeedsHelpSheet`, `MqxTreatSelfSheet`, events chips |

Текущий статус: **дашборд S5** + **Z-NEEDS v7-e2e3 ★**, **события L3 + оверлей O1**, **итог периода**, **новая игра**, **онбординг**, **ui-states ★**, **Капитал** (Details \| Actions v2 ★) в prod. Lab оверлея: [`design-lab/events/overlay-round/`](../../../../design-lab/events/overlay-round/). Дальше: **аналитика** (волна C хвост).

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
