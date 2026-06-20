# Release-ready quality (ТВОЙ ХОД)

**Применяется ко всем product-скиллам** (`tier: core` / `support`), когда скилл пишет код, spec, YAML, UI или отчёт для merge.

**Связанные каноны:** [delivery-workflow.md](delivery-workflow.md) · [clarify-first.md](clarify-first.md) · [visual-assets-policy.md](visual-assets-policy.md) · [skill-responsibility-matrix.md](skill-responsibility-matrix.md)

## Принцип

Мы **осознанно тратим больше токенов** на чтение контекста, анализ и проверку, если это нужно для **release-ready** результата.

| Не сдаём | Сдаём |
|----------|--------|
| «Набросок», placeholder, TODO «допишите сами» | Рабочий артефакт под merge |
| Шаблон без данных проекта | Конкретика: пути, поля API, persona, пороги |
| «Можно так или эдак» без выбора | Решение + обоснование; спорное — явный вопрос |
| Код без проверки | Минимум verification из скилла (pytest, build, checklist) |

**Скорость не важнее завершённости.** Лучше один проход с анализом, чем три итерации правок от пользователя.

## Процедура (перед verdict)

Следуй [delivery-workflow.md](delivery-workflow.md): **Understand → Clarify → Plan → Implement/Verify**.

1. **Understand** — spec/ADR/существующий паттерн в коде (не выдумывать API).
2. **Clarify** — [clarify-first.md](clarify-first.md); визуал — [visual-assets-policy.md](visual-assets-policy.md).
3. **Plan** — короткий план или MQ-* / plan doc для multi-file.
4. **Implement** — минимальный diff, но **полный** по scope задачи (нет «остальное в follow-up» без явного согласования).
5. **Verify** — команды из скилла или satellites (`test-driven-development`, `critical-test-scenarios`, guardrails, balance diff).
6. **Self-review** — чеклист ниже; при сомнении — `doubt-driven-development` или read-only review subagent.
7. **Verdict** — только если чеклист пройден или явно **CONCERNS** с перечислением блокеров.

## Чеклист release-ready (универсальный)

- [ ] **Уточнения** закрыты или assumptions подтверждены ([clarify-first.md](clarify-first.md)).
- [ ] Поведение согласовано с **spec / ADR / game-lexicon** (не противоречит prod).
- [ ] **Граница скилла** не нарушена (см. `skill-responsibility-matrix.md`).
- [ ] **Контракт FE↔BE** синхронен, если менялся API (`api.js`, schemas, UI).
- [ ] **Тесты или gate** из скилла выполнены / добавлены для нового поведения.
- [ ] Нет **EN в production UI**, мёртвого кода, дублирования канона победы/period в роутерах.
- [ ] Для **событий**: balance §1–4; lifecycle §10 / axis §11 при housing/downgrade.
- [ ] Для **UI**: MQX/DESIGN_WORKFLOW; lab→canon при смене визуала; **ассеты** по [visual-assets-policy.md](visual-assets-policy.md) (не emoji/placeholder-картинки).
- [ ] **Документация** обновлена, если менялся игроко-видимый контракт (spec, DOC_SYNC_LOG — по scope).

## Verdict и незавершённость

| Verdict | Когда |
|---------|--------|
| **COMPLETE** / **PASS** | Чеклист пройден; можно merge после обычного review |
| **CONCERNS** | Работает, но есть риски; перечислить; не называть COMPLETE |
| **FAIL** / **BLOCKED** | Нет spec, тесты красные, нарушены инварианты |

**Запрещено:** ставить COMPLETE с формулировками «скелет», «пример», «остальное потом», «шаблон для заполнения» — если пользователь не просил explicitly draft-only.

## Draft-only (исключение)

Только если пользователь явно просит **черновик / idea / outline**:

- `idea-refine` → `docs/vision/ideas/`
- ранняя фаза `spec-driven-development` до approval gate
- `event-analysis` read-only отчёт с GAPS (не YAML)

В этих режимах verdict: **DRAFT** / **GAPS**, не COMPLETE для prod.
