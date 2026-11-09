---
layer: spec
status: approved
last_reviewed: 2026-11-06
---
# Понятный выбор, цель и потребности

Основание: владелец утвердил [Events B / Goal A / Needs A](../../../../design-lab/player-decisions/clear-next-step-round/APPROVED.md).
Существующие действия и экономика сохраняются. Все preview read-only.

## API событий, additive v1

В `GET /api/game/events/pending` и `GET /api/game/bootstrap` каждый choice
с профилем получает `future_payments`:

```json
{"version":1,"payments":[{"period_index":11,"choice_path":["Погасить всё сразу"],"cash_delta":-150000,"salary_fraction":0.75,"conditional":true}],"incomplete":false}
```

`payments` — список возможных разовых денежных последствий продолжения.
Разные ветви — альтернативы, их нельзя складывать в одно обязательство.
Платежи одной ветви на разных ходах последовательны. `choice_path` описывает
условную последовательность последующих выборов. Одинаковый cash outcome
на том же ходе с тем же parent-path может объединять названия альтернатив.
`salary_fraction` nullable: при наличии сумма приблизительная по текущей
зарплате, фактическая зарплата определяется на ходе списания. То же округление
до десятков, что `resolve_cash_pct_salary`. Положительный cash_delta — доход.

Текущий cash и регулярные изменения остаются в прежних `impacts`.
Старые поля/status/auth не меняются. Старый клиент игнорирует новое поле;
новый при отсутствующем/неподдержанном preview показывает прежние impacts.
Пустой payments не обещает отсутствия всех будущих расходов, только отсутствие
предсказанных разовых cash-эффектов. Dynamic chain_action/claim неизвестны;
`incomplete=true` требует явной оговорки без выдуманной суммы.

Обход catalogue definitions ограничен depth4/nodes32/payment rows24, цикл,
отсутствующее или inactive продолжение также дают incomplete. Branch фильтры
и перенос контекста совпадают с игровыми helpers; offset не меньше1.
Никакие события/цепочки/платежи не создаются. SQL/schema не меняются.

## UI и действия

Events B: денежные строки внутри существующей кнопки. Сейчас и будущие
условные варианты раздельны, salary estimates с≈. aria-describedby связывает
последствия с доступным именем выбора. Нажатие по-прежнему сразу делает выбор.

Goal A: для safety_fund_months показываются remaining/current/target.
Предложение=min(остаток, max(0,cash−current_outflow)), до копеек вниз.
Кнопка открывает существующий sheet с суммой; текущий submit повторно проверяет
баланс. Нулевой свободный остаток блокирует CTA. Для passive income — остаток
дохода/месяц; unsupported goals сохраняют дорожку без выдуманного действия.
Завершённая/недоступная цель не получает денежного CTA.

Needs A: при минимальной потребности<40 показывается оценка из
needs_meta.periods_to_zero_if_idle только для set_point. Без прогноза — честный
fallback, не фронтенд-расчёт следующего закрытия. Эффекты отдыха — effective
needs_delta из API, без повторного масштабирования. Из положительных опций
предпочитается доступная по цене. Availability/cooldown/cash блокируют CTA.
Кнопка открывает прежний treat-self sheet, не выполняет оплату.

## Traceability и сценарии

- Backend: `events/future_payments.py`, `services/events/payload.py`.
- MQX: `MqxChoiceConsequences`, `MqxGoalNextStep`, `MqxNeedsRecovery`; каталог
  `MqxPlayerDecisionsDemo`, интеграция `DashboardPremium` и EventChoiceButton.
- Проверки: `test_future_payments_preview.py` (ветви, зарплата, цикл, context,
  read-only, JSON/auth); `nextGoalAction.test.js` (резерв/границы);
  `e2e/player-decisions.spec.js` (реальный перевод, без автооплаты,
  окно отдыха/cooldown и доступное описание выбора, mobile/desktop).
- Текущие ошибки bootstrap сохраняют действующий error-flow, новый запрос
  фронтенда не добавляется. Lab содержит loading/empty/error/disabled.
