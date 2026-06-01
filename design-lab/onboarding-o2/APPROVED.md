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

## Supersedes

O1 `OnboardingCoach` / `GameOnboardingLayer` сняты из prod (2026-06-01); lab `onboarding-guided/` удалён из репо.
