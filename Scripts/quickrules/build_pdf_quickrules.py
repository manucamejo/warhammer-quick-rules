#!/usr/bin/env python3
"""Build a tall, zoomable quick-rules image by stacking the pages of an
official Warhammer Spearhead PDF.

Renders every page at the given DPI and concatenates them vertically into a
single JPEG. Use this for Spearheads that have an official PDF but no
hand-made quick-rules sheet in the Drive.

Requires: poppler (pdftoppm) and ImageMagick (magick), both via Homebrew.

Usage:
    build_pdf_quickrules.py <pdf-url-or-path> <output.jpg> [--dpi 300] [--quality 82]
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


def build(src: str, output: Path, dpi: int, quality: int) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        pdf = tmpdir / "in.pdf"
        fetch_pdf(src, pdf)

        run(["pdftoppm", "-png", "-r", str(dpi), str(pdf), str(tmpdir / "page")])
        pages = sorted(tmpdir.glob("page-*.png"))
        if not pages:
            sys.exit(f"No pages rendered from {src}")

        output.parent.mkdir(parents=True, exist_ok=True)
        run(["magick", *[str(p) for p in pages], "-append",
             "-quality", str(quality), str(output)])
        print(f"Wrote {output} ({len(pages)} pages, {dpi} DPI) "
              f"{output.stat().st_size // 1024} KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("src", help="PDF URL or local path")
    parser.add_argument("output", type=Path, help="Output JPEG path")
    parser.add_argument("--dpi", type=int, default=300)
    parser.add_argument("--quality", type=int, default=82)
    args = parser.parse_args()
    build(args.src, args.output, args.dpi, args.quality)


if __name__ == "__main__":
    main()
