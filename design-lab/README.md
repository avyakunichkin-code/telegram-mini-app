# Design lab

Статичные HTML-витрины для **этапа 1** процесса MQX: рисуем варианты → выбираем → утверждаем → только потом React в приложении.

Правила: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

## Навигатор (не ищите файлы по папкам)

```bash
cd design-lab
npx serve .
```

Откройте **`http://localhost:3000/`** — сгенерированный хаб `index.html` (поиск, Dashboard parity, все round’ы).

Пересборка хаба и dashboard parity (**только из `frontend-react/`** — в `design-lab/` нет `package.json`):

```bash
cd frontend-react
npm run design-lab:check-rounds   # self-contained CSS (./lab-base.css, без ../)
npm run design-lab:build            # check → parity → check
# или только дашборд:
npm run design-lab:build-dashboard-page-round
```

После правки `styles.css` в round:

```bash
cd design-lab/<тема>/<round>
./sync-lab.sh          # bash / Git Bash / WSL (канон)
# или: cd frontend-react && npm run design-lab:sync-round -- design-lab/<тема>/<round>
```

Затем `cd frontend-react && npm run design-lab:check-rounds`.

Конфиг ссылок: [`nav.manifest.json`](nav.manifest.json) · канон дашборда: [`dashboard/canon.manifest.json`](dashboard/canon.manifest.json).

**Когда что использовать (хаб / round / parity / dev):** [`docs/agents/DESIGN_LAB_NAVIGATION.md`](../docs/agents/DESIGN_LAB_NAVIGATION.md).

## Папки

| Папка | Статус | Содержание |
|-------|--------|------------|
| [asset-cards/](asset-cards/) | внедрено в prod | Карточки активов |
| [invest-forms/](invest-forms/) | внедрено в prod | Формы депозита / облигаций |
| [primitives/](primitives/) | **утверждено → prod** | Гибрид D+C+B/A; в `mqx/primitives/` |
| [finance-insurance/](finance-insurance/) | **внедрено в prod** | B: каталог 2×2 + тарифы; карточки asset H |
| [dashboard/](dashboard/) | **★ S5 в prod** | L3+S5 Unified; хвосты: empty/error, иконки — см. one-pager |
| [events/](events/) | **внедрено в prod** | EventCard, EventCarouselOverlay, MqxPill |
| [row-actions/](row-actions/) | **B + F2 → prod** | MqxRowAction (корзина по умолчанию), MqxFinListRow, confirm; порядок метрик — в spec |
| [capital-page/](capital-page/) | **IA утверждена → вариант A/B на выбор** | 5 табов, бюджет №2, имущество/обязательства строками |
| [onboarding-o2/](onboarding-o2/) | **★ утверждён** → MQX | O2 Guidance strip, progressive curriculum |
| [pre-game-shell/](pre-game-shell/) | v2 (сравнение) | Монетка над пузырём, TGS, без frame |
| [auth-flow/](auth-flow/) | **★ B → prod** | Вход / регистрация (история вариантов A/B/C) |
| [new-game-mode/](new-game-mode/) | **★ B → prod** | Шаг 1: имя + Игра / План |
| [game-templates/](game-templates/) | **★ → prod** | Шаг 2: каталог; **портреты 4 жизней** ★ [`persona-portraits-round/`](game-templates/persona-portraits-round/); SVG [`scenario-icons/`](game-templates/scenario-icons/) — архив |
| [period-close/](period-close/) | **★ в prod** | Иконки строк — lab-раунд B2 |
| [start-menu/](start-menu/) | **★ B → prod** | Меню сохранений после входа |
| [brand-logo/](brand-logo/) | **★ → prod** | G1 старт, G2 hero; tagline в G1 |
| [game-ui/juice-round/](game-ui/juice-round/) | **★ A+C+D → prod** | Gain, turn ritual, salary warn; B Risk — backlog |
| [character-needs/](character-needs/) | **★ v5 в prod** | Z-NEEDS + портрет `dash` из persona-portraits-round |
| [ui-states-unified/states-icons-round/](ui-states-unified/states-icons-round/) | **★ в prod** | S1 C′, S2 B, S3 B/C, S4 A, S5 D0 |

## Как работать

```bash
cd design-lab/<тема>/<раунд>
./sync-lab.sh          # пересобрать lab-base.css + assets
npx serve .
```

**Важно:** в HTML макета только пути `./` — не `../` (иначе стили 404). См. `tvoy-hod-design-lab.mdc` и скилл `design-lab-mqx`.

**Events:** `design-lab/events/sync-all-rounds.sh` — все раунды сразу.

В `README.md` каждой темы — таблица вариантов A, B, C… и что утверждено.

**Живой каталог после утверждения:** `npm run dev` → `#/dev/mqx`.
