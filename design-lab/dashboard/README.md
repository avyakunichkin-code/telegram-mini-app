# Dashboard — L3 + S5 Unified ★

```bash
cd design-lab/dashboard
npx serve .
```

Открыть `index.html` — **S5** крупно + S1–S3 для сравнения. **L3 / V0**, **«Длинные суммы»**, тема.

См. [`VARIANTS.md`](VARIANTS.md), [`APPROVED.md`](APPROVED.md), [`CONTENT.md`](CONTENT.md).

## Prod parity (S5)

Витрина **синхронизирована** с `DashboardPremium` + `index.css` (`mqx-tab-page--dash-unified`):

- Hero: Play + Pause (`mqx-btn--filled`), пауза `||`
- Финансы 2×2, `mqx-dash-link`, Монетка
- Действия: вторичные с border/shadow; **панель подушки** inline + закрытие по клику снаружи
- Уровень: `mqx-level-dash-bleed` (фон full-width, контент `padding-inline: 14px`, без `margin-inline: -14px`)
- Таббар: `bottom-nav--unified`, активная ячейка без «пилюли»
- Класс стека в S5: `mqx-dash-stack--unified` (как в prod)

Дальнейшие правки UI дашборда — сначала lab, затем перенос в `frontend-react`.
