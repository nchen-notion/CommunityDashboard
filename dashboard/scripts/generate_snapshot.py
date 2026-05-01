#!/usr/bin/env python3
"""Pull totals from the three Notion DBs and write dashboard/public/data/snapshot.json.

Reads:
  - Ambassador DB (NOTION_DATABASE_ID): per-platform follower number fields
  - Campus Leaders DB (NOTION_CAMPUS_LEADERS_DATABASE_ID): LinkedIn Followers
  - Groups DB (NOTION_GROUPS_DATABASE_ID): Followers (member count) grouped by Platform

Run:
  python3 scripts/generate_snapshot.py
"""
from __future__ import annotations
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

_scraper = Path(__file__).resolve().parent.parent.parent  # dashboard/scripts -> dashboard -> scraper
load_dotenv(_scraper / ".env.local", override=True)
load_dotenv(_scraper / ".env", override=False)

NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
AMBASSADOR_DB = os.getenv("NOTION_DATABASE_ID", "")
CAMPUS_DB = os.getenv("NOTION_CAMPUS_LEADERS_DATABASE_ID", "")
GROUPS_DB = os.getenv("NOTION_GROUPS_DATABASE_ID", "")

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

AMBASSADOR_FIELDS = {
    "YouTube": "Youtube Followers",
    "Instagram": "Instagram Followers",
    "TikTok": "TikTok Followers",
    "Twitter": "Twitter Followers",
    "Notion templates": "Templates Made",
    "LinkedIn": "LinkedIn Followers",
}


def query_db(db_id: str) -> list[dict]:
    rows = []
    cursor = None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        r = requests.post(
            f"https://api.notion.com/v1/databases/{db_id}/query",
            headers=HEADERS, json=body,
        )
        r.raise_for_status()
        data = r.json()
        rows.extend(data.get("results", []))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return rows


def number(page: dict, field: str) -> int | None:
    p = page["properties"].get(field, {})
    return p.get("number")


def select(page: dict, field: str) -> str:
    sel = page["properties"].get(field, {}).get("select")
    return (sel or {}).get("name", "") or ""


def ambassador_snapshot() -> dict:
    pages = query_db(AMBASSADOR_DB)
    platforms: dict[str, int] = {}
    for label, field in AMBASSADOR_FIELDS.items():
        platforms[label] = sum(int(number(p, field) or 0) for p in pages)
    return {
        "rows": len(pages),
        "total": sum(platforms.values()),
        "platforms": platforms,
    }


def campus_snapshot() -> dict:
    pages = query_db(CAMPUS_DB)
    total = sum(int(number(p, "LinkedIn Followers") or 0) for p in pages)
    return {
        "rows": len(pages),
        "total": total,
        "platforms": {"LinkedIn": total},
    }


def groups_snapshot() -> dict:
    pages = query_db(GROUPS_DB)
    platforms: dict[str, int] = {}
    for p in pages:
        plat = select(p, "Platform") or "Other"
        n = int(number(p, "Followers") or 0)
        platforms[plat] = platforms.get(plat, 0) + n
    return {
        "rows": len(pages),
        "total": sum(platforms.values()),
        "platforms": platforms,
    }


def main():
    missing = [k for k, v in {
        "NOTION_TOKEN": NOTION_TOKEN,
        "NOTION_DATABASE_ID": AMBASSADOR_DB,
        "NOTION_CAMPUS_LEADERS_DATABASE_ID": CAMPUS_DB,
        "NOTION_GROUPS_DATABASE_ID": GROUPS_DB,
    }.items() if not v]
    if missing:
        print(f"Missing env: {', '.join(missing)}")
        sys.exit(1)

    snap = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ambassadors": ambassador_snapshot(),
        "campus_leaders": campus_snapshot(),
        "groups": groups_snapshot(),
    }

    out = Path(__file__).resolve().parent.parent / "public" / "data" / "snapshot.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snap, indent=2))
    print(f"Wrote {out}")
    print(f"  Ambassadors:    {snap['ambassadors']['total']:>12,} across {snap['ambassadors']['rows']} rows")
    print(f"  Campus Leaders: {snap['campus_leaders']['total']:>12,} across {snap['campus_leaders']['rows']} rows")
    print(f"  Groups:         {snap['groups']['total']:>12,} across {snap['groups']['rows']} rows")


if __name__ == "__main__":
    main()
