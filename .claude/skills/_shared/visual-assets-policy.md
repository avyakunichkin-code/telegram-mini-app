# Visual assets policy (ТВОЙ ХОД)

**Применяется** при появлении или смене **иконок, иллюстраций, фонов, портретов, обложек** в UI, lab, marketing.

## Принцип

**Не сдаём временные визуальные заглушки** в prod-ready срезе. Нужен реальный ассет в репозитории — согласованный по формату.

| Не сдаём | Сдаём |
|----------|--------|
| Emoji как иконка UI | SVG/PNG/WebP в `src/assets/` или lab `./assets/` |
| Colored `div` «потом картинка» | Файл + `img` / CSS `background-image` |
| `via.placeholder.com`, data-URI заглушки | Коммитнутый ассет |
| «Поставь любую картинку» без стиля | Генерация по brandbook + согласование |
| GenerateImage без OK формата | Сначала согласование, потом генерация |

**Текст-копирайт** (реалистичные русские строки вместо Lorem) — отдельно от растров/SVG; для текста допустимы осмысленные строки из spec/persona.

---

## Процедура

### 1. Согласовать формат (до генерации)

`AskUserQuestion` или явный вопрос в чате:

| Параметр | Примеры |
|----------|---------|
| Тип | иконка / иллюстрация / фон / портрет персоны |
| Формат | SVG (иконки), PNG/WebP (фото, портреты) |
| Размер / aspect | 48×48, 1:1 round, 16:9 hero |
| Стиль | [BRANDBOOK_MQX.md](../../../docs/reference/brandbook/BRANDBOOK_MQX.md), существующие ассеты темы |
| Путь в репо | `frontend-react/src/assets/…`, `design-lab/…/assets/`, `landing/public/…` |

**Без согласования** — не вызывать `GenerateImage` и не коммитить «временный» файл.

### 2. Получить ассет

| Источник | Когда |
|----------|--------|
| **Существующий каталог** | Портреты: `persona-portraits`, `PersonaPortrait`, `npm run persona-portraits:process` |
| **Brandbook / INDEX** | [`docs/reference/brandbook/assets/INDEX.md`](../../../docs/reference/brandbook/assets/INDEX.md) |
| **GenerateImage** | Новый уникальный визуал; `reference_image_paths` при стиле из референса |
| **Design-lab** | `./assets/` в round; `sync-lab` копирует в prod при canon-sync |

Итерация: если пользователю не подходит — правки по feedback, не переходить к **COMPLETE**.

### 3. Подключить в коде

- Prod: импорт из `src/assets/` или MQX-паттерн проекта.
- Lab: только относительные `./assets/` (self-contained round).
- **a11y:** `alt` для смысловых изображений; декоративные — `alt=""`.

### 4. Verify

- [ ] Файл в git, путь стабилен
- [ ] Нет TODO «заменить картинку»
- [ ] `npm run build` (если затронут frontend)
- [ ] Lab: нет 404 на assets после `serve` из `design-lab/`

---

## По контексту

| Контекст | Primary skill | Дополнительно |
|----------|---------------|---------------|
| Prod UI | frontend-ui-engineering | design-lab-mqx если новый паттерн |
| Lab макет | design-lab-mqx | DESIGN_WORKFLOW § утверждение |
| Marketing пост | social-changelog-posts | GenerateImage + TELEGRAM_PUBLISHING |
| Портрет шаблона | frontend-ui / incremental | pipeline persona-portraits |

---

## Verdict

| Ситуация | Verdict |
|----------|---------|
| Визуал нужен, формат не согласован | **BLOCKED** — clarify-first |
| Prod с placeholder-картинкой | **CONCERNS** — не COMPLETE |
| Ассет в репо, стиль OK | часть **PASS** release-ready UI |

См. также [release-ready-quality.md](release-ready-quality.md) § UI, [clarify-first.md](clarify-first.md).
