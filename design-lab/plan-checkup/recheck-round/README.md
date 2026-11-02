# plan-checkup / recheck-round (P3-03, P3-07)

**Статус:** review — не утверждено. Перенос в `apps/plan-web` только после «утверждаем».

Повторный чекап: где показать «в прошлый раз вы взялись за…» (R1–R3) и как показать прогресс цели (G1–G2). Основа — утверждённый отчёт ★ C2 ([`../APPROVED.md`](../APPROVED.md)). Данные уже отдаёт API: `report.previous`, `goals[].progress` (`apps/plan-api`, P3-03/P3-07).

Рекомендация: **R2 + G2**.

## Запуск

```bash
cd design-lab && npx serve .        # хаб → «ТВОЙ ПЛАН · recheck-round»
cd design-lab/plan-checkup/recheck-round && ./sync-lab.sh   # после правки styles.css
```
