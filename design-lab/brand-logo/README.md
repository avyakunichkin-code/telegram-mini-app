# Brand logo — design-lab

Раунд утверждения логотипа **ТВОЙ ХОД** перед переносом в `frontend-react/src/assets/brand/`.

## Запуск

```powershell
cd design-lab/brand-logo
npx serve .
```

Открыть корень (`index.html`). Все пути `./` — без `../` для статики.

## Файлы

| Файл | Описание |
|------|----------|
| [`index.html`](index.html) | Витрина REF, G1, G2, контекст, legacy |
| [`VARIANTS.md`](VARIANTS.md) | Таблица вариантов и правила prod |
| `assets/reference-ep-author-why.png` | Копия эталона из маркетинга |
| `assets/G1-full-tagline.png` | Полный lockup |
| `assets/G2-compact-stacked.png` | Компакт без tagline |

## Tagline

[`tagline-round/`](tagline-round/) — 15 вариантов подписи «Финансы как игра» (шрифты, цвета, тёмный/светлый).

```powershell
cd design-lab/brand-logo/tagline-round
npx serve .
```

## Статус

**★ Утверждено → prod** — G1 + G2, tagline как в G1. См. [`APPROVED.md`](APPROVED.md).
