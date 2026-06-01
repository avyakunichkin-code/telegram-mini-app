# Dashboard — L3 + S5 Unified ★

```bash
cd design-lab/dashboard
npx serve .
```

Открыть `index.html` — **S5** крупно + S1–S3 для сравнения. **L3 / V0**, **«Длинные суммы»**, тема.

См. [`VARIANTS.md`](VARIANTS.md), [`APPROVED.md`](APPROVED.md), [`CONTENT.md`](CONTENT.md).

## Раунды

| Раунд | Тема |
|-------|------|
| [`../character-needs/dashboard-needs-round/`](../character-needs/dashboard-needs-round/) | **Потребности** (Z-NEEDS) на дашборде — `MqxNeedsDash` |
| [`period-actions-round/`](period-actions-round/) | Chip-действия, Монетка справа, подписи кнопок |
| [`../type-scale-round/`](../type-scale-round/) | Шкала типографики MQX (13→12, 9→10, hero 26/28) |
| [`goal-chain-round/`](goal-chain-round/) | Блок «Цель» |
| [`cushion-fill-round/`](cushion-fill-round/) | Индикатор подушки на chip |
| [`hero-no-timer-round/`](hero-no-timer-round/) | Hero без таймера, primary «Закрыть месяц» (TB1) |

## Prod parity (S5)

**Канон дашборда в prod:** `../character-needs/dashboard-needs-round/` + `goal-chain-round` + `period-actions-round`
(не галерея `index.html` с блоком «Уровень»).

Витрина синхронизирована с `DashboardPremium` + `index.css` (`mqx-tab-page--dash-unified`):

- Hero: Play + Pause (`mqx-btn--filled`), пауза `||`
- **Потребности:** `MqxNeedsDash` — сразу после hero (канон: [`../character-needs/dashboard-needs-round/`](../character-needs/dashboard-needs-round/))
- Финансы 2×2 (`MqxFinancePeriodBlock`), `mqx-dash-link`, Монетка
- **Цель:** `MqxGoalDash` — между финансами и действиями ([`goal-chain-round/`](goal-chain-round/))
- Действия: `MqxPeriodActions`; панель подушки inline
- Таббар: `bottom-nav--unified`, активная ячейка без «пилюли»

**Лендинг:** PNG дашборда — [`goal-chain-round/`](goal-chain-round/) или app-capture; см. [`docs/specs/LANDING_SCREENSHOTS.md`](../../docs/specs/LANDING_SCREENSHOTS.md).

Дальнейшие правки UI дашборда — сначала lab, затем перенос в `frontend-react`.
