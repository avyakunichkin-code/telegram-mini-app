# Design lab

Статичные HTML-витрины для **этапа 1** процесса MQX: рисуем варианты → выбираем → утверждаем → только потом React в приложении.

Правила: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

## Навигатор (не ищите файлы по папкам)

```bash
cd design-lab
npx serve .
```

Откройте **`http://localhost:3000/`** — сгенерированный хаб `index.html` (поиск, Dashboard parity, все round’ы).

Пересборка хаба и dashboard parity:

```bash
cd frontend-react
npm run design-lab:build
```

Конфиг ссылок: [`nav.manifest.json`](nav.manifest.json) · канон дашборда: [`dashboard/canon.manifest.json`](dashboard/canon.manifest.json).

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
| [onboarding-guided/](onboarding-guided/) | **★ утверждён** → MQX | Guided coach, 5 шагов, spotlight |
| [pre-game-shell/](pre-game-shell/) | v2 (сравнение) | Монетка над пузырём, TGS, без frame |
| [auth-flow/](auth-flow/) | **★ B → prod** | Вход / регистрация (история вариантов A/B/C) |
| [new-game-mode/](new-game-mode/) | **★ B → prod** | Шаг 1: имя + Игра / План |
| [game-templates/](game-templates/) | **★ B → prod** | Шаг 2: каталог + быстрый старт |
| [period-close/](period-close/) | **★ в prod** | Иконки строк — lab-раунд B2 |
| [start-menu/](start-menu/) | **★ B → prod** | Меню сохранений после входа |
| [brand-logo/](brand-logo/) | **★ → prod** | G1 старт, G2 hero; tagline в G1 |
| [game-ui/juice-round/](game-ui/juice-round/) | **★ A+C+D → prod** | Gain, turn ritual, salary warn; B Risk — backlog |
| [character-needs/](character-needs/) | **dashboard-needs-round готов** | Z-NEEDS A–D; treat-self / events — следующие раунды |

## Как работать

```bash
cd design-lab/<тема>/<раунд>
.\sync-lab.ps1          # если есть — пересобрать lab-base.css + assets
npx serve .
```

**Важно:** в HTML макета только пути `./` — не `../` (иначе стили 404). См. `tvoy-hod-design-lab.mdc` и скилл `design-lab-mqx`.

**Events:** `design-lab/events/sync-all-rounds.ps1` — все раунды сразу.

В `README.md` каждой темы — таблица вариантов A, B, C… и что утверждено.

**Живой каталог после утверждения:** `npm run dev` → `#/dev/mqx`.
