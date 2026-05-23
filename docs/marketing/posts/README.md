# Артефакты постов

## Структура

```text
posts/
  draft/
    draft_2026-05-23_<slug>/
      post.md
      image.png
      meta.json      # опционально: commits[], platforms[]
  2026-05-23_<slug>/   # только после «Утверждено»
      post.md
      image.png
      meta.json
```

## `meta.json` (опционально)

```json
{
  "slug": "2026-05-23_real-estate-catalog",
  "commits": ["abc1234", "def5678"],
  "platforms": ["telegram"],
  "approved_at": null,
  "published_at": null
}
```

Поле `published_at` заполняет **пользователь** после выкладки; агент не ставит.

## Связь с трекером

Строка в [`../CHANGELOG_TRACKER.md`](../CHANGELOG_TRACKER.md) → колонка **Артефакт** = относительный путь к папке.
