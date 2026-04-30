#!/usr/bin/env python3
"""Smoke-test each source against one known URL.

Free sources (youtube, notion_templates) cost nothing. Apify sources
(instagram, tiktok, twitter) run real actors and incur cost — pass
--platforms to limit which ones run.

Examples:
  python3 debug.py --platforms youtube,notion_templates
  python3 debug.py --platforms instagram --instagram https://...
  python3 debug.py  # runs free sources only by default
"""
from __future__ import annotations
import argparse
import json
import sys

from sources import youtube, instagram, tiktok, twitter, notion_templates
from sources import _apify
from config import (
    APIFY_ACTOR_INSTAGRAM,
    APIFY_ACTOR_TIKTOK,
    APIFY_ACTOR_TWITTER,
)

DEFAULTS = {
    "youtube": "https://www.youtube.com/@By3bdo",
    "notion_templates": "https://www.notion.com/ko/@filbert",
    "instagram": "https://www.instagram.com/produteka/",
    "tiktok": "https://www.tiktok.com/@producingparadise",
    "twitter": "https://x.com/Abdokarmallah",
}

FREE = {"youtube", "notion_templates"}


def run_free(platform: str, url: str):
    print(f"\n=== {platform} (free) ===")
    print(f"URL: {url}")
    mod = {"youtube": youtube, "notion_templates": notion_templates}[platform]
    count = mod.get_count(url)
    print(f"→ count: {count}")


def run_apify_raw(platform: str, url: str):
    """Print raw Apify items + parsed count so we can verify output shape."""
    print(f"\n=== {platform} (apify) ===")
    print(f"URL: {url}")

    if platform == "instagram":
        username = instagram._extract_username(url)
        print(f"username: {username}")
        items = _apify.run_actor(APIFY_ACTOR_INSTAGRAM, {"usernames": [username]})
        count = instagram.get_count(url)
    elif platform == "tiktok":
        handle = tiktok._extract_handle(url)
        print(f"handle: {handle}")
        items = _apify.run_actor(
            APIFY_ACTOR_TIKTOK,
            {
                "profiles": [handle],
                "resultsPerPage": 1,
                "shouldDownloadVideos": False,
                "shouldDownloadCovers": False,
                "shouldDownloadSubtitles": False,
            },
        )
        count = tiktok.get_count(url)
    elif platform == "twitter":
        handle = twitter._extract_handle(url)
        print(f"handle: {handle}")
        items = _apify.run_actor(
            APIFY_ACTOR_TWITTER,
            {
                "startUrls": [f"https://twitter.com/{handle}"],
                "twitterHandles": [handle],
                "maxItems": 1,
            },
        )
        count = twitter.get_count(url)
    else:
        return

    print(f"\nRaw items ({len(items)}):")
    if items:
        # Print only the first item, truncated if huge
        first = items[0]
        # Show top-level keys + values, truncating long strings
        truncated = _truncate(first)
        print(json.dumps(truncated, indent=2, default=str)[:4000])
        if len(items) > 1:
            print(f"... and {len(items) - 1} more items")
    else:
        print("(no items returned)")
    print(f"\n→ parsed count: {count}")


def _truncate(obj, max_str: int = 200):
    if isinstance(obj, dict):
        return {k: _truncate(v, max_str) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_truncate(v, max_str) for v in obj[:5]]
    if isinstance(obj, str) and len(obj) > max_str:
        return obj[:max_str] + f"... ({len(obj)} chars)"
    return obj


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--platforms",
        default=",".join(FREE),
        help=f"Platforms to test. Default: free only ({','.join(FREE)}). All: {','.join(DEFAULTS)}",
    )
    for p in DEFAULTS:
        parser.add_argument(f"--{p}", default=DEFAULTS[p], help=f"Override {p} test URL")
    args = parser.parse_args()

    platforms = [p.strip() for p in args.platforms.split(",") if p.strip() in DEFAULTS]
    if not platforms:
        print(f"No valid platforms. Choose from: {','.join(DEFAULTS)}")
        sys.exit(1)

    overrides = {p: getattr(args, p) for p in DEFAULTS}

    for platform in platforms:
        url = overrides[platform]
        if platform in FREE:
            run_free(platform, url)
        else:
            run_apify_raw(platform, url)


if __name__ == "__main__":
    main()
