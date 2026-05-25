# Брендбук ТВОЙ ХОД — Brand Guidelines

**Версия документа:** 2.0  
**Дата:** май 2026  
**Слой:** identity (лого, цвет, голос, Монетка, маркетинг)  
**Product UI (MQX):** отдельно — [`BRANDBOOK_MQX.md`](BRANDBOOK_MQX.md) · PDF [`brandbook-mqx-print.html`](brandbook-mqx-print.html)

**Пакет ассетов:** [`assets/INDEX.md`](assets/INDEX.md)  
**Печать Brand Guidelines:** [`brandbook-print.html`](brandbook-print.html)

### Changelog

| Версия | Дата | Изменения |
|--------|------|-----------|
| 2.0 | 2026-05 | Двухуровневая структура; реестр ★; G1/G2; Монетка; tagline; 2 PDF; avatar ТХ |
| 1.2 | 2026-05 | Актуализация ТВОЙ ХОД, отказ flat SVG / MQ |
| 1.1 | 2026-05 | MQX, типографика TMA |

### Кто читает что

| Аудитория | Документ |
|-----------|----------|
| SMM, партнёры, печать | Этот файл + `assets/` + Brand PDF |
| Frontend / design-lab | [`BRANDBOOK_MQX.md`](BRANDBOOK_MQX.md) + [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) |
| Монетка (копирайт) | [`CHARACTER_MONETKA.md`](../CHARACTER_MONETKA.md) |
| Посты канала | [`POST_STYLE.md`](../../marketing/POST_STYLE.md) |

**Иерархия:** `vision/ideas` (имя) → **брендбук** → `design-lab/*/APPROVED.md` → prod assets / `mqx/`.

---

## 0. Позиционирование

**ТВОЙ ХОД** — обучающая игра про личные финансы: периоды, решения, последствия. Публичное имя и смысл «свой ход → твой ход»: [`product-name-tvoy-hod.md`](../../vision/ideas/product-name-tvoy-hod.md).

| Элемент | Правило |
|---------|---------|
| **Подзаголовок** | **Финансы как игра** — обязателен в маркетинге и в G1 |
| **Монетка** | Маскот и напарница, **не** название продукта |
| **Game / Plan** | Один визуальный язык; Plan в UI пока «скоро» — не продавать как готовое |
| **Тех. префиксы** | `tvoy-hod`, MQX в коде — не публичный бренд |

---

## 1. Реестр утверждений ★

Единственный канон визуала — строки ниже. Всё остальное в `design-lab/` без ★ — черновик.

| Решение | ID | Дата | Источник | Prod / применение |
|---------|-----|------|----------|-------------------|
| Lockup full + tagline | **G1** | 2026-05-20 | [`design-lab/brand-logo/APPROVED.md`](../../../design-lab/brand-logo/APPROVED.md) | `logo-full.png`, `BrandMark` |
| Lockup compact | **G2** | 2026-05-20 | то же | `logo-compact.png`, `MqxTabHero` |
| Эталон 3D-цвета | REF | — | `design-lab/brand-logo/assets/reference-ep-author-why.png` | Маркетинг, не UI lockup |
| Монограмма аватар | **ТХ** | 2026-05 | [`assets/logos/avatar-tx.svg`](assets/logos/avatar-tx.svg) | TG 512×512, соцсети |
| Dashboard unified | S5 | 2026-05 | [`design-lab/dashboard/APPROVED.md`](../../../design-lab/dashboard/APPROVED.md) | см. MQX doc |
| Guided onboarding | Coach | 2026-05-20 | [`design-lab/onboarding-guided/APPROVED.md`](../../../design-lab/onboarding-guided/APPROVED.md) | см. MQX doc |
| New game mode UI | R2 | 2026-05-20 | [`design-lab/new-game-mode/APPROVED.md`](../../../design-lab/new-game-mode/APPROVED.md) | см. MQX doc |

---

## 2. Логотип и знак

### 2.1 Состав

