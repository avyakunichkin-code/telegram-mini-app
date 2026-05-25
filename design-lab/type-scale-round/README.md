# Type scale — MQX

Шкала типографики: округление 13→12, подъём 9→10, сравнение hero 26/28.

## Запуск

```cmd
cd design-lab\type-scale-round
sync-lab.cmd
npx serve .
```

Открыть `index.html`.

## Sync

После правок `styles.css`:

```cmd
sync-lab.cmd
```

Подтягивает `../dashboard/styles.css`, `../dashboard/period-actions-round/styles.css`, локальные токены.

## Секции витрины

1. Таблица токенов  
2. Chip до/после  
3. Hero A/B (26 vs 28)  
4. S5 dashboard с целевой шкалой  

## ★ FINAL (2026-05-25)

Display **A = 26px**. Prod: `#root` + dashboard W2 в `frontend-react/src/index.css`. См. [`APPROVED.md`](APPROVED.md).
