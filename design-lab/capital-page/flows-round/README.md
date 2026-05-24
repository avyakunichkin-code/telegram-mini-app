# flows-round — 6 аккордеонов «Управление капиталом»

Единая страница: Доходы · Расходы · Инвестиции · Страховки · Имущество · Обязательства. Accent — линия **снизу** summary (1.5px). См. [`VARIANTS.md`](VARIANTS.md).

## Запуск

```powershell
cd design-lab/capital-page/flows-round
.\sync-lab.ps1
npx serve .
```

Открыть `http://localhost:3000` (или порт serve). Переключить светлую/тёмную тему в шапке lab.

## Sync

После правок `styles.css` или родительского `../styles.css`:

```powershell
.\sync-lab.ps1
```

Коммитить `lab-base.css` вместе с `index.html` и `styles.css`.

## Связь

- IA страницы: [`../README.md`](../README.md)
- Агрегация prod: `frontend-react/src/utils/buildCapitalPeriodFlows.js`
