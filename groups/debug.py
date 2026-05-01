#!/usr/bin/env python3
"""Smoke-test each group source against one known URL.

Free sources cost nothing; Apify-backed ones (facebook, twitter, instagram)
incur cost — pass --platforms to limit which run.

Examples:
  python3 debug.py --platforms reddit,discord,telegram   # free only
  python3 debug.py --platforms facebook --facebook https://...
"""
from __future__ import annotations
import argparse
import json
import sys

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

DEFAULTS = {
    "reddit": "https://www.reddit.com/r/Notion/",
    "discord": "https://discord.gg/notion",
    "telegram": "https://t.me/notion_so",
    "meetup": "https://www.meetup.com/Notion-France/",
    "connpass": "https://notion.connpass.com/",
    "peatix": "https://peatix.com/group/10029431",
    "clubhouse": "https://www.clubhouse.com/club/notion",
    "facebook": "https://www.facebook.com/groups/notionhacksandsystems/",
    "twitter": "https://twitter.com/NotionHQ",
    "instagram": "https://www.instagram.com/notionhq/",
}

FREE = {"reddit", "discord", "telegram", "meetup", "connpass", "peatix", "clubhouse"}

MODULES = {
    "facebook": facebook,
    "reddit": reddit,
    "discord": discord,
    "telegram": telegram,
    "meetup": meetup,
    "connpass": connpass,
    "peatix": peatix,
    "clubhouse": clubhouse,
    "twitter": twitter,
    "instagram": instagram,
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--platforms",
        default=",".join(FREE),
        help=f"Platforms to test. Default: free only.",
    )
    for p in DEFAULTS:
        parser.add_argument(f"--{p}", default=DEFAULTS[p], help=f"Override {p} test URL")
    args = parser.parse_args()

    platforms = [p.strip() for p in args.platforms.split(",") if p.strip() in MODULES]
    if not platforms:
        print(f"No valid platforms. Choose from: {','.join(MODULES)}")
        sys.exit(1)

    overrides = {p: getattr(args, p) for p in DEFAULTS}

    for platform in platforms:
        url = overrides[platform]
        print(f"\n=== {platform} ===")
        print(f"URL: {url}")
        try:
            count = MODULES[platform].get_count(url)
        except Exception as e:
            print(f"ERROR: {e}")
            continue
        print(f"→ count: {count}")


if __name__ == "__main__":
    main()
