# Миграция v2 → v3

v3 не меняет бренд: роли цвета ADR-014, Nunito + Manrope, материалы BG-1/BG-2 остаются. Меняется то, что в prod расползлось: 56 HEX и 159 `rgba()` в `styles/mqx`, тёмная тема в 2 из 12 файлов, шаг отступов 2px, 20+ радиусов при двух токенах, ≈35 сочетаний длительности и кривой.

## Что поменялось

| Было (prod, `tokens.css` / `tma-base.css`) | Стало (v3) | Почему |
|---|---|---|
| `--mq-turn` dark `#8b5cf6` | заливка `mq-turn` dark `#7c3aed` + текст `mq-turn-ink` dark `#a78bfa` | белый на `#8b5cf6` — 4.2:1, фиолетовый текст на клетке — 3.95:1: оба ниже AA |
| — | `mq-board-ink-faint` `#71688a` / `#8f86a3` | третичный текст; аудит предлагал `#7a7190` — на поле это 4.07:1, мало |
| — | `mq-cell-raised`, `mq-control-edge`, `mq-warn`, `mq-warn-soft`, `mq-focus`, `mq-scrim` | подъём в тёмной теме, граница поля ≥3:1, предупреждение без провала контраста, единое кольцо фокуса |
| фокус `outline: 3px solid var(--coin)` (lab BG) | `mq-focus` 2px + offset 2px | золото на светлом — 1.9:1, кольцо не видно |
| `--mq-violet`, `--mq-emerald`, `--mq-danger`, `--mq-warning`, `--mq-ink`, `--mq-line` — свои HEX, без тёмной темы | алиасы на v3 | одна палитра; legacy удаляется через 1 релиз |
| `--mq-sp-1…7` = 4, 6, 8, 10, 12, 14, 16 | `mq-space-1…10` = 4, 8, 12, 16, 20, 24, 32, 40 | 4-pt ритм; 10 и 12 глаз не различает |
| `--mq-r-cell` 12, `--mq-r-card` 18 + литералы 4…22 | `mq-r-s` 8, `mq-r-cell` 12, `mq-r-card` 18, `mq-r-pill` | 4 радиуса; карта хода 20 → 18, фишки 14/16 → 12 |
| тени `rgba()` литералами | `mq-lift`, `mq-lift-turn`, `mq-lift-coin`, `mq-elev-1…3` | объём = словарь, работает в обеих темах |
| `--mq-fs-heading` 14 < `--mq-fs-body` 15 | `heading` 17 | заголовок крупнее текста |
| `--mq-fs-small` 11, `--mq-fs-micro` 10 (57 мест) | минимум `caption` 12 | ЦА 30+ |
| `--mq-fs-display` 26, `--mq-fs-money` 24, `--mq-fs-stat` 34 | `display` 28, `money` 28 | одна крупная ступень |
| `--mq-fw-medium` 550 | 400 / 600 | 550 не загружен — синтез |
| `0.14s ease`, `0.15s ease`, `120ms ease`… | `mq-dur-*` × `mq-ease-*` | 5 длительностей и 4 кривые |
| 6 бесконечных pulse в онбординге | 2 пульса при появлении | шум рядом с CTA, WCAG 2.2.2 |
| U+202F узкий пробел (рекомендация аудита) | U+00A0 | U+202F нет в Nunito/Manrope |

## Порядок переноса в prod

1. `tokens.css`: добавить v3-токены, legacy → алиасы, глобальный reduced-motion. Визуально почти ничего не меняется — проверка `#/dev/mqx` в обеих темах.
2. Guardrail `check:style-discipline`: запрет HEX/`rgba()`/`font-size < 12px`/`border-radius` вне токенов в `styles/mqx/*`. Сначала — режим отчёта, затем FAIL.
3. Файлы `styles/mqx/*` по одному, от крупных: `finance.css` (3669 строк) и `dashboard.css` (2026) — там 200 HEX. После каждого — тёмная тема бесплатно.
4. Шкала шрифтов и 4-pt отступы — через design-lab раунд «type & rhythm v3» (это видимая смена → ★).
5. Удалить legacy-алиасы и `--mq-sp-*`, `--mq-fs-small/micro`.

## Соответствие имён

| v2 | v3 |
|---|---|
| `--mq-sp-1` 4 | `mq-space-1` |
| `--mq-sp-2` 6, `--mq-sp-3` 8 | `mq-space-2` (8) |
| `--mq-sp-4` 10, `--mq-sp-5` 12 | `mq-space-3` (12) |
| `--mq-sp-6` 14, `--mq-sp-7` 16 | `mq-space-4` (16) |
| `--mq-hair` | `mq-hair-w` solid `mq-cell-edge` |
| `--mq-fs-title` 20 | `title` |
| `--mq-fs-lead` 17 | `lead` |
| `--mq-fs-cell` 18 | `cell-value` |
| `--mq-fs-note` 13 | `note` |
| `--mq-fs-caption` 12 | `caption` |
| `--mqx-glass-*`, `--mqx-surface-*` | `mq-cell` / `mq-cell-raised` |
| `--accent`, `--text`, `--text-h`, `--bg`, `--border` (шаблон Vite) | удалить; `mq-turn-ink`, `mq-board-ink-soft`, `mq-board-ink`, `mq-board`, `mq-cell-edge` |

## Статус переноса в prod (2026-10-29)

| Шаг | Статус | Что сделано / что осталось |
|-----|--------|----------------------------|
| 1. `tokens.css`: v3-токены, legacy → алиасы, reduced-motion | 🟡 | `bdef84a` (2026-10-26): legacy `--mq-violet / -emerald / -danger / -ink / -line` — алиасы и следуют тёмной теме; `--mq-warning` #b45309 / dark #fbbf24; `--mq-board-ink-faint`, `--mq-control-edge` (2026-10-28); токены движения и глобальный reduced-motion. **Значения движения — прежние** (base 250, slow 350, scene 500 мс; standard = `ease`), не v3. Нет (сверено grep 2026-10-29): `mq-cell-raised`, `mq-turn-ink`, `mq-warn-soft`, `mq-focus`, `mq-scrim`, `mq-lift*`, `mq-elev-*`, `mq-space-*`, `mq-r-s`, `mq-r-pill`, `mq-tap` — в коде их значения пока литералами или v2-токенами (`--mq-sp-*`). `ink.css` ссылается на неопределённый `--mq-r-s` (чип домена события) — угол сбрасывается в 0. `--mq-violet-deep` не алиас — #4c1d95 заметно темнил итоги хода |
| 2. Guardrail стилевой дисциплины | ✅ храповик | `check:style-discipline` (новые HEX/rgba и шрифты < 12 px запрещены по приросту) + `check:mqx-ratchet` (счётчики по файлам только убывают) в `check:guardrails`. Цветовых литералов 548 → 367, шрифтов < 12 px — 84 |
| 3. `styles/mqx/*` по файлам | 🟡 | 176 запасных HEX у определённых токенов и 6 голых HEX заменены без смены вида; крупные файлы (`finance.css`, `dashboard.css`) — впереди |
| 4. Шкала шрифтов и 4-pt отступы | ⬜ | Раунд lab «type & rhythm v3» не проводился |
| 5. Удалить legacy-алиасы | ⬜ | После шагов 3–4 |

Сверху на v2/v3 с 2026-10-28 лежит пробный слой «Чернильный край» (`ink.css`, компонент InkEdge): он использует токены v3 и не меняет шаги выше.
