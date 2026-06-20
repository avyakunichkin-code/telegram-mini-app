# Delivery workflow (ТВОЙ ХОД)

**Канонический цикл** для product-задач (код, spec, YAML, UI, отчёт). Не пропускать фазы ради скорости.

```
Думаем → Уточняем → Планируем → Делаем
```

Допустимо **больше токенов** на первые три фазы — это дешевле, чем низкокачественный merge.

---

## 1. Думаем (Understand)

**Цель:** понять задачу в контексте prod, не выдумывать API.

- Прочитать spec / ADR / `game-lexicon` / существующий код.
- Выбрать **один primary** skill ([skill-responsibility-matrix.md](skill-responsibility-matrix.md)).
- Открыть **satellites** из router (TDD, critical-tests, doubt, lab…).

**Gate:** можно сформулировать, *что* меняется и *почему* в 2–4 предложениях. Иначе — ещё чтение, не код.

---

## 2. Уточняем (Clarify)

**Цель:** снять неоднозначность до работы.

См. [clarify-first.md](clarify-first.md):

- scope среза, границы «не трогаем»;
- конфликты spec ↔ код;
- **визуал** — формат и путь ([visual-assets-policy.md](visual-assets-policy.md));
- draft vs release-ready.

**Gate:** нет открытых блокирующих вопросов **или** зафиксированы assumptions с OK пользователя.

---

## 3. Планируем (Plan)

**Цель:** короткий план, по которому можно проверить завершённость.

| Размер задачи | План |
|---------------|------|
| Очевидный hotfix | 1–3 пункта в чате |
| Фича / multi-file | `docs/plans/` + `docs/tasks/` или MQ-* slice |
| Новая фича без spec | сначала **spec-driven-development** |

План включает: файлы, verify (pytest, build, balance diff), нужные ассеты, verdict-критерий.

**Gate:** пользователь не против плана **или** план явно следует из утверждённого spec/task. Для крупного UI — lab round до prod ([DESIGN_WORKFLOW.md](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md)).

---

## 4. Делаем (Implement + Verify)

**Цель:** [release-ready](release-ready-quality.md) артефакт, не набросок.

1. Implement — полный scope среза (без «TODO потом» без согласования).
2. Verify — команды из primary + satellites.
3. Self-review — чеклист release-ready (+ visual policy для UI).
4. **Verdict** — COMPLETE/PASS только если gates пройдены.

---

## Verdict по фазам

| Фаза застряла | Verdict |
|---------------|---------|
| Не понят контекст | **BLOCKED** — нужно чтение / spec |
| Открыты вопросы | **BLOCKED** — clarify-first |
| Нет spec / lab approval | **CONCERNS** — не COMPLETE для prod |
| Verify не пройден | **FAIL** |
| Всё пройдено | **COMPLETE** / **PASS** |

---

## Типовые маршруты

| Запрос | Primary цепочка |
|--------|-----------------|
| Сырая идея | idea-refine → spec → plan → incremental |
| «Сделай экран» | clarify (scope + assets) → design-lab-mqx → frontend-ui |
| Событие | create-event (+ event-analysis audit) |
| Economy | game-economy (+ balance-playtest при крупном diff) |
| Pre-merge | code-review-and-quality (read-only) |

---

## Исключения

- **Hotfix** без смены UX/контракта — можно сжать до Думаем → Делаем, но clarify при неясности всё равно обязателен.
- **Read-only** (`event-analysis`, `code-review`) — фазы 3–4 = отчёт, не Write.
- **Draft-only** — verdict DRAFT/GAPS, не COMPLETE.
