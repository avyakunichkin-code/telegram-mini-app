#!/usr/bin/env python3
"""
run-finale: cup mascots без фона и без лишних прозрачных полей.

Пайплайн как persona-portraits: flood → defringe → trim → normalize → resize → trim снова.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

_SCRIPT = Path(__file__).resolve().parent
_FE = _SCRIPT.parents[1] / "frontend-react" / "scripts" / "process-persona-portraits.py"
_spec = importlib.util.spec_from_file_location("ppp", _FE)
ppp = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(ppp)

ASSETS = _SCRIPT / "assets"
SRC = ASSETS / "source"
PERSONAS = ("student", "professional", "manager", "entrepreneur")
DASH_HEIGHT = 108
TRIM_AFTER_RESIZE_PAD = 2


def process_cup_dash(src: Path) -> Path:
    base = ppp.process_source(src)
    sized = ppp.resize_height(base, DASH_HEIGHT)
    tight = ppp.trim_transparent(sized, pad=TRIM_AFTER_RESIZE_PAD)
    return tight


def main() -> None:
    SRC.mkdir(parents=True, exist_ok=True)
    for persona in PERSONAS:
        src = SRC / f"{persona}-mascot-cup-source.png"
        if not src.exists():
            print(f"skip (no source): {src.name}")
            continue
        im = process_cup_dash(src)
        png = ASSETS / f"{persona}-mascot-cup-dash.png"
        webp = png.with_suffix(".webp")
        im.save(png, "PNG")
        im.save(webp, "WEBP", quality=86, method=6)
        print(f"ok {png.name} {im.size[0]}x{im.size[1]} alpha-trim")


if __name__ == "__main__":
    main()
