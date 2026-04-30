from __future__ import annotations
from . import _apify
from config import APIFY_ACTOR_INSTAGRAM


def get_count(url: str) -> int | None:
    username = _extract_username(url)
    if not username:
        return None
    items = _apify.run_actor(APIFY_ACTOR_INSTAGRAM, {"usernames": [username]})
    for item in items:
        for k in ("followersCount", "followers"):
            if item.get(k) is not None:
                return int(item[k])
    return None


def _extract_username(url: str) -> str:
    s = (url or "").strip().rstrip("/")
    if not s:
        return ""
    if "instagram.com/" in s:
        s = s.split("instagram.com/")[1]
    return s.split("/")[0].split("?")[0].lstrip("@")
