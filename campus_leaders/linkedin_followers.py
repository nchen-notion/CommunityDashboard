#!/usr/bin/env python3
"""Scrape LinkedIn follower counts for Campus Leaders via Apify.

Reads rows from the Campus Leaders Notion DB, extracts the LinkedIn
username from each leader's profile URL, calls the Apify actor
`apimaestro/linkedin-profile-detail` (~$0.005/profile, no cookies),
and writes the follower_count back to the `Linkedin Followers` field.

Usage:
  python3 linkedin_followers.py --limit 5
  python3 linkedin_followers.py --workers 4
  python3 linkedin_followers.py --skip-if-filled
  python3 linkedin_followers.py --dry-run
"""
from __future__ import annotations
import argparse
import os
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from dotenv import load_dotenv

_root = Path(__file__).parent.parent
load_dotenv(_root / ".env.local", override=True)

NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
DEFAULT_DB_ID = os.getenv("NOTION_CAMPUS_LEADERS_DATABASE_ID", "")
APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")
ACTOR_SLUG = "apimaestro/linkedin-profile-detail"
FOLLOWER_FIELD = "LinkedIn Followers"

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}


def fetch_rows(db_id: str, url_field: str, limit: int | None) -> list[dict]:
    rows = []
    cursor = None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        r = requests.post(
            f"https://api.notion.com/v1/databases/{db_id}/query",
            headers=NOTION_HEADERS, json=body,
        )
        r.raise_for_status()
        data = r.json()
        for page in data.get("results", []):
            rows.append(_parse(page, url_field))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
        if limit and len(rows) >= limit:
            break
    return rows[:limit] if limit else rows


def _parse(page: dict, url_field: str) -> dict:
    p = page["properties"]

    def title(k):
        return "".join(t.get("plain_text", "") for t in p.get(k, {}).get("title", [])).strip()

    def url(k):
        return p.get(k, {}).get("url")

    def number(k):
        return p.get(k, {}).get("number")

    return {
        "page_id": page["id"],
        "name": title("Name"),
        "linkedin_url": url(url_field) or "",
        "followers": number(FOLLOWER_FIELD),
    }


def extract_username(url: str) -> str | None:
    """Pull the slug from a LinkedIn profile URL."""
    m = re.search(r"linkedin\.com/in/([^/?#]+)", url, re.IGNORECASE)
    return m.group(1) if m else None


def fetch_followers(username: str) -> int | None:
    path = ACTOR_SLUG.replace("/", "~")
    try:
        r = requests.post(
            f"https://api.apify.com/v2/acts/{path}/run-sync-get-dataset-items",
            params={"token": APIFY_TOKEN, "timeout": 120},
            json={"username": username},
            timeout=180,
        )
    except requests.RequestException as e:
        print(f"    apify error for {username}: {e}")
        return None
    if not r.ok:
        print(f"    apify {r.status_code} for {username}: {r.text[:150]}")
        return None
    items = r.json() or []
    if not items:
        return None
    return (items[0].get("basic_info") or {}).get("follower_count")


def update_followers(page_id: str, count: int) -> bool:
    r = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=NOTION_HEADERS,
        json={"properties": {FOLLOWER_FIELD: {"number": int(count)}}},
    )
    if not r.ok:
        print(f"    notion update failed: {r.status_code} {r.text[:200]}")
        return False
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=DEFAULT_DB_ID,
                        help="Notion database ID (defaults to NOTION_CAMPUS_LEADERS_DATABASE_ID env var)")
    parser.add_argument("--url-field", default="LinkedIn profile",
                        help="Notion property name holding the LinkedIn URL (default: 'LinkedIn profile')")
    parser.add_argument("--limit", type=int, default=None, help="Process only first N rows")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--skip-if-filled", action="store_true",
                        help="Skip rows whose LinkedIn Followers is already populated")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to Notion")
    args = parser.parse_args()

    if not (NOTION_TOKEN and args.db and APIFY_TOKEN):
        print("Missing one of: NOTION_TOKEN, --db (or NOTION_CAMPUS_LEADERS_DATABASE_ID), APIFY_TOKEN")
        sys.exit(1)

    rows = fetch_rows(args.db, args.url_field, args.limit)
    print(f"Fetched {len(rows)} rows.\n")

    lock = threading.Lock()
    counts = {"written": 0, "skipped_no_url": 0, "skipped_filled": 0, "no_data": 0}

    def process(i, row):
        prefix = f"[{i+1}/{len(rows)}] {row['name']}"
        username = extract_username(row["linkedin_url"])
        if not username:
            with lock:
                counts["skipped_no_url"] += 1
                print(f"{prefix} — no LinkedIn URL")
            return
        if args.skip_if_filled and row.get("followers") is not None:
            with lock:
                counts["skipped_filled"] += 1
            return

        followers = fetch_followers(username)
        if followers is None:
            with lock:
                counts["no_data"] += 1
                print(f"{prefix} ({username}) → no follower data")
            return

        if not args.dry_run:
            update_followers(row["page_id"], followers)
        with lock:
            counts["written"] += 1
            print(f"{prefix} ({username}) → {followers} followers")

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(process, i, r) for i, r in enumerate(rows)]
        for f in as_completed(futures):
            f.result()

    print()
    print(f"Done. {counts['written']} written, "
          f"{counts['skipped_filled']} already filled, "
          f"{counts['skipped_no_url']} no URL, "
          f"{counts['no_data']} no actor data.")


if __name__ == "__main__":
    main()
