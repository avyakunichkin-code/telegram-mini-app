# flows-round — 6 аккордеонов «Управление капиталом»

Единая страница: Доходы · Расходы · Инвестиции · Страховки · Имущество · Обязательства. Accent — линия **снизу** summary (1.5px). См. [`VARIANTS.md`](VARIANTS.md).

## Запуск

```powershell
cd design-lab/capital-page/flows-round
.\sync-lab.sh
npx serve .
```

Открыть `http://localhost:3000` (или порт serve). Переключить светлую/тёмную тему в шапке lab.

## Sync

После правок `styles.css` или родительского `../styles.css`:

```powershell
.\sync-lab.sh
```

Коммитить `lab-base.css` вместе с `index.html` и `styles.css`.

## Связь

- IA страницы: [`../README.md`](../README.md)
- Агрегация prod: `frontend-react/src/utils/buildCapitalPeriodFlows.js`
- **Лендинг:** fallback PNG капитала — этот раунд (не `../index.html` `#phone-demo`). Спека: [`docs/specs/LANDING_SCREENSHOTS.md`](../../../docs/specs/LANDING_SCREENSHOTS.md)
