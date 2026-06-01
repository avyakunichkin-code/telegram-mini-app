# Guidance strip round (O2)

**Spec:** `docs/specs/features/SPEC_onboarding-o2.md` · **★ A = prod**

## Запуск

```powershell
cd design-lab/onboarding-o2/guidance-strip-round
.\sync-lab.ps1
npx serve .
```

Хаб: `cd design-lab && npx serve .` → «Guidance strip (O2)».

## Sync

```powershell
.\sync-lab.ps1
# или из frontend-react:
npm run design-lab:sync-round -- design-lab/onboarding-o2/guidance-strip-round
```

## Варианты

См. [`VARIANTS.md`](./VARIANTS.md). Тестовые данные одинаковые: beat `p1_period`, баланс **42 150 ₽**, период **1**.

## Состояния (секция 2)

| State | Описание |
|-------|----------|
| Read + CTA | «1 из 4», кнопка «Понятно» |
| Gate done | «2 из 4», чек «Готово» |
| Nudge | Без стрелок, счётчик «Подсказка» |
