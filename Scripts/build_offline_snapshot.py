#!/usr/bin/env python3

from __future__ import annotations

import html
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


SHEET_ID = "12yiSFPhptA95R7Gihxq3g5HMJvjdwm9AsSHO2RxXKBo"
GVIZ_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&gid=0"
HTML_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?gid=0#gid=0"

ROOT = Path(__file__).resolve().parents[1]
OFFLINE_DATA = ROOT / "WarhammerQuickRules" / "OfflineData"
THUMBNAILS = OFFLINE_DATA / "ArmyThumbnails"
QUICK_RULES = OFFLINE_DATA / "QuickRules"
SNAPSHOT = OFFLINE_DATA / "armies.json"

THUMBNAIL_WIDTH = 1200


@dataclass
class ArmyRow:
    faction: str
    spearhead_name: str
    grand_alliance: str
    model_count: int | None
    points_value: int | None
    released: bool
    in_print: bool
    owned: bool
    details: str
    quick_rules_file_name: str | None

    @property
    def key(self) -> str:
        return f"{self.faction}::{self.spearhead_name}"


def main() -> None:
    OFFLINE_DATA.mkdir(parents=True, exist_ok=True)
    THUMBNAILS.mkdir(parents=True, exist_ok=True)
    QUICK_RULES.mkdir(parents=True, exist_ok=True)
    clear_directory(THUMBNAILS)
    clear_directory(QUICK_RULES)

    gviz_payload = fetch_text(GVIZ_URL)
    html_payload = fetch_text(HTML_URL)

    armies = parse_gviz_rows(gviz_payload)
    thumbnail_urls = parse_thumbnail_urls(html_payload)
    pdf_urls = parse_pdf_urls(html_payload)
    drive_urls = parse_quick_rules_drive_urls(html_payload)

    records = []
    for army in armies:
        print(f"Processing {army.faction} :: {army.spearhead_name}", flush=True)
        thumbnail_url = thumbnail_urls.get(army.key)
        thumbnail_name = None
        if thumbnail_url:
            thumbnail_name = f"{slugify(army.key)}.jpg"
            if not download_file(expand_thumbnail_url(thumbnail_url), THUMBNAILS / thumbnail_name):
                thumbnail_name = None

        quick_rules_name = None
        if army.quick_rules_file_name:
            drive_url = drive_urls.get(normalize_filename(army.quick_rules_file_name))
            if drive_url:
                drive_id = extract_drive_id(drive_url)
                quick_rules_name = f"{drive_id}.png"
                direct_url = f"https://drive.google.com/uc?export=download&id={drive_id}"
                if not download_file(direct_url, QUICK_RULES / quick_rules_name):
                    quick_rules_name = None

        records.append(
            {
                "faction": army.faction,
                "spearheadName": army.spearhead_name,
                "grandAlliance": army.grand_alliance,
                "modelCount": army.model_count,
                "pointsValue": army.points_value,
                "released": army.released,
                "inPrint": army.in_print,
                "owned": army.owned,
                "details": army.details,
                "quickRulesFileName": army.quick_rules_file_name,
                "thumbnailImageName": thumbnail_name,
                "quickRulesImageName": quick_rules_name,
                "officialPDFURL": pdf_urls.get(normalize_filename(army.spearhead_name)),
                "imageURL": None,
            }
        )

    SNAPSHOT.write_text(
        json.dumps(records, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(records)} armies to {SNAPSHOT}")
    print(f"Thumbnails: {len(list(THUMBNAILS.glob('*')))}")
    print(f"Quick rules: {len(list(QUICK_RULES.glob('*')))}")


def clear_directory(path: Path) -> None:
    for child in path.iterdir():
        if child.is_file():
            child.unlink()


def fetch_text(url: str) -> str:
    result = subprocess.run(
        ["curl", "-L", url],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def download_file(url: str, destination: Path) -> bool:
    result = subprocess.run(
        [
            "curl",
            "--fail",
            "--silent",
            "--show-error",
            "--location",
            "--max-time",
            "45",
            url,
            "-o",
            str(destination),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        return True

    if destination.exists():
        destination.unlink()
    print(f"Download failed: {url}\n{result.stderr.strip()}", flush=True)
    return False


def parse_gviz_rows(payload: str) -> list[ArmyRow]:
    prefix = "google.visualization.Query.setResponse("
    start = payload.find(prefix)
    end = payload.rfind(");")
    if start == -1 or end == -1:
        raise RuntimeError("Unexpected GViz response format")

    parsed = json.loads(payload[start + len(prefix):end])
    rows = parsed["table"]["rows"]

    armies: list[ArmyRow] = []
    for row in rows:
        cells = row["c"]
        armies.append(
            ArmyRow(
                faction=value_at(cells, 1) or "",
                spearhead_name=value_at(cells, 2) or "",
                grand_alliance=value_at(cells, 3) or "",
                model_count=number_at(cells, 4),
                points_value=number_at(cells, 5),
                released=bool(value_at(cells, 6) or False),
                in_print=bool(value_at(cells, 7) or False),
                owned=bool(value_at(cells, 8) or False),
                details=(value_at(cells, 9) or "").strip(),
                quick_rules_file_name=value_at(cells, 10),
            )
        )

    return armies


def parse_thumbnail_urls(html_payload: str) -> dict[str, str]:
    table_match = re.search(r'<table class="waffle".*?</table>', html_payload, flags=re.DOTALL)
    if not table_match:
        raise RuntimeError("Could not find waffle table in HTML")

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_match.group(0), flags=re.DOTALL)
    thumbnail_urls: dict[str, str] = {}

    for row_html in rows[2:]:
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row_html, flags=re.DOTALL)
        if len(cells) < 5:
            continue

        faction = clean_html(cells[2])
        spearhead_name = clean_html(cells[3])
        if not faction or not spearhead_name:
            continue

        image_match = re.search(r'src="([^"]+)"', cells[1])
        if not image_match:
            continue

        thumbnail_urls[f"{faction}::{spearhead_name}"] = html.unescape(image_match.group(1))

    return thumbnail_urls


def parse_quick_rules_drive_urls(html_payload: str) -> dict[str, str]:
    filenames = {
        normalize_filename(html.unescape(match))
        for match in re.findall(
            r'\\"3\\":\[2,\\"([^\\"]+\.(?:png|jpg|jpeg))\\"\]',
            html_payload,
            flags=re.IGNORECASE,
        )
    }

    mapping: dict[str, str] = {}
    for filename in filenames:
        index = html_payload.rfind(filename)
        if index == -1:
            continue

        window = html_payload[index:index + 3000]
        url_match = re.search(
            r'https://drive\.google\.com/file/d/[^" ]+',
            window,
        )
        if not url_match:
            continue

        mapping[filename] = url_match.group(0).replace("\\u003d", "=").replace("\\=", "=")

    return mapping


def parse_pdf_urls(html_payload: str) -> dict[str, str]:
    pattern = re.compile(
        r'\\\"2\\\":131075,\\\"3\\\":\[2,\\\"([^\\\"]+)\\\"\],\\\"6\\\":6,\\\"24\\\":\\\"(https://[^\\\"]+\.pdf[^\\\"]*)\\\"'
    )
    matches = pattern.findall(html_payload)
    return {
        normalize_filename(spearhead_name): html.unescape(url).replace("&amp;", "&")
        for spearhead_name, url in matches
    }


def clean_html(raw: str) -> str:
    text = re.sub(r"<br ?/?>", "\n", raw, flags=re.IGNORECASE)
    text = re.sub(r"</div>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)

    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def normalize_filename(value: str) -> str:
    return html.unescape(value).replace("’", "'").replace("`", "'").replace("&#39;", "'")


def expand_thumbnail_url(url: str) -> str:
    if "=" not in url:
        return url
    base, _, _ = url.rpartition("=")
    return f"{base}=w{THUMBNAIL_WIDTH}-h{THUMBNAIL_WIDTH}"


def value_at(cells: list[dict | None], index: int):
    if index >= len(cells):
        return None
    cell = cells[index]
    if not cell:
        return None
    return cell.get("v")


def number_at(cells: list[dict | None], index: int) -> int | None:
    value = value_at(cells, index)
    if value is None:
        return None
    return int(value)


def extract_drive_id(url: str) -> str:
    match = re.search(r"/d/([A-Za-z0-9_-]+)", url)
    if not match:
        raise RuntimeError(f"Could not extract Drive id from {url}")
    return match.group(1)


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


if __name__ == "__main__":
    main()
