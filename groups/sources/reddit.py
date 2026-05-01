from __future__ import annotations
import re
from . import _http


def get_count(url: str) -> int | None:
    """Reddit subreddit member count via the public /about.json endpoint."""
    sub = _extract_subreddit(url)
    if not sub:
        return None
    try:
        resp = _http.get(f"https://www.reddit.com/r/{sub}/about.json", timeout=20)
        if resp.status_code == 404:
            print(f"    reddit: r/{sub} not found")
            return None
        resp.raise_for_status()
    except Exception as e:
        print(f"    reddit fetch error: {e}")
        return None
    data = resp.json().get("data") or {}
    subs = data.get("subscribers")
    return int(subs) if subs is not None else None


def _extract_subreddit(url: str) -> str:
    m = re.search(r"reddit\.com/r/([A-Za-z0-9_]+)", url or "")
    return m.group(1) if m else ""
