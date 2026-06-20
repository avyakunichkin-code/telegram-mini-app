---
layer: agents
status: active
last_reviewed: 2026-06-20
tags:
  - tvoy-hod/layer/agents
aliases:
  - LEGACY_NOISE_AUDIT
---
# Legacy noise audit (2026-06-20)

После [ADR-012](../decisions/ADR-012-primary-channels-pwa-web-over-tma.md): что **удалено**, что **подрезано**, что **оставить**.

---

## Удалено (batch 2026-06-20)

| Путь | Причина |
|------|---------|
| `.cursor/skills/specs/specs/` (21 файл) | Случайная вложенная копия `specs/`; 0 ссылок в `catalog.yaml` |
| `.cursor/skills/results/skill-test-*-2026-05-*.md` (8 файлов) | Устаревшие прогоны; канон — `*-2026-06-20.md` + `catalog.yaml` |
| `docs/agents/SKILLS_AUDIT_2026-06-01.md` | Заменён `SKILLS_QUALITY_AUDIT_2026-06-20.md` |

**Политика results:** хранить только последний прогон на skill/mode; старые удалять после обновления `catalog.yaml`.

---

## Подрезано (messaging ADR-012)

| Путь | Изменение |
|------|-----------|
| `README.md`, `CLAUDE.md` | Не «Telegram Mini App first» |
| `docs/handbook/GAME.md`, `PRODUCT_BRIEF.md` | PWA/web primary |
| `docs/foundation/PROJECT_META.md`, `SPEC_PRODUCT.md` | Единый frontmatter; §1.1 каналы |
| `docs/specs/SPEC_FRONTEND_UI.md` | SPA/PWA spec, не TMA-only |
| `docs/handbook/FEATURE_STATUS.md` | Порядок платформ |
| `docs/foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md` | PW1 smoke на PWA/web |
| `docs/agents/CURSOR_SKILLS.md` | Убрана дублирующая tier-таблица |
| `docs/plans/README.md` | Ссылка на `tvoy-hod-router`, не legacy rule |
| `.gitignore` | `.obsidian/graph.json` локально |
| Wave 4 (2026-06-20) | `UI_CONSISTENCY_AUDIT`, `SPEC_ANALYTICS` §6, `mqx-ui-unification`, `marketing.md`, `GAME_DESIGN_ROADMAP`, investor/GDD refs |

---

## Не удалять

| Категория | Примеры | Почему |
|-----------|---------|--------|
| Redirects | `release-tma` → `release-web` | `/release-tma` invocations |
| Secondary flows | `TMA_USER_FLOWS.md` | TMA channel, ADR-012 banner |
| Historical ADR | ADR-001…011 | Контекст решений |
| Studio archive | `.cursor/skills/_archived/` | Явный баннер + `disable-model-invocation` |
| Marketing drafts | `docs/marketing/posts/draft/` | Narrative; править при публикации |
| Superseded specs | `SPEC_onboarding-tma`, O2 stubs | [`docs/archive/`](archive/README.md) |

---

## Следующая волна (не сделано)

_Все пункты волн 1–4 закрыты 2026-06-20. Опционально: commit legacy-cleanup; investor `deck.html` title (HTML, не критично)._

## Волна 4 (2026-06-20) — выполнено

| Действие | Артефакты |
|----------|-----------|
| Superseded ideas → redirect | `onboarding-tma-mission-brief`, `onboarding-o2-progressive-guidance` |
| PLAN O1 fix | `PLAN_onboarding-tma` → `SPEC_onboarding-o3` |
| UI audit | `UI_CONSISTENCY_AUDIT`: SPA/PWA, O3, onboarding-brief → archive |
| ADR-012 trim | marketing role, landing-mqx, mqx-ui-unification, GAME_DESIGN_ROADMAP, SPEC_ANALYTICS §6, architecture-review, CHARACTER_MONETKA, TVOY_HOD outline, INVESTOR_DECK |
| Archive O1 | onboarding-brief note; убрана ссылка на PLAN O2 как канон |

## Волна 2 (2026-06-20) — выполнено

| Действие | Артефакты |
|----------|-----------|
| O1 archive stub | `docs/archive/onboarding-o1/README.md`; SPEC/PLAN → redirect |
| Backlinks | TRACEABILITY, CHARACTER_MONETKA, PRODUCT_BACKLOG, O2 spec/idea |
| UX platform | 10 файлов `docs/ux/` |
| Marketing | ep-000 drafts, NARRATIVE_PLAN, INTERVIEW |
| release-web spec test | `.cursor/skills/results/skill-test-spec-release-web-2026-06-20.md` |

## Волна 3 (2026-06-20) — выполнено

| Действие | Артефакты |
|----------|-----------|
| O2 archive | `docs/archive/onboarding-o2/`; `SPEC_onboarding-o2.md` (~300 строк → redirect) |
| O3 канон | backlinks → `SPEC_onboarding-o3.md`; TRACEABILITY O3 row |
| Character XP | `docs/archive/character-xp-progression/`; LEVEL_XP, XP matrix, PLAN → redirect |
| Hero compact | `docs/archive/dashboard-hero-compact/`; idea → redirect |
| TEAM_UPDATE | `status: archived` + banner |

---

## Связанные документы

- [SKILLS_QUALITY_AUDIT_2026-06-20.md](SKILLS_QUALITY_AUDIT_2026-06-20.md) §12 Channel strategy
- [DOC_SYNC_LOG.md](../foundation/DOC_SYNC_LOG.md)
