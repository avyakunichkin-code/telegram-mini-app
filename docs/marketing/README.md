---
layer: marketing
status: active
last_reviewed: 2026-05-23
---

# Маркетинг и коммуникации Money Quest

Отдельный слой документации: **вне** конвейера idea → spec → code, но со ссылками на продукт и бренд.

| Документ | Назначение |
|----------|------------|
| [`CHANGELOG_TRACKER.md`](CHANGELOG_TRACKER.md) | Темы для постов, статусы **Утверждено** / **Опубликовано** |
| [`POST_STYLE.md`](POST_STYLE.md) | Тон, структура, ограничения копирайта и визуала |
| [`TELEGRAM_PUBLISHING.md`](TELEGRAM_PUBLISHING.md) | Публикация в канал через Bot API |
| [`posts/`](posts/) | Утверждённые артефакты (текст + картинка) |
| [`posts/draft/`](posts/draft/) | Черновики до согласования |
| [`strategy/`](strategy/) | Стратегия, бюджеты, каналы (заготовка) |

**Agent Skill:** `.cursor/skills/social-changelog-posts/` — посты по коммитам и сессиям.

**Не трогаем код приложения** при работе скилла; только файлы в `docs/marketing/` (и генерация изображений в артефакты).

## Бренд и персонаж

- Тон и визуал: [`../reference/brandbook/BRANDBOOK.md`](../reference/brandbook/BRANDBOOK.md)
- Монетка: [`../reference/CHARACTER_MONETKA.md`](../reference/CHARACTER_MONETKA.md), ассеты [`../reference/assets/`](../reference/assets/)

## Почему отдельная папка, а не `docs/reference/`

`reference/` — долгоживущий брендбук и GDD. `marketing/` — **операционный цикл**: что уже рассказали, черновики постов, каналы, бюджеты. Разделение упрощает права доступа и не смешивает канон продукта с черновиками анонсов.
