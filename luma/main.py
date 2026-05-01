#!/usr/bin/env python3
from __future__ import annotations
import argparse
import sys

from config import MISSING, LUMA_CALENDAR_ID, NOTION_LUMA_DATABASE_ID
import notion_io
from sources import luma


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Luma event RSVPs into Notion. Additive: only creates rows for events not yet in the database."
    )
    parser.add_argument(
        "--calendar-id",
        default=LUMA_CALENDAR_ID,
        help="Luma calendar API ID (defaults to LUMA_CALENDAR_ID env var)",
    )
    parser.add_argument(
        "--notion-db",
        default=NOTION_LUMA_DATABASE_ID,
        help="Notion database ID (defaults to NOTION_LUMA_EVENTS_DATABASE env var)",
    )
    parser.add_argument("--limit", type=int, help="Process only first N new events (for testing)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch data but do not write to Notion")
    args = parser.parse_args()

    if MISSING:
        print(f"WARNING: Missing config: {', '.join(MISSING)}")

    if not args.calendar_id:
        print("Provide --calendar-id or set LUMA_CALENDAR_ID in .env.local")
        sys.exit(1)
    if not args.notion_db:
        print("Provide --notion-db or set NOTION_LUMA_EVENTS_DATABASE in .env.local")
        sys.exit(1)

    print(f"Reading existing events from Notion {args.notion_db}...")
    existing_urls = notion_io.fetch_existing_event_urls(args.notion_db)
    print(f"Found {len(existing_urls)} already-scraped event(s).\n")

    print(f"Fetching events from Luma calendar {args.calendar_id}...")
    all_events = luma.list_calendar_events(args.calendar_id)
    print(f"Found {len(all_events)} total event(s) on Luma.\n")

    new_events = [e for e in all_events if e.get("url") not in existing_urls]
    print(f"{len(new_events)} new event(s) to scrape.")

    if args.limit:
        new_events = new_events[: args.limit]

    added = 0
    for i, event in enumerate(new_events):
        name = event.get("name", "?")
        event_id = event.get("api_id", "")
        print(f"[{i+1}/{len(new_events)}] {name} ({event_id})", end=" ... ", flush=True)
        try:
            rsvp_count = luma.get_rsvp_count(event_id)
        except Exception as e:
            print(f"ERROR: {e}")
            continue
        print(f"{rsvp_count} RSVPs", end="")
        if not args.dry_run:
            notion_io.create_event_row(args.notion_db, event, rsvp_count)
            added += 1
            print(" → added")
        else:
            print(" [dry-run]")

    print(f"\nDone. {added} new row(s) added to Notion.")


if __name__ == "__main__":
    main()
