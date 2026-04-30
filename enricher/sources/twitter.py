from __future__ import annotations
from . import _apify
from config import APIFY_ACTOR_TWITTER


def get_count(url: str) -> int | None:
    handle = _extract_handle(url)
    if not handle:
        return None
    items = _apify.run_actor(
        APIFY_ACTOR_TWITTER,
        {
            "startUrls": [f"https://twitter.com/{handle}"],
            "twitterHandles": [handle],
            "maxItems": 1,
        },
    )
    # apidojo/twitter-scraper-lite returns tweets; author info is nested.
    # Try profile-level fields first, then fall back to author/user nesting.
    for item in items:
        for source in (item, item.get("author") or {}, item.get("user") or {}):
            for k in ("followers", "followersCount", "followers_count"):
                if source.get(k) is not None:
                    return int(source[k])
    return None


def _extract_handle(url: str) -> str:
    s = (url or "").strip().rstrip("/")
    if not s:
        return ""
    for d in ("twitter.com/", "x.com/"):
        if d in s:
            s = s.split(d)[1]
            break
    s = s.split("/")[0].split("?")[0]
    return s.lstrip("@")