| Элемент | Правило |
|---------|---------|
| **Lockup** | **ТВОЙ ХОД** — 3D-растр PNG; **ТВОЙ** Coin Gold `#EAB308`, **ХОД** Quest Violet `#6D28D9` |
| **G1** | С tagline «Финансы как игра» — старт, auth, меню, **по центру** |
| **G2** | Без tagline — hero в игре, табы, **слева** |
| **ТХ** | Только pill/chip и квадратный аватар; не замена G1/G2 в шапке |

Файлы: [`assets/logos/`](assets/logos/) · prod: `frontend-react/src/assets/brand/`.

### 2.2 Tagline — рекомендация продукта (до отдельного ★)

| Контекст | Рекомендация |
|----------|----------------|
| **Старт, auth, меню** | Tagline **в G1** (уже в PNG) — не дублировать крупным CSS |
| **Игра, лендинг после миграции** | **G2 + tagline в CSS** (не в PNG): шрифт system-ui 500, на тёмном фоне белый / `#F3F4F6`, на светлом Slate `#6B7280`; не ярче lockup |
| **Кандидаты lab** | T1 (близко к посту) или T7 (Inter 500) — [`design-lab/brand-logo/tagline-round/`](../../../design-lab/brand-logo/tagline-round/) |

Утверждение отдельного T* в чате — перед сменой prod вне G1.

### 2.3 Размеры и охранное поле

| Носитель | Минимум |
|----------|---------|
| G2 в hero | ~36–44 px по высоте макета |
| G1 на старте | ~240–280 px ширина @ 390px |
| ТХ | 24 px глиф; аватар **≥ 108×108** px содержательной части |
| Печать | 8 mm высота знака |
| Clear space | ≥ **½** высоты знака |

### 2.4 Недопустимо

Искажение пропорций · обводка вместо контраста · валюты внутри знака · несколько градиентов на малых размерах · знак на фото без подложки **≥ 40%** чёрной · **плоские SVG L1–L4** · **MQ** / Money Quest · кроп баннера с Монеткой как UI-лого.

### 2.5 Deprecated (не использовать)

| Артефакт | Статус |
|----------|--------|
| `docs/reference/brand/` L1–L4 | Удалён |
| `design-lab/brand-logo/assets/legacy/` | Удалён |
| `landing/public/brand/*.svg` | Interim до замены на G1/G2 |
| Money Quest, монограмма MQ | Сняты |

---

## 3. Основные принципы бренда

| Параметр | Описание |
|----------|----------|
| **Характер** | Уверенный наставник, без снисходительности |
| **Тон** | Коротко, активный залог |
| **Избегаем** | Паника, жаргон без расшифровки, «быстрое обогащение», «Вы / клиент» |
| **Хештег** | `#ТвойХод` |

---

## 4. Цветовая палитра

### 4.1 Основные

| Имя | HEX | CSS (`:root` / `#root`) | Применение |
|-----|-----|-------------------------|------------|
| Quest Violet | `#6D28D9` | `--mq-violet`, `--mq-accent-fill` | «ХОД», CTA TMA |
| Quest Violet Deep | `#5B21B6` | `--mq-violet-deep`, `--mq-accent-link` | Hover |
| Coin Gold | `#EAB308` | *(в lockup)* | «ТВОЙ», акцент tagline |
| Signal Emerald | `#059669` | `--mq-emerald` | Плюс, подушка |
| Ink | `#0F1115` | `--mq-ink` | Заголовки вне TG |

### 4.2 Нейтральные и статусы

| Имя | HEX | CSS | Применение |
|-----|-----|-----|------------|
| Mist | `#F5F6F8` | — | Фон веб-секций |
| Slate | `#6B7280` | — | Подписи |
| Line | `#E5E7EB` | `--mq-line` | Границы |
| Warning Amber | `#D97706` | `--mq-warning` | Таймер |
| Danger | `#DC2626` | `--mq-danger` | Просрочка |

### 4.3 Сочетания

**A** белый + Ink + violet CTA · **B** тёмный `#0F1115` + светлый текст + emerald KPI · **C** Mist + один акцент на экран · **D** градиент violet→indigo `#4338CA` только hero/промо.

**Избегать:** violet body на violet фоне; красный+зелёный без подписей (дальтоника).

---

## 5. Типографика

