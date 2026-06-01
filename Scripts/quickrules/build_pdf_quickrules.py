#!/usr/bin/env python3
"""Build a zoomable quick-rules image from the pages of an official
Warhammer Spearhead PDF.

Renders every page at the given DPI and combines them into a single JPEG,
either stacked vertically (--layout append) or laid out in a 2-column grid
(--layout grid, the default: pages 1-2 on top, 3-4 below).

Requires: poppler (pdftoppm) and ImageMagick (magick), both via Homebrew.

Usage:
    build_pdf_quickrules.py <pdf-url-or-path> <output.jpg> [--dpi 300] [--quality 82] [--layout grid|append]
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True, text=True)


def fetch_pdf(src: str, dest: Path) -> None:
    if src.startswith(("http://", "https://")):
        run(["curl", "--fail", "--silent", "--show-error", "--location",
             "--max-time", "120", src, "-o", str(dest)])
    else:
        dest.write_bytes(Path(src).read_bytes())


def build(src: str, output: Path, dpi: int, quality: int, layout: str,
          pages: str | None = None) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        pdf = tmpdir / "in.pdf"
        fetch_pdf(src, pdf)

        page_range: list[str] = []
        if pages:
            first, _, last = pages.partition("-")
            page_range = ["-f", first, "-l", last or first]
        run(["pdftoppm", "-png", "-r", str(dpi), *page_range,
             str(pdf), str(tmpdir / "page")])
        pages = sorted(tmpdir.glob("page-*.png"))
        if not pages:
            sys.exit(f"No pages rendered from {src}")

        output.parent.mkdir(parents=True, exist_ok=True)
        page_args = [str(p) for p in pages]
        if layout == "grid":
            # 2 columns: pages 1-2 on top, 3-4 below, etc. No gaps.
            cmd = ["magick", "montage", *page_args, "-tile", "2x",
                   "-geometry", "+0+0", "-background", "white",
                   "-quality", str(quality), str(output)]
        else:
            cmd = ["magick", *page_args, "-append",
                   "-quality", str(quality), str(output)]
        run(cmd)
        print(f"Wrote {output} ({len(pages)} pages, {dpi} DPI, {layout}) "
              f"{output.stat().st_size // 1024} KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("src", help="PDF URL or local path")
    parser.add_argument("output", type=Path, help="Output JPEG path")
    parser.add_argument("--dpi", type=int, default=300)
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--layout", choices=["grid", "append"], default="grid")
    parser.add_argument("--pages", help="page range, e.g. '1-4' (default: all)")
    args = parser.parse_args()
    build(args.src, args.output, args.dpi, args.quality, args.layout, args.pages)


if __name__ == "__main__":
    main()
