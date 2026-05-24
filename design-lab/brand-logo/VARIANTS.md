# Логотип «ТВОЙ ХОД» — варианты

Эталон визуала: [`docs/marketing/posts/draft/draft_ep-000-author-why/image.png`](../../docs/marketing/posts/draft/draft_ep-000-author-why/image.png) (3D: «ТВОЙ» золото, «ХОД» фиолет, tagline белый, блёстки). Монетка и сцена за столом — **не** часть lockup для UI.

## Таблица

| ID | Файл | Назначение | Статус |
|----|------|------------|--------|
| **REF** | `assets/reference-ep-author-why.png` | Контекст / цвет / наклон букв | эталон поста |
| **G1** | `assets/G1-full-tagline.png` | Стартовые экраны: по центру, **с** «Финансы как игра» | **кандидат ★** |
| **G2** | `assets/G2-compact-stacked.png` | Hero в игре: слева, **без** tagline | **кандидат ★** |
| LEG | `assets/legacy/*-flat.svg` | Плоский SVG из docs | **отклонить** |

## Prod после утверждения

| Экран | Компонент | Ассет |
|-------|-----------|-------|
| Вход, регистрация, меню, новая игра | `BrandMark` | G1 → `logo-full.png` |
| Дашборд в `GameScreen` | `BrandLogo variant="compact"` | G2 → `logo-compact.png` |

Прозрачный фон обязателен. Не использовать кроп полного баннера REF.

## Tagline (раунд 2)

Подпись **«Финансы как игра»** — отдельно от 3D: [`tagline-round/`](tagline-round/) (T1–T15, тёмный/светлый в каждой карточке). См. [`tagline-round/TAGLINE_VARIANTS.md`](tagline-round/TAGLINE_VARIANTS.md).

Рекомендация: в prod **G2 PNG + tagline в CSS**, не запекать текст в lockup.

## Утверждение

Напишите в чат, например: **«★ G1 + G2 + T7»** или укажите правки (размер tagline, наклон, контраст на тёмном).

До ★ prod может оставаться на interim flat SVG — не считать финалом.
