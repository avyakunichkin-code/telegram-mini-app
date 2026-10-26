# APPROVED — Onboarding O2

**Дата утверждения A ★:** 2026-06-01 (продукт + lab)  
**Spec:** `docs/specs/features/SPEC_onboarding-o2.md`  
**Lab:** `design-lab/onboarding-o2/guidance-strip-round/`  
**Prod:** `MqxGuidanceStrip` + `styles/mqx/guidance.css`  
**Dev catalog:** `#/dev/mqx` → `MqxGuidanceStripDemo`

## Канон — variant A ★ Violet bubble dock

| Элемент | Решение |
|---------|---------|
| Контейнер | Bottom strip над tab bar, slide-up, violet wash (`--mqx-onboarding-bubble-*`) |
| Toolbar слева | `‹` · **N из M** · `›` (или «Подсказка» в nudge) |
| Toolbar справа | Зелёный ✓ (`--mq-emerald`) после gate · **×** icon-only |
| Контент | Заголовок + голос (`mqx-voice-em`), **без** PNG Монетки |
| CTA | «Понятно» на read-gate шагах |

## Не в prod (reference в lab)

| Вариант | Причина |
|---------|---------|
| B — Neutral sheet | Слабее бренд / голос Монетки |
| C — Compact | Мельче tap-target на TMA |
| D — Floating pill | Хуже стык с tab bar / safe-area |

## Prod-хотфиксы без смены дизайна

| Дата | Что | Почему |
|------|-----|--------|
| 2026-10-15 | `MqxGuidanceStrip` — `forwardRef` вместо `ref` в пропсах | React 18.2 не передаёт `ref` функциональному компоненту как проп: `GameGuidanceLayer` не получал ссылку на strip. Визуал и канон варианта A не меняются |
| 2026-10-26 | Тосты (`ToastHost`) поднимаются над полоской: `bottom ≥ --mqx-guidance-strip-lift` | плейтест: тост лежал поверх текста подсказки. Вид полоски не меняется |
| 2026-10-26 | Пунктир к якорю (`MqxGuidanceAnchorLink`) скрыт, пока открыта карусель событий или итоги хода | якорь под оверлеем — линия вела «в никуда» поверх карты события |
| 2026-10-26 | Тексты: шаг `p1_period` описывает раскладку BG-1 (номер хода в углу, «Завершить ход» широкой кнопкой); `t_events_intro` — «нажми на события вверху карточки хода» | прежние тексты описывали снятую раскладку («Ход в процессе» слева) и несуществующую кнопку «События» |

## Supersedes

O1 `OnboardingCoach` / `GameOnboardingLayer` сняты из prod (2026-06-01); lab `onboarding-guided/` удалён из репо.
