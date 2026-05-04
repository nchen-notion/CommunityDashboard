from __future__ import annotations
import re
from . import _apify
from config import APIFY_ACTOR_LINKEDIN


def get_count(url: str) -> int | None:
    username = _extract_username(url)
    if not username:
        return None
    items = _apify.run_actor(
        APIFY_ACTOR_LINKEDIN,
        {"username": username},
        timeout=120,
    )
    if not items:
        return None
    return (items[0].get("basic_info") or {}).get("follower_count")


def _extract_username(url: str) -> str | None:
    m = re.search(r"linkedin\.com/in/([^/?#]+)", url or "", re.IGNORECASE)
    return m.group(1) if m else None
