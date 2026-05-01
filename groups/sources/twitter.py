from __future__ import annotations
import os
from . import _apify

APIFY_ACTOR_TWITTER = os.getenv("APIFY_ACTOR_TWITTER", "apidojo/twitter-scraper-lite")


def get_count(url: str) -> int | None:
    if _is_community_url(url):
        # Twitter Communities (twitter.com/i/communities/...) aren't scrapable
        # via the user-profile actor, and X removed the public communities API.
        return None
    handle = _extract_handle(url)
    if not handle or handle in {"i", "home", "explore", "search"}:
        return None
    items = _apify.run_actor(
        APIFY_ACTOR_TWITTER,
        {
            "startUrls": [f"https://twitter.com/{handle}"],
            "twitterHandles": [handle],
            "maxItems": 1,
        },
    )
    for item in items:
        for source in (item, item.get("author") or {}, item.get("user") or {}):
            for k in ("followers", "followersCount", "followers_count"):
                if source.get(k) is not None:
                    return int(source[k])
    return None


def _is_community_url(url: str) -> bool:
    s = (url or "").lower()
    return "/i/communities/" in s or "/communities/" in s


def _extract_handle(url: str) -> str:
    s = (url or "").strip().rstrip("/")
    if not s:
        return ""
    for d in ("twitter.com/", "x.com/"):
        if d in s:
            s = s.split(d)[1]
            break
    return s.split("/")[0].split("?")[0].lstrip("@")
