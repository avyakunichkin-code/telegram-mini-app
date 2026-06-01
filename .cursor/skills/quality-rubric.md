# Skill Testing Quality Rubric (ТВОЙ ХОД)

Этот файл — **локальная рубрика** для режима `/skill-test category …` в репозитории ТВОЙ ХОД.
Она намеренно проще «полного CCGS»: мы проверяем **минимально необходимые** вещи для качества и предсказуемости skills.

## Общие метрики (для всех категорий)

- **G1 — Contract frontmatter**: есть `name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools`.
- **G2 — Verdict**: в тексте есть явный verdict-ключевик: `PASS|FAIL|CONCERNS|APPROVED|COMPLETE|BLOCKED|READY`.
- **G3 — Protocol**:
  - если `allowed-tools` содержит `Write`/`Edit`, в теле есть ask-before-write («May I write»/«Могу записать»/эквивалент).
  - если скилл read-only, явно сказано, что он не пишет в репо.
- **G4 — Handoff**: в конце есть «Следующий шаг» (или эквивалент) со ссылкой на следующий скилл/путь.

## Категории

### api

- **A1 — Contract-first**: есть секция/подход “contract first” (схемы вход/выход, ошибки).
- **A2 — Backward compatibility**: есть явная позиция про additive changes / деприкацию.

### build

- **B1 — Incrementality**: процесс разбит на шаги/фазы (не «сделай всё сразу»).
- **B2 — Verification hook**: есть проверка/валидация (тест, devtools, ручной чеклист).

### define

- **D1 — Acceptance criteria**: есть критерии готовности/AC (или структура, где они появляются).
- **D2 — Gate**: есть “stop / don't advance” до утверждения/проверки.

### review

- **R1 — Read-only**: по умолчанию без записи/коммитов.
- **R2 — Severity**: есть уровни серьёзности (blocking/advisory) или аналог.

### verify

- **V1 — Evidence-based**: требует данные/воспроизведение/измерения, не “на глаз”.
- **V2 — Safety**: не предлагает опасные действия без предупреждения (security/perf).

### ship

- **S1 — Handoff to docs/release**: есть упоминание docs/ADRs/канона/релизных шагов, если релевантно.
- **S2 — Publish safety**: если публикация/соцсети — явно требует согласования и запрещает авто-постинг.

### meta

- **M1 — Repo conventions**: правила “rules vs skills”, ссылки на `catalog.yaml`/`CURSOR_SKILLS.md` (если применимо).

### studio

- **ST1 — Deliverable**: определён выходной артефакт (док/матрица/ревью-вердикт).
- **ST2 — Gate language**: есть APPROVED/NEEDS REVISION/CONCERNS или аналог gate.

