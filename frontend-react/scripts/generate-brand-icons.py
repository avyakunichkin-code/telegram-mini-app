#!/usr/bin/env python3
"""Квадратные favicon / PWA из logo-compact.png (trim прозрачности, крупный contain)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets" / "brand" / "logo-compact.png"
PUBLIC = ROOT / "public"
PWA = PUBLIC / "pwa"

# Как manifest.background_color / pre-game
BG_RGBA = (245, 246, 248, 255)
# Поле после обрезки прозрачности (почти от края до края)
PADDING = 0.01
# Maskable: логотип заполняет safe-zone (~80% ширины), иначе на ярлыке PWA мелко
MASKABLE_WIDTH_RATIO = 0.82


def trim_transparent(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    alpha = rgba.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return rgba
    return rgba.crop(bbox)


def fit_square(
    im: Image.Image,
    size: int,
    *,
    padding_ratio: float = PADDING,
    bg: tuple[int, int, int, int] = BG_RGBA,
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    w, h = im.size
    inner = int(size * (1 - 2 * padding_ratio))
    scale = min(inner / w, inner / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def fit_maskable(
    im: Image.Image,
    size: int,
    *,
    width_ratio: float = MASKABLE_WIDTH_RATIO,
    bg: tuple[int, int, int, int] = BG_RGBA,
) -> Image.Image:
    """PWA maskable: крупный логотип в центре (видимая зона после круглой маски)."""
    canvas = Image.new("RGBA", (size, size), bg)
    w, h = im.size
    target_w = max(1, int(size * width_ratio))
    target_h = max(1, int(size * width_ratio))
    scale = min(target_w / w, target_h / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing source: {SRC}")
    logo = trim_transparent(Image.open(SRC))
    print(f"Source trimmed: {logo.size[0]}x{logo.size[1]} px")

    square_targets: list[tuple[Path, int, float]] = [
        (PWA / "icon-192.png", 192, PADDING),
        (PWA / "icon-512.png", 512, PADDING),
        (PWA / "apple-touch-icon.png", 180, PADDING),
        (PUBLIC / "favicon-32.png", 32, PADDING),
        (PUBLIC / "favicon-48.png", 48, PADDING),
        (PUBLIC / "favicon-192.png", 192, PADDING),
    ]
    maskable_targets: list[tuple[Path, int]] = [
        (PWA / "icon-192-maskable.png", 192),
        (PWA / "icon-512-maskable.png", 512),
    ]
    PWA.mkdir(parents=True, exist_ok=True)
    for path, px, pad in square_targets:
        out = fit_square(logo, px, padding_ratio=pad)
        out.save(path, optimize=True)
        print(f"Wrote {path.relative_to(ROOT)} ({px}x{px}, pad={pad:.0%})")
    for path, px in maskable_targets:
        out = fit_maskable(logo, px)
        out.save(path, optimize=True)
        print(f"Wrote {path.relative_to(ROOT)} ({px}x{px}, maskable {MASKABLE_WIDTH_RATIO:.0%})")


if __name__ == "__main__":
    main()