| Носитель | Шрифт |
|----------|--------|
| **TMA** | Системный стек; `--mq-fs-body` 15 / caption 12 / small 11 |
| **Лендинг, PDF, баннеры** | **Inter** (+ system-ui fallback) |
| **Код в UI** | JetBrains Mono / ui-monospace |

Иерархия лендинга: H1 28–32px … Caption 12–13px — см. прежние ориентиры в MQX doc для TMA-экранов.

Деньги: пробел тысяч, **₽** через неразрывный пробел.

---

## 6. Голос и копирайт

### 6.1 TMA и Монетка

- Только **ты / твой / тебе**  
- Канон реплик: [`CHARACTER_MONETKA.md`](../CHARACTER_MONETKA.md), [`onboarding-guided/CONTENT.md`](../../../design-lab/onboarding-guided/CONTENT.md)  
- Монетка не решает за игрока; не комментирует каждое событие  

### 6.2 Посты и канал (3-е лицо)

- Ведущий о команде и игроке — **не** «мы влили PR»  
- Монетка на **картинке**, в тексте серии — 3-е лицо (кроме пролога ep-000)  
- Канон: [`POST_STYLE.md`](../../marketing/POST_STYLE.md)  

### 6.3 Примеры

| Да | Нет |
|----|-----|
| «Получи зарплату в этом периоде» | «Предполагается получение дохода» |
| «Твоя подушка» (Монетка) | «Ваш баланс», «уважаемый пользователь» |
| «Разработчики добавили…» (пост) | «Миграция 0029» (пост) |

---

## 7. Монетка (маскот)

Полный канон: [`CHARACTER_MONETKA.md`](../CHARACTER_MONETKA.md).

| Параметр | Правило |
|----------|---------|
| Формат | PNG, прозрачный фон |
| Дефолт | [`assets/monetka/monetka-mascot.png`](assets/monetka/monetka-mascot.png) |
| Позы | `monetka-{pose}.png` → `MonetkaAvatar` |
| Пузырь | CSS, не в PNG |
| Нельзя | ₽ на лице; заглушка вместо ассета |

---

## 8. Маркетинг и носители

| Носитель | Правило |
|----------|---------|
| Визитка | G1 или ТХ + tagline; полоса violet 4mm |
| Квадрат 1080 | G1/G2/ТХ; текст ≤25%; Монетка не перекрывает lockup |
| Сторис | Safe zone 140px; CTA контраст ≥4.5:1 |
| Баннер 1200×628 | Лого слева; один градиент; один CTA |

---

## 9. Чеклист перед публикацией (Brand)

- [ ] Лого G1/G2 или ТХ из [`assets/`](assets/INDEX.md)  
- [ ] Нет MQ / Money Quest / flat SVG  
- [ ] Tagline на обложке маркетинга  
- [ ] Монетка: PNG, «ты»  
- [ ] Контраст WCAG AA где возможно  
- [ ] Посты: [`POST_STYLE.md`](../../marketing/POST_STYLE.md)  

**TMA-экраны:** дополнительно [`BRANDBOOK_MQX.md` §9](BRANDBOOK_MQX.md#9-чеклист-экрана-перед-merge).

---

## 10. Экспорт PDF

| PDF | Источник | Файл |
|-----|----------|------|
| **Brand Guidelines** | Этот MD | [`brandbook-print.html`](brandbook-print.html) |
| **Product UI (MQX)** | [`BRANDBOOK_MQX.md`](BRANDBOOK_MQX.md) | [`brandbook-mqx-print.html`](brandbook-mqx-print.html) |

**Браузер:** открыть HTML → Ctrl+P → «Сохранить как PDF» → включить фоновую графику.

**Pandoc (Brand):**

```bash
pandoc docs/reference/brandbook/BRANDBOOK.md -o TvoyHod-Brand-Guidelines.pdf --pdf-engine=xelatex -V geometry:margin=20mm
pandoc docs/reference/brandbook/BRANDBOOK_MQX.md -o TvoyHod-Product-UI.pdf --pdf-engine=xelatex -V geometry:margin=20mm
```

---

*Конец Brand Guidelines ТВОЙ ХОД v2.0.*
