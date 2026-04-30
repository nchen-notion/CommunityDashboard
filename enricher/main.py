#!/usr/bin/env python3
from __future__ import annotations
import argparse
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import MISSING, NOTION_DATABASE_ID
import notion_io
from sources import youtube, instagram, tiktok, twitter, notion_templates

PLATFORMS = {
    "youtube": youtube,
    "instagram": instagram,
    "tiktok": tiktok,
    "twitter": twitter,
    "notion_templates": notion_templates,
}


def fetch_counts(person: dict, platforms: list[str]) -> dict[str, int | None]:
    counts: dict[str, int | None] = {}
    for platform in platforms:
        url = person.get(f"{platform}_url", "")
        if not url:
            continue
        try:
            counts[platform] = PLATFORMS[platform].get_count(url)
        except Exception as e:
            print(f"  [{platform}] error: {e}")
            counts[platform] = None
    return counts


def main():
    parser = argparse.ArgumentParser(description="Scrape follower/subscriber counts from URLs in Notion.")
    parser.add_argument(
        "--notion-input",
        metavar="DATABASE_ID",
        default=NOTION_DATABASE_ID,
        help="Notion database ID (defaults to NOTION_DATABASE_ID env var)",
    )
    parser.add_argument(
        "--platforms",
        default=",".join(PLATFORMS.keys()),
        help=f"Platforms to run (default: all). Options: {', '.join(PLATFORMS)}",
    )
    parser.add_argument("--workers", type=int, default=4, help="Concurrent workers (default: 4)")
    parser.add_argument(
        "--skip-if-filled",
        action="store_true",
        help="Skip a platform on a row if its count field is already populated",
    )
    parser.add_argument("--limit", type=int, help="Process only first N rows (for testing)")
    args = parser.parse_args()

    if MISSING:
        print(f"WARNING: Missing API keys: {', '.join(MISSING)}")

    if not args.notion_input:
        print("Provide --notion-input DATABASE_ID or set NOTION_DATABASE_ID in .env.local")
        sys.exit(1)

    platforms = [p.strip() for p in args.platforms.split(",") if p.strip() in PLATFORMS]
    if not platforms:
        print(f"No valid platforms. Choose from: {', '.join(PLATFORMS)}")
        sys.exit(1)

    print(f"Reading from Notion database {args.notion_input}...")
    people = notion_io.fetch_people(args.notion_input)
    print(f"Found {len(people)} people.\n")

    if args.limit:
        people = people[: args.limit]

    print_lock = threading.Lock()

    def process(i: int, person: dict):
        name = person.get("name", "?")
        active = [p for p in platforms if person.get(f"{p}_url")]
        if args.skip_if_filled:
            active = [p for p in active if person.get(f"{p}_count") is None]
        if not active:
            with print_lock:
                print(f"[{i+1}/{len(people)}] {name} — nothing to do")
            return

        counts = fetch_counts(person, active)
        if person.get("page_id") and counts:
            notion_io.update_page(person["page_id"], counts)
        with print_lock:
            summary = ", ".join(f"{p}={counts.get(p)}" for p in active)
            print(f"[{i+1}/{len(people)}] {name} → {summary}")

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(process, i, p) for i, p in enumerate(people)]
        for f in as_completed(futures):
            f.result()

    print(f"\nDone. {len(people)} rows processed.")


if __name__ == "__main__":
    main()
