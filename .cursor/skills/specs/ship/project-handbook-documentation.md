# Skill Test Spec: /project-handbook-documentation

**Skill:** `.cursor/skills/project-handbook-documentation/SKILL.md`  
**Category:** ship · **Priority:** medium

---

## Test Case 1: Playtest wave — обновить 5-минутку

### Fixture

- Пользователь: «Подготовь документы для Pre-Alpha плейтеста».
- В prod: `EVENTS_PER_PERIOD = 2`, ЦА 30+ в `TARGET_PLAYER`.

### Expected behavior

1. Читает `PLAYER_EXPERIENCE.md`, `PRE_ALPHA_PLAYTEST_PROTOCOL.md`, `roles/playtest.md`.
2. Не добавляет пути к `backend/app/` в player-facing doc.
3. Ссылается на TMA **и** PWA.
4. Не включает `handbook/internal/` в маршрут плейтестера.
5. **Verdict: COMPLETE**.

### Assertions

- [ ] `PLAYER_EXPERIENCE.md` существует и без формул decay/cashflow.
- [ ] `PRE_ALPHA` status active, ссылка на handbook GAME (не корневой redirect).
- [ ] DOC_SYNC_LOG при смысловых правках.

---

## Test Case 2: Partner pack — только публичное

### Fixture

- Пользователь: «Собери пакет для партнёра».

### Expected behavior

1. Маршрут: PRODUCT_BRIEF → FEATURE_STATUS → ECONOMY_OVERVIEW → brandbook.
2. Явно исключает `internal/` и сырой PRODUCT_BACKLOG.
3. Monetization = TBD, не выдумывает модель.
4. **Verdict: COMPLETE**.

### Assertions

- [ ] Нет копирования `internal/ECONOMY_TUNING.md` в partner-facing файл.
- [ ] MVP 2.0 Plan упомянут как обязательный в brief.

---

## Test Case 3: BLOCKED — handbook вместо spec

### Fixture

- Пользователь: «Опиши новый API эндпоинт только в GAME.md».

### Expected behavior

1. Отказывает или предлагает `spec-driven-development` + краткая ссылка из handbook.
2. **Verdict: BLOCKED** или handoff на spec.

### Assertions

- [ ] Не создаёт контракт API только в handbook.

---

## Protocol Compliance

- [ ] Ask-before-write если нет явного «делай».
- [ ] Не путать с `documentation-and-adrs` (ADR в `docs/decisions/`).
- [ ] Соблюдать GAME_FORMAT и термин «Потребности».
