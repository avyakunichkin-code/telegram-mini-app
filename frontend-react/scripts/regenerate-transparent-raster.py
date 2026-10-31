#!/usr/bin/env python3
"""Убирает запечённый светло-серый фон (шахматка экспорта) → RGBA + WebP."""
from __future__ import annotations

from collections import deque
import subprocess
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
ASSETS = REPO / "design/system/assets"

LEGACY = REPO / "design/archive/classic-v3/assets"

RASTER_TARGETS = [
    LEGACY / "Monetka/monetka-mascot.png",
    ASSETS / "Monetka/monetka-sit-edge.png",
    LEGACY / "Needs/student-mascot.png",
    ASSETS / "Logos/logo-compact.png",
    ASSETS / "Logos/logo-full.png",
]


def is_background_rgb(r: int, g: int, b: int) -> bool:
    """Светло-серые тона шахматки (~244 / ~254) и белый."""
    if min(r, g, b) < 218:
        return False
    if max(r, g, b) - min(r, g, b) > 14:
        return False
    return True


def flood_transparent(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    bg = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0 or is_background_rgb(r, g, b):
                bg[y][x] = True

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and bg[y][x] and not visited[y][x]:
            visited[y][x] = True
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and bg[ny][nx] and not visited[ny][nx]:
                visited[ny][nx] = True
                q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)

    return rgba


def is_checkerboard_gray(r: int, g: int, b: int) -> bool:
    """Нейтральная сетка экспорта в «дырках» букв (244/254), без чистого белого tagline."""
    if max(r, g, b) >= 255:
        return False
    if min(r, g, b) < 220:
        return False
    return max(r, g, b) - min(r, g, b) <= 8


def remove_enclosed_checkerboard(im: Image.Image) -> Image.Image:
    """Убирает шахматку внутри контуров (О, Д), не трогая белый tagline."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if is_checkerboard_gray(r, g, b):
                px[x, y] = (r, g, b, 0)
    return rgba


def defringe_gray_halo(im: Image.Image) -> Image.Image:
    """Снимает серую кайму у pose с уже частичной прозрачностью."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0 or not is_background_rgb(r, g, b):
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                    px[x, y] = (r, g, b, 0)
                    break
    return rgba


LOGO_NAMES = {"logo-compact.png", "logo-full.png"}


def process_png(path: Path) -> None:
    im = Image.open(path)
    out = flood_transparent(im)
    if path.name in LOGO_NAMES:
        out = remove_enclosed_checkerboard(out)
    out = defringe_gray_halo(out)
    out.save(path, "PNG")
    webp = path.with_suffix(".webp")
    out.save(webp, "WEBP", quality=86, method=6, lossless=False)
    transparent = sum(1 for _, _, _, a in out.getdata() if a < 16)
    print(f"OK {path.name}: transparent {transparent}/{out.width * out.height}")


def main() -> None:
    for path in RASTER_TARGETS:
        if not path.exists():
            print(f"skip missing {path}")
            continue
        process_png(path)
    subprocess.run(["node", str(REPO / "scripts/design-assets.mjs")], check=True)


if __name__ == "__main__":
    main()
