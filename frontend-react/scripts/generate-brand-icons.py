#!/usr/bin/env python3
"""Квадратные favicon / PWA из logo-compact.png (contain, без растягивания)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets" / "brand" / "logo-compact.png"
PUBLIC = ROOT / "public"
PWA = PUBLIC / "pwa"

# Как manifest.background_color / pre-game
BG_RGBA = (245, 246, 248, 255)
# Доля поля с каждой стороны (логотип 3:2 — почти от края до края по ширине)
PADDING = 0.04


def fit_square(im: Image.Image, size: int, *, bg: tuple[int, int, int, int] = BG_RGBA) -> Image.Image:
    rgba = im.convert("RGBA")
    canvas = Image.new("RGBA", (size, size), bg)
    w, h = rgba.size
    inner = int(size * (1 - 2 * PADDING))
    scale = min(inner / w, inner / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = rgba.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing source: {SRC}")
    logo = Image.open(SRC)

    targets = [
        (PWA / "icon-192.png", 192),
        (PWA / "icon-512.png", 512),
        (PWA / "apple-touch-icon.png", 180),
        (PUBLIC / "favicon-32.png", 32),
        (PUBLIC / "favicon-48.png", 48),
    ]
    PWA.mkdir(parents=True, exist_ok=True)
    for path, px in targets:
        out = fit_square(logo, px)
        if path.suffix.lower() == ".png":
            out.save(path, optimize=True)
        print(f"Wrote {path.relative_to(ROOT)} ({px}x{px})")


if __name__ == "__main__":
    main()
