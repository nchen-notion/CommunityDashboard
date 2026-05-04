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
SNAPSHOTS_DB = os.getenv("NOTION_SNAPSHOTS_DATABASE_ID", "")

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


def build_notion_properties(snap: dict, month_key: str) -> dict:
    a = snap["ambassadors"]
    cl = snap["campus_leaders"]
    g = snap["groups"]
    total = a["total"] + cl["total"] + g["total"]
    return {
        "Month": {"title": [{"text": {"content": month_key}}]},
        "Generated At": {"date": {"start": snap["generated_at"]}},
        "Total Reach": {"number": total},
        "Ambassador Members": {"number": a["rows"]},
        "Ambassador Reach": {"number": a["total"]},
        "Ambassador YouTube": {"number": a["platforms"].get("YouTube", 0)},
        "Ambassador Instagram": {"number": a["platforms"].get("Instagram", 0)},
        "Ambassador TikTok": {"number": a["platforms"].get("TikTok", 0)},
        "Ambassador Twitter": {"number": a["platforms"].get("Twitter", 0)},
        "Ambassador LinkedIn": {"number": a["platforms"].get("LinkedIn", 0)},
        "Ambassador Notion Templates": {"number": a["platforms"].get("Notion templates", 0)},
        "Campus Leaders Members": {"number": cl["rows"]},
        "Campus Leaders Reach": {"number": cl["total"]},
        "Campus Leaders LinkedIn": {"number": cl["platforms"].get("LinkedIn", 0)},
        "Groups Count": {"number": g["rows"]},
        "Groups Reach": {"number": g["total"]},
        "Groups Facebook": {"number": g["platforms"].get("Facebook", 0)},
        "Groups Meetup": {"number": g["platforms"].get("Meetup", 0)},
        "Groups Peatix": {"number": g["platforms"].get("Peatix", 0)},
        "Groups Circle": {"number": g["platforms"].get("Circle", 0)},
        "Groups LinkedIn": {"number": g["platforms"].get("LinkedIn", 0)},
        "Groups Twitter": {"number": g["platforms"].get("Twitter", 0)},
        "Groups Reddit": {"number": g["platforms"].get("Reddit", 0)},
        "Groups Discord": {"number": g["platforms"].get("Discord", 0)},
        "Groups Connpass": {"number": g["platforms"].get("Connpass", 0)},
        "Groups Slack": {"number": g["platforms"].get("Slack", 0)},
        "Groups Clubhouse": {"number": g["platforms"].get("Clubhouse", 0)},
        "Groups Telegram": {"number": g["platforms"].get("Telegram", 0)},
        "Groups Instagram": {"number": g["platforms"].get("Instagram", 0)},
        "Groups Website": {"number": g["platforms"].get("Website", 0)},
    }


def upsert_notion_snapshot(snap: dict, month_key: str):
    if not SNAPSHOTS_DB:
        print("  NOTION_SNAPSHOTS_DATABASE_ID not set — skipping Notion write")
        return

    # Check for existing row with same month
    r = requests.post(
        f"https://api.notion.com/v1/databases/{SNAPSHOTS_DB}/query",
        headers=HEADERS,
        json={"filter": {"property": "Month", "title": {"equals": month_key}}},
    )
    r.raise_for_status()
    results = r.json().get("results", [])
    props = build_notion_properties(snap, month_key)

    if results:
        page_id = results[0]["id"]
        r = requests.patch(
            f"https://api.notion.com/v1/pages/{page_id}",
            headers=HEADERS,
            json={"properties": props},
        )
        r.raise_for_status()
        print(f"  Updated Notion snapshot row for {month_key}")
    else:
        r = requests.post(
            "https://api.notion.com/v1/pages",
            headers=HEADERS,
            json={"parent": {"database_id": SNAPSHOTS_DB}, "properties": props},
        )
        r.raise_for_status()
        print(f"  Created Notion snapshot row for {month_key}")


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

    month_key = datetime.now(timezone.utc).strftime("%Y-%m")

    data_dir = Path(__file__).resolve().parent.parent / "public" / "data"
    archive_dir = data_dir / "snapshots"
    archive_dir.mkdir(parents=True, exist_ok=True)

    payload = json.dumps(snap, indent=2)
    latest = data_dir / "snapshot.json"
    latest.write_text(payload)

    archived = archive_dir / f"{month_key}.json"
    archived.write_text(payload)
    print(f"Wrote {latest}")
    print(f"Wrote {archived}")

    upsert_notion_snapshot(snap, month_key)

    print(f"  Ambassadors:    {snap['ambassadors']['total']:>12,} across {snap['ambassadors']['rows']} rows")
    print(f"  Campus Leaders: {snap['campus_leaders']['total']:>12,} across {snap['campus_leaders']['rows']} rows")
    print(f"  Groups:         {snap['groups']['total']:>12,} across {snap['groups']['rows']} rows")


if __name__ == "__main__":
    main()
