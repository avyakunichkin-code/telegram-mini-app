---
layer: vision
status: active
last_reviewed: 2026-06-01
tracks: ge1, pre-alpha, run-finale, player-feedback
idea_refine: 2026-06-01
design_lab: design-lab/run-finale/
related: specs/features/SPEC_victory-v2.md, foundation/SPEC_PRODUCT.md §3.3
not_in_scope: specs/features/SPEC_achievements.md (M12 chains — MVP 2.0 / Plan)
---

# Game Run Finale (Pre-Alpha) — GE1

## Problem Statement

**Как дать игроку 30+ ощущение завершённой истории в партии**, когда победа и поражение уже считаются движком, но UI почти не реагирует — при длинной кампании (~40–60 периодов), без звука/haptic и **без** системы achievement-chains (M12)?

## Recommended Direction

**Симметричный ритуал финала** + контракт **`run_summary`** на backend. Визуальные варианты — в [`design-lab/run-finale/`](../../../design-lab/run-finale/) (S0, V1, V7, V8); после ★ — spec → prod.

| Исход | Поведение профиля | UI |
|--------|-------------------|-----|
| **Победа** (`win_reached`, первый раз) | Партия **остаётся активной** ([SPEC_victory-v2](SPEC_victory-v2.md) F1); в списке сохранений бейдж **«Победа»** | Полноэкранный финал: **игровые заслуги** (статистика), не M12 |
| **Поражение** (`is_active=0`) | Профиль **архивируется** (или `is_archived=1`); бейдж **«Поражение»** | Тот же каркас + шаблон Монетки по `defeat_reason` + **1–2 факта** из снимка |

CTA: **Новая игра** | **Играть дальше** (только победа — закрывает ритуал, не завершает партию).

**Звук / haptic:** не делаем (Pre-Alpha).

### Терминология (важно)

| Термин в GE1 | Значение |
|--------------|----------|
| **Игровые заслуги** | Hero-метрики и «чем похвалить» за партию: периоды, cashflow, подушка, вложения, пассивный доход, долг/просрочка, прогресс целей chain |
| **Achievements (M12)** | Цепочки tier в БД, API `/achievements` — **вне scope GE1** до MVP 2.0 и Plan Mode |

## Варианты design-lab (что сравниваем)

| ID | Название | Суть |
|----|----------|------|
| **S0** | Базовый ритуал | Hero 5–7 метрик, Монетка, CTA, блок обратной связи |
| **V1** | **Газета** | «Полосы» итогов, заголовок выпуска, газетная типографика |
| **V7** | **Сценарий** | Flavor копирайта и заголовка по `starter_template_key` |
| **V8** | **Онбординг** | При поражении — полоса «вернись к шагу O1» (не новый туториал, ссылка на уже пройденные подсказки) |

Запуск: `cd design-lab && npx serve .` → хаб → **Run finale**.

**Ассеты победы:** `process-cup-assets.py` — flood фона, defringe, trim (без лишних прозрачных полей), dash 108px + WebP; в UI только tight PNG/WebP, не сырой source.

## Обратная связь в игре (GE1-FB)

**Не только** опрос для приглашённых плейтестеров — **встроенный канал** на экране финала (и опционально в меню позже):

- Поле **«Комментарий»** — необязательное, но **заметное** (не серый ghost).
- Кнопка **«Отправить»**.
- Backend: `POST /api/feedback/run` (или `game_feedback`) — `profile_id`, `outcome`, `template_key`, `period_index`, `text`, `defeat_reason?`, `client_meta`; без PII сверх того, что уже в профиле.
- Admin: строка в Watchtower / TG ops или таблица `player_feedback` для triage Pre-Alpha.

Пустой submit — disabled или мягкий toast «Напишите пару слов или пропустите».

## Key Assumptions to Validate

- [ ] Игрок понимает «Победа сценария» vs «играть дальше» vs бейдж в списке сохранений (PA-T2).
- [ ] Архив при поражении не ломает ожидание «вернуться к тому же save» — нужен явный копирайт «сохранение в архиве».
- [ ] Комментарии дают полезный сигнал без модерации спама (rate limit / min length опционально).

## MVP Scope (Pre-Alpha)

**In**

- `run_summary` API + `victory_finale_shown_at` (или флаг) на профиле
- FE: финал победы (первый `win_reached`), доработка defeat под общий layout
- Сохранения: бейджи **Победа** / **Поражение**; поражение → archive
- In-game feedback на финале (+ API)
- Design-lab: S0 + V1 + V7 + V8 → утверждение → spec

**Hero-метрики v1 (игровые заслуги, не M12)**

1. Периодов до исхода  
2. `avg_net_cashflow_6p` (+ n)  
3. Подушка в месяцах обязательств  
4. Сумма в инвестициях  
5. Пассивный денежный поток (активы + купоны)  
6. Просрочка / долг на финале  
7. Цели chain: N из M (победа) или одна строка «что сорвалось» (поражение)

**Out (Not Doing)**

- Звук, haptic, share-карточки  
- **Любой UI/API M12 achievement chains**  
- Песочница с отдельными правилами (только «играть дальше» = dismiss)  
- Персональный AI-coach при поражении (только шаблон + 1–2 факта)  
- Player inbox notifications (отдельная фаза)

## Not Doing (and Why)

- **M12 «Развитие» на финале** — продуктово отложено до MVP 2.0 / Plan; путает с «заслугами за партию».
- **Жёсткое завершение партии при победе** — против F1 и выбора «играть дальше».
- **Обязательный комментарий** — режет конверсию; поле заметное, но optional.

## Open Questions

- Нужен ли комментарий также с **дашборда** (не только финал) в α? — backlog GE1-FB-2.
- При поражении по **needs** — мини-бары четырёх шкал или только текст + факт streak?

## Следующий шаг

1. Review [`design-lab/run-finale/`](../../../design-lab/run-finale/) → ★ в чате.  
2. `spec-driven-development` → `docs/specs/features/SPEC_game-run-finale.md`.  
3. `incremental-implementation` + `frontend-ui-engineering`.

## Verdict (idea-refine)

**APPROVED** направление 2026-06-01 (уточнения пользователя: без звука, lab-варианты, архив при поражении, бейдж победы, in-game feedback, без M12).
