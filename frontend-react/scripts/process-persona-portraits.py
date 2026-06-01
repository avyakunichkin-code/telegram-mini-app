#!/usr/bin/env python3
"""Портреты персонажей: фон → trim → размеры pick/md/dash + WebP."""
from __future__ import annotations

import importlib.util
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
flood_transparent = _raster.flood_transparent
defringe_gray_halo = _raster.defringe_gray_halo

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
LAB_ASSETS = REPO / "design-lab" / "game-templates" / "persona-portraits-round" / "assets"
PROD_ASSETS = ROOT / "src" / "assets" / "character-portraits"

PERSONAS = ("student", "professional", "manager", "entrepreneur")
HEIGHTS = {"pick": 56, "md": 72, "dash": 108}
TRIM_PAD = 4
# Высота непрозрачного силуэта после trim — одинаковая для всех персонажей
NORMALIZED_SILHOUETTE_HEIGHT = 960


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


def normalize_silhouette_height(im: Image.Image, target_h: int = NORMALIZED_SILHOUETTE_HEIGHT) -> Image.Image:
    """Выравнивает визуальный размер персонажа (не пустые поля холста)."""
    rgba = im.convert("RGBA")
    alpha = rgba.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return rgba
    _, y0, _, y1 = bbox
    content_h = y1 - y0
    if content_h <= 0 or content_h == target_h:
        return rgba
    scale = target_h / content_h
    new_w = max(1, round(rgba.width * scale))
    new_h = max(1, round(rgba.height * scale))
    return rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)


def process_source(src: Path) -> Image.Image:
    im = Image.open(src)
    out = flood_transparent(im)
    out = defringe_gray_halo(out)
    out = trim_transparent(out)
    return normalize_silhouette_height(out)


def write_outputs(base: Image.Image, slug: str, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    master = out_dir / f"{slug}-mascot.png"
    base.save(master, "PNG")
    base.save(master.with_suffix(".webp"), "WEBP", quality=86, method=6)

    for suffix, height in HEIGHTS.items():
        sized = resize_height(base, height)
        png = out_dir / f"{slug}-mascot-{suffix}.png"
        sized.save(png, "PNG")
        sized.save(png.with_suffix(".webp"), "WEBP", quality=86, method=6)

    print(f"OK {slug}: master {base.size[0]}x{base.size[1]}")


def resolve_source(slug: str) -> Path | None:
    lab_src = LAB_ASSETS / "source" / f"{slug}-mascot-source.png"
    if lab_src.exists():
        return lab_src
    if slug == "student":
        legacy = ROOT / "src" / "assets" / "character-needs" / "student-mascot.png"
        if legacy.exists():
            return legacy
    return None


def main() -> None:
    targets = [LAB_ASSETS, PROD_ASSETS]
    for slug in PERSONAS:
        src = resolve_source(slug)
        if not src:
            print(f"skip missing source for {slug}")
            continue
        base = process_source(src)
        for out_dir in targets:
            write_outputs(base, slug, out_dir)

    # обратная совместимость: дашборд needs пока читает character-needs/
    needs_dir = ROOT / "src" / "assets" / "character-needs"
    student_master = PROD_ASSETS / "student-mascot.png"
    if student_master.exists():
        im = Image.open(student_master)
        im.save(needs_dir / "student-mascot.png", "PNG")
        im.save(needs_dir / "student-mascot.webp", "WEBP", quality=86, method=6)
        print("OK synced student -> character-needs/")


if __name__ == "__main__":
    main()
