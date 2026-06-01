---
status: approved
last_reviewed: 2026-05-25
---

# Брендбук v2 — двухуровневая структура

## Problem Statement

Как сделать брендбук единым источником истины, чтобы identity (лого, Монетка, посты) и Product UI (MQX) не смешивались в одном устаревающем PDF?

## Recommended Direction

**Два документа и два PDF:**

| Слой | Markdown | PDF (печать) |
|------|----------|--------------|
| **Brand Guidelines** | [`BRANDBOOK.md`](../../reference/brandbook/BRANDBOOK.md) | `brandbook-print.html` |
| **Product UI (MQX)** | [`BRANDBOOK_MQX.md`](../../reference/brandbook/BRANDBOOK_MQX.md) | `brandbook-mqx-print.html` |

**Пакет ассетов:** [`docs/reference/brandbook/assets/`](../../reference/brandbook/assets/INDEX.md) — G1, G2, monetka, avatar **ТХ** (SVG 512×512).

**Tagline (рекомендация до ★ T*):** G1 — tagline в PNG на старте; G2 + tagline в CSS на игре/лендинге (T1/T7 из tagline-round).

## Key Assumptions to Validate

- [ ] Квадратный аватар ТХ из SVG достаточен для TG (экспорт PNG 512)
- [ ] Отдельный ★ на tagline CSS перед сменой лендинга
- [ ] Два PDF не путают SMM (нужна явная «кто читает что» в §0 BRANDBOOK)

## MVP Scope (сделано)

- [x] `BRANDBOOK.md` v2.0 + реестр ★
- [x] `BRANDBOOK_MQX.md` v1.0
- [x] `assets/` + `avatar-tx.svg`
- [x] Два print HTML
- [x] Deprecated и tagline recommendation

## Not Doing (and Why)

- Figma library — вне MVP
- Pantone/CMYK — v2.1
- Автоген PDF в CI — позже
- Полный каталог всех `mqx-*` в Brand PDF — только в MQX doc

## Open Questions

- Миграция лендинга с flat SVG на G1/G2 — отдельная задача frontend
