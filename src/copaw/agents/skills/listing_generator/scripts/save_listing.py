#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Save a listing to listings.json with atomic write.

Usage:
    python save_listing.py --title "Product Title" --asin "B0XXX" \
        --bullet-points "Feat1|Feat2|Feat3" --description "Desc" \
        --search-terms "kw1,kw2,kw3" --platform amazon --marketplace us

Output: JSON of the saved listing (with generated ID).
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path


def _find_working_dir() -> Path:
    """Locate COPAW_WORKING_DIR, falling back to ~/.copaw."""
    env_dir = os.environ.get("COPAW_WORKING_DIR")
    if env_dir:
        return Path(env_dir).expanduser().resolve()
    return Path.home() / ".copaw"


def _load(path: Path) -> dict:
    """Load listings.json or return empty structure."""
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"version": 1, "listings": []}


def _save(path: Path, data: dict) -> None:
    """Atomic write: tmp file + shutil.move."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    shutil.move(str(tmp), str(path))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Save a listing to listings.json",
    )
    parser.add_argument("--title", required=True, help="Listing title")
    parser.add_argument("--asin", default="", help="ASIN")
    parser.add_argument(
        "--bullet-points",
        default="",
        help="Pipe-separated bullet points",
    )
    parser.add_argument("--description", default="", help="Description")
    parser.add_argument(
        "--search-terms",
        default="",
        help="Comma-separated search terms",
    )
    parser.add_argument("--price", default="", help="Price string")
    parser.add_argument("--image-url", default="", help="Main image URL")
    parser.add_argument("--platform", default="amazon", help="Platform")
    parser.add_argument(
        "--marketplace",
        default="us",
        help="Marketplace",
    )
    args = parser.parse_args()

    now = datetime.now(timezone.utc).isoformat()

    listing = {
        "id": uuid.uuid4().hex,
        "asin": args.asin,
        "title": args.title,
        "bullet_points": (
            [b.strip() for b in args.bullet_points.split("|") if b.strip()]
            if args.bullet_points
            else []
        ),
        "description": args.description,
        "search_terms": (
            [t.strip() for t in args.search_terms.split(",") if t.strip()]
            if args.search_terms
            else []
        ),
        "price": args.price,
        "image_url": args.image_url,
        "platform": args.platform,
        "marketplace": args.marketplace,
        "status": "generated",
        "source_url": "",
        "created_at": now,
        "updated_at": now,
    }

    path = _find_working_dir() / "listings.json"
    data = _load(path)
    data["listings"].append(listing)
    _save(path, data)

    # Output the saved listing as JSON for Agent to parse
    print(json.dumps(listing, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
