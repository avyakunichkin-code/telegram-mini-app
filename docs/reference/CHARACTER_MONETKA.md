---
layer: reference
status: approved
last_reviewed: 2026-05-23
role: onboarding_mascot
tags:
  - tvoy-hod/layer/reference
  - tvoy-hod/status/approved
aliases:
  - "Персонаж: Монетка"
  - CHARACTER_MONETKA
---
# Персонаж: Монетка

**Монетка** — игровой наставник **ТВОЙ ХОД** для онбординга и (позже) коротких подсказок. Не банковский консультант и не «голос приложения». Смысл бренда и обращение «на ты»: [`product-name-tvoy-hod.md`](../vision/ideas/product-name-tvoy-hod.md).

---

## Роль в продукте

| Контекст | Роль Монетки |
|----------|----------------|
| **Mission Brief (O1)** | Ведёт 3 шага «первого месяца»; учит через **вымышленное познание** («только что поняла») |
| **Coach marks (P1.1)** | Одна реплика в bubble, без длинного текста |
| **События / экономика** | **Не** комментирует каждое событие (перегруз) |
| **Меню** | «Повторить обучение» — снова бриф с Монеткой |

---

## Характер и тон (утверждено 2026-05-20)

| Принцип | Как звучит |
|---------|------------|
| **Напарница** | «Я» в женском роде; **только на «ты»** — *ты, твой, тебе, твои*; не «уважаемый пользователь» |
| **ТВОЙ ХОД** | Подсказывает правила и последствия, **не решает за игрока**; выбор и ответственность — у человека |
| **Познание** | «Оказывается…», «Я только что поняла…», «Интересно, а что если…» |
| **Задор** | Лёгкая ирония, можно «я тоже забыла / промахнулась» |
| **Мягкость** | Без грубого сленга и морали; шутки про механику — дозированно |
| **Честность** | Правила игры объясняем прямо (зарплата не приходит сама) |

**Палитра заходов:** «Оказывается…» · «Я только что поняла…» · «Интересно, а что если…» · «Ещё одна штука:…»

**Не делаем:** лекции, банковский жаргон, детский «ура-ура», крипто-мемы, стыд игрока, **канцелярит «Вы / Ваш / Вам»** и отстранённое «пользователь».

**Обращение (утверждено 2026-05-23):**

| Да | Нет |
|----|-----|
| «Твой ход», «ты можешь», «твоя подушка» | «Ваш ход», «Вы можете», «уважаемый клиент» |
| «Давай посмотрим на **твой** баланс» | «Предлагаем ознакомиться с балансом» |

**Канон копирайта онбординга:** [`SPEC_onboarding-o3.md`](../specs/features/SPEC_onboarding-o3.md) · beats в [`backend/app/guidance/curriculum.py`](../../backend/app/guidance/curriculum.py) · архив: [`archive/onboarding-o1/`](../archive/onboarding-o1/README.md), [`archive/onboarding-o2/`](../archive/onboarding-o2/README.md).

---

## Визуал

| Элемент | Правило |
|---------|---------|
| **Форма** | Круглая монета, ручки и ножки, дружелюбный cartoon |
| **Формат** | **PNG**, прозрачный фон (`alpha`); WebP — позже при оптимизации бандла |
| **Дефолт** | [`assets/monetka-mascot.png`](assets/monetka-mascot.png) — приветствие, общий UI |
| **Позы** | Каталог [`assets/monetka-poses/`](assets/monetka-poses/) |
| **В онбординге** | Над заголовком брифа, ~120px (O1 lab: [`design-lab/onboarding-brief`](../../design-lab/onboarding-brief/); канон — [`SPEC_onboarding-o3.md`](../specs/features/SPEC_onboarding-o3.md)) |
| **Позы v1 (прод)** | Пока одна PNG на все 3 экрана брифа; каталог — для coach / auth / lab |

**Недопустимо:** CSS-заглушка; ₽ на лице; UI-карточка, запечённая в PNG позы (пузырь рисуется CSS).

### Именование файлов

Шаблон: **`monetka-{pose}.png`**, kebab-case, латиница.

| `pose` | Файл | Когда в UI |
|--------|------|------------|
| *(дефолт)* | [`monetka-mascot.png`](assets/monetka-mascot.png) | Старт, меню, онбординг-brief |
| `sit-edge` | [`monetka-poses/monetka-sit-edge.png`](assets/monetka-poses/monetka-sit-edge.png) | «Сидит на краю» пузыря (`MonetkaBubbleScreen`, coach) — **только персонаж**, ноги свисают |
| `laugh` | [`monetka-poses/monetka-laugh.png`](assets/monetka-poses/monetka-laugh.png) | Успех, шутка |
| `joyful` | [`monetka-poses/monetka-joyful.png`](assets/monetka-poses/monetka-joyful.png) | Сильная радость, праздник |
| `think` | [`monetka-poses/monetka-think.png`](assets/monetka-poses/monetka-think.png) | Объяснение механики, «интересно…» |
| `wink` | [`monetka-poses/monetka-wink.png`](assets/monetka-poses/monetka-wink.png) | Подбодрить, «ты справишься» |
| `alert` | [`monetka-poses/monetka-alert.png`](assets/monetka-poses/monetka-alert.png) | Важное правило, предупреждение |

**Новая поза:** `monetka-{pose}.png` в `docs/reference/assets/monetka-poses/` → обработка (alpha) → `frontend-react/src/assets/monetka-poses/`; prop `pose` у `MonetkaAvatar`.

**Prod `sit-edge`:** `MqxMonetkaDialogScreen` — `pose="sit-edge"`, низ монеты на кромке `.mqx-monetka-dialog__speech`.

**Композиция `sit-edge`:** нижняя кромка монеты совпадает с верхом CSS-пузыря (`.mqx-auth-monetka__bubble`); карточка не входит в ассет.

---

## Связь с брендом

Quest Violet `#6D28D9`, золото/amber — [`BRANDBOOK.md`](brandbook/BRANDBOOK.md).

---

## UI онбординга

**Layout A ★** (O1, архив) — [`design-lab/onboarding-brief/APPROVED.md`](../../design-lab/onboarding-brief/APPROVED.md): Монетка + заголовок + текст + «Посмотреть» + видео. Канон prod: [`SPEC_onboarding-o3.md`](../specs/features/SPEC_onboarding-o3.md).

---

## Связанные документы

- [`archive/onboarding-o1/README.md`](../archive/onboarding-o1/README.md) — O1 stub
- [`onboarding-tma-mission-brief.md`](../vision/ideas/onboarding-tma-mission-brief.md) — исторический контекст
