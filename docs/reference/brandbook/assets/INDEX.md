---
tags:
  - tvoy-hod/layer/reference
aliases:
  - "Пакет ассетов брендбук ТВОЙ ХОД"
  - INDEX
---
# Пакет ассетов брендбук ТВОЙ ХОД

Экспорты для PDF, партнёров и маркетинга. **Единый источник** — [`дизайн-система`](../../../../design/system/index.html), папки `assets/` и `fonts/`. Эти копии обновляются командой `node scripts/design-assets.mjs` из корня, вручную не редактируются. [Правила хранения](../../../../design/system/ASSET_STORAGE.md).

| Файл | Назначение | Prod / lab |
|------|------------|------------|
| [`logos/logo-full.png`](logos/logo-full.png) | G1 — старт, auth, меню (tagline 3D в lockup) | `frontend-react/src/assets/brand/logo-full.png` |
| — | G1 размеры h70…h280 + master | `frontend-react/src/assets/brand/logo-full-sizes/` |
| [`logos/logo-compact.png`](logos/logo-compact.png) | G2 — hero в игре, табы | `frontend-react/src/assets/brand/logo-compact.png` |
| [`logos/avatar-tx.svg`](logos/avatar-tx.svg) | Квадрат **512×512** — аватар TG, соцсети | Экспорт PNG @1x/@2x из SVG |
| [`monetka/monetka-mascot.png`](monetka/monetka-mascot.png) | Дефолтная поза маскота | `docs/reference/assets/monetka-mascot.png` |

**Экспорт аватара в PNG:** открыть `avatar-tx.svg` → 512×512 (Figma / Inkscape / браузер).

**Не хранить здесь:** отклонённые flat SVG L1–L4, Money Quest / MQ.
