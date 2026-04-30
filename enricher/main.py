#!/usr/bin/env python3
from __future__ import annotations
import argparse
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd

from config import MISSING
import verify
import output as out
import notion_io
from sources import youtube, instagram, notion_mp

ALL_PLATFORMS = ["youtube", "instagram", "notion_mp"]

PLATFORM_MODULES = {
    "youtube": youtube,
    "instagram": instagram,
    "notion_mp": notion_mp,
}

PLATFORM_URL_KEY = {
    "youtube": "url",
    "instagram": "url",
    "notion_mp": "url",
}

PLATFORM_OUTPUT_COL = {
    "youtube": "youtube_handle",
    "instagram": "instagram_handle",
    "notion_mp": "notion_marketplace_url",
}

PLATFORM_CONFIDENCE_COL = {
    "youtube": "youtube_confidence",
    "instagram": "instagram_confidence",
    "notion_mp": "notion_confidence",
}


def enrich_person(person: dict, platforms: list[str], do_verify: bool) -> dict:
    row = dict(person)
    all_notes = []
    has_low = False

    for platform in platforms:
        url_col = PLATFORM_OUTPUT_COL[platform]
        conf_col = PLATFORM_CONFIDENCE_COL[platform]

        print(f"  [{platform}] searching...")
        try:
            candidates = PLATFORM_MODULES[platform].search(person)
        except Exception as e:
            print(f"  [{platform}] error: {e}")
            row[url_col] = ""
            row[conf_col] = "none"
            continue

        if not candidates:
            row[url_col] = ""
            row[conf_col] = "none"
            continue

        if do_verify:
            best, confidence, reasoning = verify.score_candidates(person, platform, candidates)
        else:
            best = candidates[0]
            confidence = "medium"
            reasoning = "Unverified (--no-verify mode)"

        if best:
            row[url_col] = best.get(PLATFORM_URL_KEY[platform], "")
            row[conf_col] = confidence
            if platform == "instagram" and best.get("followers"):
                row["instagram_followers"] = best["followers"]
            if reasoning:
                all_notes.append(f"{platform}: {reasoning}")
            if confidence == "low":
                has_low = True
        else:
            row[url_col] = ""
            row[conf_col] = "none"

    row["needs_review"] = has_low
    row["notes"] = " | ".join(all_notes)
    return row


def main():
    parser = argparse.ArgumentParser(description="Enrich a CSV of people with social media handles.")
    parser.add_argument("--input", help="Input CSV path")
    parser.add_argument("--output", help="Output CSV path")
    parser.add_argument("--notion-input", metavar="DATABASE_ID", help="Read from and write back to a Notion database")
    parser.add_argument("--notion", action="store_true", help="Also write results to Notion database (CSV input mode)")
    parser.add_argument(
        "--platforms",
        default=",".join(ALL_PLATFORMS),
        help=f"Comma-separated platforms to run (default: all). Options: {', '.join(ALL_PLATFORMS)}",
    )
    parser.add_argument("--no-verify", action="store_true", help="Skip Claude verification (faster, less accurate)")
    parser.add_argument("--workers", type=int, default=1, help="Number of concurrent workers (default: 1)")
    args = parser.parse_args()

    if MISSING:
        print(f"WARNING: Missing API keys: {', '.join(MISSING)}")
        print("Some platforms may be skipped. Add them to your .env file.")

    platforms = [p.strip() for p in args.platforms.split(",") if p.strip() in PLATFORM_MODULES]
    if not platforms:
        print(f"No valid platforms specified. Choose from: {', '.join(ALL_PLATFORMS)}")
        sys.exit(1)

    # --- load people ---
    if args.notion_input:
        print(f"Reading from Notion database {args.notion_input}...")
        people = notion_io.fetch_people(args.notion_input)
        print(f"Found {len(people)} people.\n")
    elif args.input:
        try:
            df = pd.read_csv(args.input)
        except Exception as e:
            print(f"Failed to read input CSV: {e}")
            sys.exit(1)
        if "name" not in df.columns or "email" not in df.columns:
            print("Input CSV must have 'name' and 'email' columns.")
            sys.exit(1)
        people = df.to_dict(orient="records")
    else:
        print("Provide either --input (CSV) or --notion-input (database ID).")
        sys.exit(1)

    # --- enrich ---
    print_lock = threading.Lock()
    results = [None] * len(people)

    def process(i, person):
        name = person.get("name", "?")
        try:
            row = enrich_person(person, platforms, do_verify=not args.no_verify)
        except Exception as e:
            with print_lock:
                print(f"[{i+1}/{len(people)}] {name} — ERROR: {e}")
            row = dict(person)
            for platform in platforms:
                row[PLATFORM_OUTPUT_COL[platform]] = ""
                row[PLATFORM_CONFIDENCE_COL[platform]] = "none"
            row["needs_review"] = True
            row["notes"] = f"Pipeline error: {e}"

        if args.notion_input and person.get("page_id"):
            notion_io.update_page(person["page_id"], row)

        with print_lock:
            print(f"[{i+1}/{len(people)}] {name} → {row.get('instagram_handle') or row.get('youtube_handle') or 'none'} ({row.get('instagram_confidence') or row.get('youtube_confidence') or 'none'})")

        results[i] = row

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(process, i, person): i for i, person in enumerate(people)}
        for future in as_completed(futures):
            future.result()  # surface exceptions

    # --- output ---
    if args.output:
        out.write_csv(results, args.output)
    if args.notion and not args.notion_input:
        out.write_notion(results)

    needs_review = sum(1 for r in results if r.get("needs_review"))
    print(f"\nDone. {len(people)} people processed. {needs_review} flagged for review.")


if __name__ == "__main__":
    main()
