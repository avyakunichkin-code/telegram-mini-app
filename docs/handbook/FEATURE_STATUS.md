---
layer: handbook
status: active
last_reviewed: 2026-06-01
audience: product, playtest, partners
---

# Матрица фич — что в prod

Сводка для **плейтестеров и партнёров** без чтения бэклога. Детали поведения — [`GAME.md`](GAME.md) · сверка с кодом — [`MVP_AUDIT_VS_SPEC.md`](../foundation/MVP_AUDIT_VS_SPEC.md).

| Маркер | Значение |
|--------|----------|
| ✅ | В production |
| 🟡 | Частично / polish / spec draft |
| ⬜ | Запланировано, в prod нет |

---

## Core

| Фича | Статус | Комментарий |
|------|--------|-------------|
| Игровой месяц (TB1), «Закрыть месяц» | ✅ | Без real-time таймера |
| Зарплата по кнопке (пропуск = нет выплаты за период) | ✅ | |
| Поражение: 3 периода cash &lt; 0 | ✅ | |
| Победа Victory v2 (`chain` / legacy `parallel`) | ✅ | Только по целям chain; period gate снят (2026-06); полная кампания **~40–60** мес. |
| UI целей (`MqxGoalDash`) | ✅ | |
| 2 события на период, tier/cooldown | ✅ | [ADR-009](../decisions/ADR-009-metrics-dictionary-tb1.md) |

---

## Финансы и инструменты

| Фича | Статус | Комментарий |
|------|--------|-------------|
| Подушка безопасности | ✅ | |
| Кредиты / обязательства, просрочка | ✅ | |
| Активы из шаблонов | ✅ | |
| Вклад, облигации | ✅ | |
| Страховки | ✅ | |
| UI вкладки «Финансы» (Детали \| Действия) | ✅ | 2026-06; [`finance.md`](../ux/screens/finance.md) |
| `mechanics_unlock` по целям победы | ✅ | [ADR-004](../decisions/ADR-004-mechanics-unlock-victory-chain.md) |
| Статьи расходов (E1) | 🟡 | Агрегат lifestyle есть; полная модель — backlog |
| Акции, ETF, биржа | ⬜ | Вне scope |
| Налоги, ИИС | ⬜ | Backlog |

---

## Персонаж и контент

| Фича | Статус | Комментарий |
|------|--------|-------------|
| Выбор персонажа (шаг 2 Game) + растровые портреты | ✅ | [`character-pick.md`](../ux/screens/character-pick.md); lab ★ [`persona-portraits-round`](../../../design-lab/game-templates/persona-portraits-round/) |
| Портрет на Z-NEEDS по `template_key` | ✅ | `MqxNeedsDash` + `PersonaPortrait` size `dash` |
| Потребности (4 шкалы), decay, treat-self | 🟡 | BE + UI; spec draft |
| Поражение: 3 периода шкала = 0 | 🟡 | [ADR-005](../decisions/ADR-005-character-needs-state-and-defeat.md) |
| Каталог событий MVP 1.1 | ✅ | `data/events/mvp11/` |
| Продуктовая глава событий (trade-off, повторы) | ✅ | [`EVENTS.md`](EVENTS.md) |
| Сверка каталога с trade-off / lifecycle / axis | ✅ | EVT1-105 (2026-05-30): pytest balance baseline **0** |
| Достижения (движок) | 🟡 | UI «Развитие» — M12 |
| Character level / XP | ⬜ | Снято навсегда [ADR-003](../decisions/ADR-003-remove-character-progression.md) |

---

## Режимы и платформы

| Фича | Статус | Комментарий |
|------|--------|-------------|
| Game (`save_kind: game`) | ✅ | Шаблоны старта |
| Plan (`save_kind: plan`) | 🟡 | **MVP 2.0 обязателен** — UI «Скоро» |
| Telegram Mini App | ✅ | |
| PWA / браузер (email+пароль) | ✅ | [`PWA_INSTALL.md`](../foundation/PWA_INSTALL.md) |
| Legacy light/hardcore | ⬜ | Снято [ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md) |

---

## Онбординг, аналитика, ops

| Фича | Статус | Комментарий |
|------|--------|-------------|
| Mission Brief / онбординг O1 | 🟡 | [SPEC_onboarding-tma](../specs/features/SPEC_onboarding-tma.md) |
| Экран аналитики | ✅ | [SPEC_ANALYTICS](../specs/SPEC_ANALYTICS.md) |
| Balance playtest (headless) | ✅ | [`docs/balance/`](../balance/README.md) |
| Ops-алерты + Watchtower `#/admin` | 🟡 | RU-тексты в TG; KPI summary (PA-A*) — backlog A2 |
| Pre-Alpha волна 10–20 | 🟡 | Доки + KPI v1.2 (PA-T* / PA-A*) готовы; **набор не начат** — [Ops](../foundation/PRE_ALPHA_WAVE1_OPS.md) |
| Closed Alpha D1/D7 | ⬜ | KPI в [`KPI_AND_PHASES.md`](KPI_AND_PHASES.md); Amplitude / digest ⬜ |
| Монетизация B2C | ⬜ | TBD — [`MONETIZATION.md`](MONETIZATION.md) |

---

## Воронка и лиды (гипотеза советника)

Статус prod на 2026-05-30; канон — [`ADVISOR_FUNNEL_AUDIENCE.md`](ADVISOR_FUNNEL_AUDIENCE.md).

| Фича | Статус | Комментарий |
|------|--------|-------------|
| Игра как бесплатный lead magnet | ✅ | Нет in-app оплаты |
| Лендинг `/landing/` | 🟡 | Зародыш; тексты из advisor-doc §9.6 → `ru.json` / `en.json` |
| Опрос после 4-го периода (возраст, доход, боль) | ⬜ | §9.6 checklist |
| UTM + `partner_id` на ссылках | ⬜ | CRM партнёра |
| Analytics: `game_over`, `lead_cta_click`, … | ⬜ | [`SPEC_ANALYTICS`](../specs/SPEC_ANALYTICS.md) + backlog |
| Lead scoring Tier A/B/C | ⬜ | Пороги в advisor-doc §9.2 |
| CTA «Разбор с советником» в приложении | ⬜ | После Closed Alpha |
| Сеть советников (стандарт, lead card) | ⬜ | Один партнёр сейчас |

---

## Связанные документы

| Документ | Зачем |
|----------|--------|
| [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) | Vision, pillars, MVP 2.0 |
| [`ADVISOR_FUNNEL_AUDIENCE.md`](ADVISOR_FUNNEL_AUDIENCE.md) | Воронка советника (гипотеза) |
| [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) | Очередь команды |
| [`TRACEABILITY.md`](../TRACEABILITY.md) | Эпики MQ-* |

---

*Обновлять при смене статуса в `GAME.md` § «Статус production» или после релиза эпика.*
