# Dashboard — Z-NEEDS v5 (prod parity)

**Утверждённый** паттерн после UX-полировки 2026-05-30. См. [`APPROVED.md`](./APPROVED.md).

## Запуск

```bash
cd design-lab/character-needs/dashboard-needs-v5-round
./sync-lab.sh
npx serve .
```

Или хаб: `cd design-lab && npx serve .` → пункт «Z-NEEDS v5».

## Prod

- `MqxNeedsDash.jsx`
- `frontend-react/src/styles/mqx/dashboard.css` — блок Z-NEEDS подмешивается в `lab-base.css` через `sync-lab.sh` (не править `lab-base` руками)

Предыдущие варианты v1–v4: [`../dashboard-needs-round/`](../dashboard-needs-round/).
