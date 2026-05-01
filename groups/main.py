#!/usr/bin/env python3
from __future__ import annotations
import argparse
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import MISSING, NOTION_GROUPS_DATABASE_ID
import notion_io
from sources import (
    facebook,
    reddit,
    discord,
    telegram,
    meetup,
    connpass,
    peatix,
    clubhouse,
    twitter,
    instagram,
)

# Maps the Notion "Platform" select value (case-sensitive) to its source module.
DISPATCH = {
    "Facebook": facebook,
    "Reddit": reddit,
    "Discord": discord,
    "Telegram": telegram,
    "Meetup": meetup,
    "Connpass": connpass,
    "Peatix": peatix,
    "Clubhouse": clubhouse,
    "Twitter": twitter,
    "Instagram": instagram,
}

# Platforms we cannot scrape (auth-gated or no member concept). Skipped silently.
# LinkedIn is rejected by Firecrawl (no public scraping path).
SKIP_PLATFORMS = {"LinkedIn", "Slack", "Circle", "Website"}


def main():
    parser = argparse.ArgumentParser(description="Scrape group/community member counts from URLs in Notion.")
    parser.add_argument(
        "--notion-input",
        metavar="DATABASE_ID",
        default=NOTION_GROUPS_DATABASE_ID,
        help="Notion database ID (defaults to NOTION_GROUPS_DATABASE_ID env var)",
    )
    parser.add_argument(
        "--platforms",
        default="",
        help="Comma-separated platforms to run (default: all supported). Options: " + ", ".join(DISPATCH),
    )
    parser.add_argument("--workers", type=int, default=4, help="Concurrent workers (default: 4)")
    parser.add_argument(
        "--skip-if-filled",
        action="store_true",
        help="Skip rows whose Followers field is already populated",
    )
    parser.add_argument("--limit", type=int, help="Process only first N rows (for testing)")
    args = parser.parse_args()

    if MISSING:
        print(f"WARNING: Missing API keys: {', '.join(MISSING)}")
    if not args.notion_input:
        print("Provide --notion-input DATABASE_ID or set NOTION_GROUPS_DATABASE_ID in .env.local")
        sys.exit(1)

    requested = {p.strip() for p in args.platforms.split(",") if p.strip()} if args.platforms else None

    print(f"Reading from Notion database {args.notion_input}...")
    rows = notion_io.fetch_groups(args.notion_input)
    print(f"Found {len(rows)} rows.\n")
    if args.limit:
        rows = rows[: args.limit]

    print_lock = threading.Lock()
    counts = {"processed": 0, "skipped_unsupported": 0, "skipped_filled": 0, "skipped_no_url": 0}

    def process(i: int, row: dict):
        name = row.get("name", "?")
        platform = row.get("platform") or ""
        url = row.get("url") or ""

        if platform in SKIP_PLATFORMS:
            with print_lock:
                counts["skipped_unsupported"] += 1
                print(f"[{i+1}/{len(rows)}] {name} [{platform}] — unsupported, skipping")
            return
        if requested and platform not in requested:
            return
        if not url:
            with print_lock:
                counts["skipped_no_url"] += 1
                print(f"[{i+1}/{len(rows)}] {name} [{platform}] — no URL")
            return
        if args.skip_if_filled and row.get("count") is not None:
            with print_lock:
                counts["skipped_filled"] += 1
            return

        mod = DISPATCH.get(platform)
        if not mod:
            with print_lock:
                print(f"[{i+1}/{len(rows)}] {name} [{platform}] — no scraper, skipping")
            return

        try:
            count = mod.get_count(url)
        except Exception as e:
            with print_lock:
                print(f"[{i+1}/{len(rows)}] {name} [{platform}] — error: {e}")
            return

        if count is not None:
            notion_io.update_count(row["page_id"], count)
        with print_lock:
            counts["processed"] += 1
            print(f"[{i+1}/{len(rows)}] {name} [{platform}] → {count}")

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(process, i, r) for i, r in enumerate(rows)]
        for f in as_completed(futures):
            f.result()

    print(
        f"\nDone. {counts['processed']} processed, "
        f"{counts['skipped_filled']} already filled, "
        f"{counts['skipped_unsupported']} unsupported, "
        f"{counts['skipped_no_url']} missing URL."
    )


if __name__ == "__main__":
    main()
