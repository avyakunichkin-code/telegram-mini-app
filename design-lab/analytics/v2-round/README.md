# Аналитика v2 — design-lab (AN1-002)

Макет вкладки **«Аналитика»** для эпика AN1.

## Запуск

```bash
cd design-lab
npx serve .
```

Открыть в хабе: **Аналитика → v2-round**.

Локально (отладка CSS):

```bash
cd design-lab/analytics/v2-round
./sync-lab.sh   # или: cd frontend-react && npm run design-lab:sync-round -- design-lab/analytics/v2-round
npx serve .
```

## Sync

После правок `styles.css` или родительских стилей:

```bash
./sync-lab.sh
```

Коммитить: `lab-base.css`, `assets/monetka-mascot.png`.

## Варианты

См. [VARIANTS.md](./VARIANTS.md).

## Spec

- [`SPEC_ANALYTICS`](../../../docs/specs/SPEC_ANALYTICS.md)
- [`player-financial-analytics-an1`](../../../docs/vision/ideas/player-financial-analytics-an1.md)

## Статус

**Review** — ждём выбор варианта (A / B / C / гибрид) перед prod.
