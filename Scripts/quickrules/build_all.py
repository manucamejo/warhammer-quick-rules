#!/usr/bin/env python3
"""Regenerate quick-rules images for every army that has an official PDF.

For each army in web/public/data/armies.json with an `officialPDFURL`, render
its Spearhead PDF into a 2x2 grid JPEG (Scripts/quickrules/build_pdf_quickrules),
write it to QuickRules/<thumbnail-slug>.jpg, update `quickRulesImageName`, and
finally remove any orphaned image files left behind.

Usage: build_all.py [--workers 5] [--dpi 300] [--quality 82]
"""

from __future__ import annotations

import argparse
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from build_pdf_quickrules import build

ROOT = Path(__file__).resolve().parents[2]
ARMIES_JSON = ROOT / "web" / "public" / "data" / "armies.json"
QUICK_RULES = ROOT / "web" / "public" / "data" / "QuickRules"


def slug_for(army: dict) -> str:
    thumb = army.get("thumbnailImageName")
    if thumb:
        return Path(thumb).stem + ".jpg"
    base = f"{army['faction']}-{army['spearheadName']}".lower()
    return "".join(c if c.isalnum() else "-" for c in base).strip("-") + ".jpg"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=5)
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--quality", type=int, default=82)
    args = ap.parse_args()

    armies = json.loads(ARMIES_JSON.read_text(encoding="utf-8"))
    targets = [(i, a) for i, a in enumerate(armies) if a.get("officialPDFURL")]
    print(f"{len(targets)} armies with a PDF; {len(armies) - len(targets)} without")

    def work(item):
        i, a = item
        name = slug_for(a)
        build(a["officialPDFURL"], QUICK_RULES / name, args.dpi, args.quality, "grid")
        return i, name

    results: dict[int, str] = {}
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(work, t): t for t in targets}
        for fut in as_completed(futures):
            i, a = futures[fut]
            try:
                idx, name = fut.result()
                results[idx] = name
            except Exception as exc:  # noqa: BLE001
                print(f"FAILED {a['faction']} :: {a['spearheadName']}: {exc}")

    keep = set()
    for i, name in results.items():
        armies[i]["quickRulesImageName"] = name
        keep.add(name)
    # preserve images for armies we did not regenerate (e.g. no PDF) that still
    # reference an existing file
    for a in armies:
        if a.get("quickRulesImageName"):
            keep.add(a["quickRulesImageName"])

    ARMIES_JSON.write_text(json.dumps(armies, indent=2, ensure_ascii=False) + "\n",
                           encoding="utf-8")

    removed = 0
    for f in QUICK_RULES.iterdir():
        if f.is_file() and f.name not in keep:
            f.unlink()
            removed += 1

    print(f"\nGenerated {len(results)} images, removed {removed} orphaned files")
    print(f"QuickRules now holds {len(list(QUICK_RULES.glob('*')))} files")


if __name__ == "__main__":
    main()
