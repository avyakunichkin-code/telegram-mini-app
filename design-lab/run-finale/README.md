# Run finale — финал партии (победа / поражение)

**Статус:** ★ BG-2 в prod (2026-10-15) — канон [`APPROVED.md`](./APPROVED.md).
**Идея:** [`docs/vision/ideas/game-run-finale-pre-alpha.md`](../../docs/vision/ideas/game-run-finale-pre-alpha.md) (эпик **GE1**)

## Где смотреть

| Что | Где |
|-----|-----|
| Prod parity ★ BG-2 | [`bg2-page-round/`](./bg2-page-round/) |
| Канон-дизайн BG-2 | [`../board-game/screens-round/`](../board-game/screens-round/) — «Финал · Победа», «Финал · Поражение» |
| Утверждённый React | `#/dev/mqx` → «Финал партии ★ BG-2» |
| История: V1 «Газета» (2026-06-01) | [`index.html`](./index.html), [`VARIANTS.md`](./VARIANTS.md) |

## Запуск

Хаб (по умолчанию): `cd design-lab && npx serve .` → `/run-finale/bg2-page-round/`.

Один раунд:

```bash
cd design-lab/run-finale/bg2-page-round
./sync-lab.sh   # lab-base.css из board-game (токены ADR-014 + screens-round) и ассеты
npx serve .
```

История V1: `cd design-lab/run-finale && ./sync-lab.sh && npx serve .`

## Ассеты победы

Четыре маскота с кубком: `assets/{student,professional,manager,entrepreneur}-mascot-cup-dash.png`. Исходники — `assets/source/`. Пересборка: `python process-cup-assets.py` из этой папки (нужен Pillow). В prod — `frontend-react/src/assets/run-finale-cup/`.
