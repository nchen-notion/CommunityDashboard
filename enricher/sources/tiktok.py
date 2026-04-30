from __future__ import annotations
from . import _apify
from config import APIFY_ACTOR_TIKTOK


def get_count(url: str) -> int | None:
    handle = _extract_handle(url)
    if not handle:
        return None
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
    for item in items:
        meta = item.get("authorMeta") or {}
        for source in (meta, item):
            for k in ("fans", "followers", "followersCount", "followerCount"):
                if source.get(k) is not None:
                    return int(source[k])
    return None


def _extract_handle(url: str) -> str:
    s = (url or "").strip().rstrip("/")
    if not s:
        return ""
    if "tiktok.com/" in s:
        s = s.split("tiktok.com/")[1]
    s = s.split("/")[0].split("?")[0]
    return s.lstrip("@")
