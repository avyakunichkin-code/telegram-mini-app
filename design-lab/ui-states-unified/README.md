# UI states + icon family — единый lab-раунд

**Статус:** ★ утверждено 2026-05-29 → в prod ([`APPROVED.md`](./APPROVED.md))  
**Эпик:** [`mqx-ui-unification`](../../docs/vision/ideas/mqx-ui-unification.md) · **B1 + B2 + B3**  
**Backlog:** [`DESIGN_IMPROVEMENTS_BACKLOG.md`](../../docs/agents/DESIGN_IMPROVEMENTS_BACKLOG.md) (закрывает D8 после ★)

Один раунд на **два связанных разрыва**: «третий язык» пустых экранов и **разные иконки** (дашборд 2×2, ритуал итога периода, метрики капитала).

**Не в scope раунда:** перекомпоновка S5, capital-page IA, Victory vs GoalDash (B4), новые градиенты hero.

---

## Зачем один раунд

| Проблема в prod | Сейчас | Цель ★ |
|-----------------|--------|--------|
| **B1** Empty / error / loading | `MqxCapitalEmpty` + `mqx-fin-empty` (dashed) + `Spinner` TGUI | Один семейство `mqx-state-*` |
| **B2** Иконки итога периода | `MqxPeriodCloseRitual`: символы `+`, `!`, `◎` в круге | SVG из того же набора, что метрики |
| **B3** Иконки 2×2 на главной | Inline SVG в `DashboardPremium` | Те же stroke/вес, что `FinanceMetricIcons` |

После ★ → `MqxStateBlock` (или расширение `MqxCapitalEmpty`) + `IconMetric*` / `IconDash*` в `mqx/icons/` → `#/dev/mqx` → замена по вкладкам **одним PR на состояния**, **одним на иконки** (или вместе, если утверждено вместе).

---

## Структура витрины (план `index.html`)

Телефонная рама 390×844, переключатель **светлая / тёмная**, якоря по секциям.

| Секция | Варианты | Тест-кейсы (одинаковые данные) |
|--------|----------|--------------------------------|
| **S1 Empty** | A–D | «Нет позиций», «Нет полисов», «Портфель пуст» |
| **S2 Error** | A–C | «Не удалось загрузить», кнопка «Повторить» |
| **S3 Loading** | A–C | Список 3 строки / блок дашборда |
| **S4 Icons — ritual** | A–C | 4 beats: доход, расход, cash, подушка |
| **S5 Icons — dash chips** | A–C | 2×2: Доходы, Расходы, Баланс, Подушка |

Подробная таблица: [`VARIANTS.md`](./VARIANTS.md).  
Копирайт и суммы: [`CONTENT.md`](./CONTENT.md).

---

## Правила вариантов

- **2–5 на подсекцию** (не 15 экранов — иначе не выбрать).
- Только токены `lab-base` / `tma-base`: `--mq-violet`, `--mqx-surface-*`, `--mq-fs-*`.
- **Русский** UI; суммы как в prod: `12 400 ₽`, `+3 200 ₽`.
- Референс prod: `mqx-capital-empty`, `mqx-fin-empty`, `MqxPeriodCloseRitual`, chips в `goal-chain-round` / parity dashboard.

---

## Критерии выбора ★ (для утверждения в чате)

### Состояния (B1)

1. Читается на **тёмной теме TG** без «белого острова».
2. **Не только цвет:** empty/error понятны без emerald/red.
3. Touch: CTA и retry ≥ **44px**.
4. Пустое состояние **не dashed** (legacy `mqx-fin-empty` уходит).
5. Один компонент с пропами: `variant="empty|error|loading"`, опционально `actionLabel` / `onRetry`.

### Иконки (B2 + B3)

1. **Один stroke-weight** (ориентир: `FinanceMetricIcons`, 1.75).
2. Ритуал периода: **не текстовые** `+` / `!` в круге — SVG + tone class (`--pos` / `--neg` / neutral).
3. Chips 2×2: те же глифы, что метрики (`up`, `down`, `coin`/wallet, shield/cushion) — или явная карта в `CONTENT.md`.
4. Размеры: **16px** в метриках строки, **22–24px** в chip icon box, **28–32px** в ritual beat (масштаб из одного viewBox).

---

## Prod после ★ (чеклист внедрения)

```
Состояния
- [ ] mqx/primitives/MqxStateBlock.jsx (или MqxCapitalEmpty v2)
- [ ] styles/mqx/states.css
- [ ] Заменить mqx-fin-empty в InsuranceSection и др.
- [ ] GameScreen / Finance / Analytics: loading skeleton единый
- [ ] #/dev/mqx → секция «Состояния»

Иконки
- [ ] mqx/icons/IconDash*.jsx или расширить FinanceMetricIcons
- [ ] periodCloseRitual.js → icon: React node / icon id, не '+'
- [ ] DashboardPremium financeCards → импорт из mqx/icons
- [ ] #/dev/mqx → «Иконки дашборда и итога периода»
- [ ] Canon Sync: этот README → APPROVED.md, parity в dashboard page-round
```

---

## Запуск (после сборки раунда)

```bash
cd design-lab/ui-states-unified/states-icons-round
.\sync-lab.ps1
npx serve .
```

Пока папки `states-icons-round/` нет — работаем по этому brief.

---

## Связанные документы

| Документ | Роль |
|----------|------|
| [`VARIANTS.md`](./VARIANTS.md) | A/B/C/D по секциям |
| [`CONTENT.md`](./CONTENT.md) | Фикстуры данных |
| [`design-lab/row-actions/README.md`](../row-actions/README.md) | Канон метрик (coin/down/up/percent/term) |
| [`design-lab/game-ui/juice-round/APPROVED.md`](../game-ui/juice-round/APPROVED.md) | Ритуал C — не ломать композицию |
| [`docs/ux/accessibility-requirements.md`](../../docs/ux/accessibility-requirements.md) | Basic tier |

---

## Следующий шаг для агента / дизайнера

1. Создать `design-lab/ui-states-unified/states-icons-round/` (self-contained).
2. Сверстать S1–S5 по `VARIANTS.md` + `CONTENT.md`.
3. Показать в чате → **«Утверждаем S1-B + S4-A + …»**.
4. `frontend-ui-engineering` + перенос D8 из backlog в «Готово».
