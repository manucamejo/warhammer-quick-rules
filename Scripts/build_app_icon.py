#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
APPICON = ROOT / "WarhammerQuickRules" / "Assets.xcassets" / "AppIcon.appiconset"

SOURCE = Path("/Users/manuelcamejo/.claude/image-cache/9bafd16d-ea26-4cfe-9f08-d68ce8d0d8e7/2.png")
BACKGROUND = (228, 233, 224, 255)  # light photo-gray sampled from source corners
PADDING_RATIO = 0.04  # inset so the figure doesn't touch the edges

SIZES = [
    ("20x20@1x.png", 20),
    ("20x20@2x.png", 40),
    ("20x20@3x.png", 60),
    ("29x29@1x.png", 29),
    ("29x29@2x.png", 58),
    ("29x29@3x.png", 87),
    ("40x40@1x.png", 40),
    ("40x40@2x.png", 80),
    ("40x40@3x.png", 120),
    ("60x60@2x.png", 120),
    ("60x60@3x.png", 180),
    ("76x76@1x.png", 76),
    ("76x76@2x.png", 152),
    ("83.5x83.5@2x.png", 167),
    ("app-icon-1024.png", 1024),
]


def build_master() -> Image.Image:
    src = Image.open(SOURCE).convert("RGBA")
    side = max(src.size)
    inset = int(side * PADDING_RATIO)
    canvas_side = side + inset * 2

    canvas = Image.new("RGBA", (canvas_side, canvas_side), BACKGROUND)
    x = (canvas_side - src.width) // 2
    y = (canvas_side - src.height) // 2
    canvas.alpha_composite(src, dest=(x, y))

    return canvas.convert("RGB")


def main() -> None:
    master = build_master()
    master_1024 = master.resize((1024, 1024), Image.LANCZOS)

    for filename, size in SIZES:
        out = master_1024.resize((size, size), Image.LANCZOS)
        out.save(APPICON / filename, "PNG", optimize=True)
        print(f"wrote {filename} ({size}x{size})")


if __name__ == "__main__":
    main()
