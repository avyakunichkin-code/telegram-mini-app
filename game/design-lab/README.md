# Design lab

Статичные HTML-витрины для **этапа 1** процесса MQX: рисуем варианты → выбираем → утверждаем → только потом React в приложении.

Правила: [`game/web/src/components/mqx/DESIGN_WORKFLOW.md`](../web/src/components/mqx/DESIGN_WORKFLOW.md).

При завершении раунда применяйте [правило актуальности и архива](../docs/README.md#актуальность-и-архив).
При переносе раунда исключите его из рабочей навигации через манифест и
пересоберите хаб.

## Навигатор (не ищите файлы по папкам)

```bash
cd design-lab
npx serve .
```

Откройте **`http://localhost:3000/`** — сгенерированный хаб `index.html` (поиск, Dashboard parity, все round’ы).

Пересборка хаба и dashboard parity (**только из `game/web/`** — в `design-lab/` нет `package.json`):

```bash
cd game/web
npm run design-lab:check-rounds   # self-contained CSS (./lab-base.css, без ../)
npm run design-lab:build            # check → parity → check
# или только дашборд:
npm run design-lab:build-dashboard-page-round
```

После правки `styles.css` в round:

```bash
cd design-lab/<тема>/<round>
./sync-lab.sh          # bash / Git Bash / WSL (канон)
# или: cd game/web && npm run design-lab:sync-round -- design-lab/<тема>/<round>
```

Затем `cd game/web && npm run design-lab:check-rounds`.

Конфиг ссылок: [`nav.manifest.json`](nav.manifest.json) · канон дашборда: [`dashboard/canon.manifest.json`](dashboard/canon.manifest.json).

**Когда что использовать (хаб / round / parity / dev):** [`docs/agents/DESIGN_LAB_NAVIGATION.md`](../../docs/agents/DESIGN_LAB_NAVIGATION.md).

## Папки

Актуальные статусы экранов и ссылки на решения — в [едином указателе дизайна](../design/system/CURRENT_STYLE.md). Таблица ниже помогает найти материалы по темам.

| Папка | Статус | Содержание |
|-------|--------|------------|
| [asset-cards/](asset-cards) | внедрено в prod | Карточки активов |
| [invest-forms/](invest-forms) | внедрено в prod | Формы депозита / облигаций |
| [primitives/](primitives) | **утверждено → prod** | Гибрид D+C+B/A; в `mqx/primitives/` |
| [finance-insurance/](finance-insurance) | **внедрено в prod** | B: каталог 2×2 + тарифы; карточки asset H |
| [dashboard/](dashboard) | **«Финансы как игра»** | Утверждённый дизайн и актуальная витрина дашборда |
| [events/](events) | **внедрено в prod** | EventCard, EventCarouselOverlay, MqxPill |
| [row-actions/](row-actions) | **B + F2 → prod** | MqxRowAction (корзина по умолчанию), MqxFinListRow, confirm; порядок метрик — в spec |
| [capital-page/](capital-page) | **Утверждено и подключено** | [Текущее превью](finance-game-round/capital-preview.html) и [решение](capital-page/APPROVED.md) |
| [pre-game-shell/](pre-game-shell) | Историческое утверждение | Актуальные стартовые экраны — в реестре дизайна |
| [auth-flow/](auth-flow) | История | Старые варианты входа и регистрации — в архиве |
| [new-game-mode/](new-game-mode) | Снято | Экран выбора «Игра / План» — в архиве |
| [game-templates/](game-templates) | Исходники и портреты | Старый экран шаблонов — в архиве; портреты — [`persona-portraits-round/`](game-templates/persona-portraits-round) |
| [period-close/](period-close) | **★ в prod** | Иконки строк — lab-раунд B2 |
| [start-menu/](start-menu) | История | Документация прежнего меню сохранений |
| [brand-logo/](brand-logo) | История | G1/G2 от 20.05.2026 · [текущие форматы](../design/system/assets/Logos/README.md) |
| [game-ui/juice-round/](game-ui/juice-round) | **★ A+C+D → prod** | Gain, turn ritual, salary warn; B Risk — backlog |
| [character-needs/](character-needs) | **★ v5 в prod** | Z-NEEDS + портрет `dash` из persona-portraits-round |
| [ui-states-unified/states-icons-round/](ui-states-unified/states-icons-round) | **★ в prod** | S1 C′, S2 B, S3 B/C, S4 A, S5 D0 |

## Как работать

```bash
cd design-lab/<тема>/<раунд>
./sync-lab.sh          # пересобрать lab-base.css + assets
npx serve .
```

**Важно:** в HTML макета только пути `./` — не `../` (иначе стили 404). См. `docs/engineering/CODEX-PROCESSES.md` и скилл `design-lab-mqx`.

**Events:** `game/design-lab/events/sync-all-rounds.sh` — все раунды сразу.

В `README.md` каждой темы — таблица вариантов A, B, C… и что утверждено.

**Живой каталог после утверждения:** `npm run dev` → `#/dev/mqx`.
