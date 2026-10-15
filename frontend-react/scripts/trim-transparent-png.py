#!/usr/bin/env python3
"""Обрезать прозрачные поля у PNG с альфой и пересобрать WebP рядом.

Зачем: генераторы отдают персонажа посреди большого пустого холста (Монетка — 1536×1024),
и в UI на 22–56 px он выглядит крошечным. После обрезки картинка заполняет свой бокс.

Запуск из frontend-react:
  py -3 scripts/trim-transparent-png.py src/assets/monetka-mascot.png src/assets/monetka-poses/*.png

Повторный запуск безопасен: уже обрезанная картинка почти не меняется (останется отступ PAD).
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ALPHA_THRESHOLD = 8  # пиксели прозрачнее считаем фоном (мягкие края генератора)
PAD = 0.03  # отступ вокруг персонажа, доля от большей стороны обрезанной области
WEBP_QUALITY = 90


def trim(path: Path) -> tuple[tuple[int, int], tuple[int, int]]:
    im = Image.open(path).convert("RGBA")
    alpha = im.getchannel("A").point(lambda a: 255 if a > ALPHA_THRESHOLD else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        raise SystemExit(f"{path}: картинка полностью прозрачная")
    left, top, right, bottom = bbox
    pad = round(max(right - left, bottom - top) * PAD)
    box = (
        max(0, left - pad),
        max(0, top - pad),
        min(im.width, right + pad),
        min(im.height, bottom + pad),
    )
    out = im.crop(box)
    out.save(path, optimize=True)
    out.save(path.with_suffix(".webp"), "WEBP", quality=WEBP_QUALITY, method=6)
    return im.size, out.size


def main(argv: list[str]) -> None:
    if not argv:
        raise SystemExit(__doc__)
    for arg in argv:
        before, after = trim(Path(arg))
        print(f"{arg}: {before[0]}x{before[1]} -> {after[0]}x{after[1]}")


if __name__ == "__main__":
    main(sys.argv[1:])
