# Главная · текущий канон BG-3 E + BG-4 K1

Текущая витрина: [current-page-round](current-page-round/), зафиксирована владельцем
04.11.2026. Правила: [APPROVED](APPROVED.md), структурированный контракт:
[canon.manifest.json](canon.manifest.json). Derived parity:
[parity-generated-page-round](parity-generated-page-round/).

Шкалы 6 px без обводки; доходы/расходы/подушка и цель без рамок; действия —
заливки с нижней кромкой, карта хода K1 с контуром. Новые маскоты B/A.
`bg1-page-round` и `board-game/hybrid-round` — историческая основа, не текущий вид.
[Предложения A/B/C](../board-game/ink-refinement-round/) — REVIEW, не канон.

```bash
cd design-lab && npx serve .
```

Ниже — история S5 Unified (до BG-1), не канон.

---

## История: L3 + S5 Unified

```bash
cd design-lab/dashboard
npx serve .
```

Открыть `index.html` — **S5** крупно + S1–S3 для сравнения. **L3 / V0**, **«Длинные суммы»**, тема.

Состав старого макета: [CONTENT.md](CONTENT.md). Действующие решения: [APPROVED.md](APPROVED.md).

## Раунды

| Раунд | Тема |
|-------|------|
| [`../character-needs/dashboard-needs-v7-round/`](../character-needs/dashboard-needs-v7-round/) | **Потребности** (Z-NEEDS) на дашборде — `MqxNeedsDash` |
| [`period-actions-round/`](period-actions-round/) | Chip-действия, Монетка справа, подписи кнопок |
| [`../type-scale-round/`](../type-scale-round/) | Шкала типографики MQX (13→12, 9→10, hero 26/28) |
| [`goal-chain-round/`](goal-chain-round/) | Блок «Цель» |
| [`cushion-fill-round/`](cushion-fill-round/) | Индикатор подушки на chip |
| [`hero-no-timer-round/`](hero-no-timer-round/) | Hero без таймера, primary «Закрыть месяц» (TB1) |

## Историческая prod parity S5 (до BG-1)

**Источники исторического этапа S5:** `../character-needs/dashboard-needs-v7-round/` + `goal-chain-round` + `period-actions-round`
(не галерея `index.html` с блоком «Уровень»).

На том этапе витрина была синхронизирована с `DashboardPremium` + `index.css` (`mqx-tab-page--dash-unified`):

- Hero: Play + Pause (`mqx-btn--filled`), пауза `||`
- **Потребности:** `MqxNeedsDash` — сразу после hero (канон: [`../character-needs/dashboard-needs-v7-round/`](../character-needs/dashboard-needs-v7-round/))
- Финансы 2×2 (`MqxFinancePeriodBlock`), `mqx-dash-link`, Монетка
- **Цель:** `MqxGoalDash` — между финансами и действиями ([`goal-chain-round/`](goal-chain-round/))
- Действия: `MqxPeriodActions`; панель подушки inline
- Таббар: `bottom-nav--unified`, активная ячейка без «пилюли»

**Лендинг:** PNG дашборда — [`goal-chain-round/`](goal-chain-round/) или app-capture; см. [`docs/specs/LANDING_SCREENSHOTS.md`](../../docs/specs/LANDING_SCREENSHOTS.md).

Дальнейшие правки UI дашборда — сначала lab, затем перенос в `frontend-react`.


Текущая главная с 06.11.2026: [Игровой пульт А · native React parity](pocket-page-round/README.md). BG-4 current-page-round остаётся историческим снимком.
