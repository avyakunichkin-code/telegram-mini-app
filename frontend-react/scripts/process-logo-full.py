#!/usr/bin/env python3
"""G1 logo-full: фон → trim → высоты h70…h280 + WebP, синк в landing/docs."""
from __future__ import annotations

import importlib.util
import shutil
import sys
from pathlib import Path

from PIL import Image

_SCRIPT_DIR = Path(__file__).resolve().parent
_raster_spec = importlib.util.spec_from_file_location(
    "regenerate_transparent_raster",
    _SCRIPT_DIR / "regenerate-transparent-raster.py",
)
_raster = importlib.util.module_from_spec(_raster_spec)
assert _raster_spec and _raster_spec.loader
_raster_spec.loader.exec_module(_raster)

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
BRAND = ROOT / "src" / "assets" / "brand"
HEIGHTS = (70, 105, 140, 210, 280)
TRIM_PAD = 2
SYNC_TARGETS = (
    REPO / "landing" / "public" / "brand",
    REPO / "docs" / "reference" / "brandbook" / "assets" / "logos",
)


def trim_transparent(im: Image.Image, pad: int = TRIM_PAD) -> Image.Image:
    rgba = im.convert("RGBA")
    alpha = rgba.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return rgba
    x0, y0, x1, y1 = bbox
    w, h = rgba.size
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    return rgba.crop((x0, y0, x1, y1))


def resize_height(im: Image.Image, height: int) -> Image.Image:
    w, h = im.size
    if h <= 0:
        return im
    scale = height / h
    new_w = max(1, round(w * scale))
    return im.resize((new_w, height), Image.Resampling.LANCZOS)


def process_master(src: Path) -> Image.Image:
    im = Image.open(src)
    out = _raster.flood_transparent(im)
    out = _raster.remove_enclosed_checkerboard(out)
    out = _raster.defringe_gray_halo(out)
    return trim_transparent(out)


def save_png_webp(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG")
    im.save(path.with_suffix(".webp"), "WEBP", quality=86, method=6, lossless=False)


def sync_canonical(png: Path, webp: Path) -> None:
    for dest_dir in SYNC_TARGETS:
        if not dest_dir.parent.exists():
            continue
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(png, dest_dir / png.name)
        shutil.copy2(webp, dest_dir / webp.name)


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: npm run logo-full:process -- <путь-к-исходному.png>")
        print("Пример: npm run logo-full:process -- ./logo-draft.png")
        sys.exit(1)

    src = Path(sys.argv[1]).expanduser().resolve()
    if not src.is_file():
        print(f"Файл не найден: {src}")
        print("Укажите реальный PNG (не плейсхолдер path/to/source.png).")
        sys.exit(1)

    master = process_master(src)
    print(f"master trimmed: {master.width}x{master.height}")

    sizes_dir = BRAND / "logo-full-sizes"
    sizes_dir.mkdir(parents=True, exist_ok=True)

    save_png_webp(master, sizes_dir / "logo-full-master.png")
    print(f"  logo-full-master: {master.width}x{master.height}")

    for h in HEIGHTS:
        sized = resize_height(master, h)
        stem = f"logo-full-h{h}"
        save_png_webp(sized, sizes_dir / f"{stem}.png")
        print(f"  {stem}: {sized.width}x{sized.height}")

    # Канон prod: h280 ≈ 2× отображения ~140px по высоте в CSS
    canonical = resize_height(master, 280)
    save_png_webp(canonical, BRAND / "logo-full.png")
    sync_canonical(BRAND / "logo-full.png", BRAND / "logo-full.webp")
    print("OK logo-full.png + landing/docs sync")


if __name__ == "__main__":
    main()
