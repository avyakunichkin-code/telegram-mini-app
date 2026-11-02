# plan-checkup / bento-round (SPL-404)

**Статус:** review — **не утверждено**. Перенос в `apps/plan-web` только после явного «утверждаем» PO.

Исходная точка — дизайн-система прототипа P0 «Бенто» (токены — `apps/plan-web/src/styles.css`, копия в `../styles.css`). Lab-раунда в P0 не было ([`docs/plan/ROADMAP.md`](../../../docs/plan/ROADMAP.md)).

## Что сравниваем

1. **Первый экран итогового отчёта** на 375 px: A — прототип (parity), B — порядок spec «ответ → шаги → светофор», C — светофор первым.
2. **Лозунг на входе:** «Финансы как есть» (рабочий), «Финансы без тумана», «Семья в плюсе», «Финансы на ладони» (idea, open question 4).

Рекомендация в раунде: **B** + **L1**.

## Запуск

```bash
cd design-lab && npx serve .        # хаб → «ТВОЙ ПЛАН · bento-round»
cd design-lab/plan-checkup/bento-round && ./sync-lab.sh   # после правки styles.css (свой или ../styles.css)
```

Без bash: `cd frontend-react && npm run design-lab:sync-round -- design-lab/plan-checkup/bento-round`.

## После «утверждаем»

Перенести выбранный порядок в `apps/plan-web/src/screens/Report.jsx` и лозунг в `Auth.jsx`; записать решение в `../APPROVED.md` (Canon Sync) и строку в `docs/CHANGELOG.md`.
