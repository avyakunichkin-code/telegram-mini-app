# Dashboard — Z-NEEDS v6 (улучшения)

Раунд полировки блока **Потребности** на главной. Prod сейчас: **v5 ★** ([`../dashboard-needs-v5-round/`](../dashboard-needs-v5-round/)).

## Запуск

```bash
cd design-lab/character-needs/dashboard-needs-v6-round
./sync-lab.sh
npx serve .
```

Или хаб: `cd design-lab && npx serve .` → **Z-NEEDS v6**.

Интерактив: кнопки сценария (истощение / норма / ноль), тема светлая/тёмная, клик по шапке — expand.

## Варианты

См. [`VARIANTS.md`](./VARIANTS.md): **v6-A** glass+quad · **v6-B** ring+% · **v6-C** segment strip.

## Файлы

| Файл | Назначение |
|------|------------|
| `index.html` | Макеты v5 ref + v6-A/B/C |
| `styles.css` | Дельта поверх prod Z-NEEDS |
| `lab-needs.js` | Сценарии шкал, expand |
| `sync-lab.sh` | `lab-base.css` + копия `student-mascot-dash.png` |

**Не править** `lab-base.css` вручную.

## Prod (после ★)

- `MqxNeedsDash.jsx`
- `styles/mqx/dashboard.css`
- UX: [`docs/ux/screens/character-needs-dashboard.md`](../../../docs/ux/screens/character-needs-dashboard.md)
