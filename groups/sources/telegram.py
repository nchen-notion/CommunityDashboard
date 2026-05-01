from __future__ import annotations
import re
from . import _http


def get_count(url: str) -> int | None:
    """Telegram channel/group size from t.me/X page.

    The public preview page contains text like "1 234 subscribers" or
    "1 234 members" inside a tgme_page_extra div.
    """
    handle = _extract_handle(url)
    if not handle:
        return None
    try:
        resp = _http.get(f"https://t.me/{handle}", timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print(f"    telegram fetch error: {e}")
        return None
    html = resp.text

    # Numbers may use spaces or non-breaking spaces as separators.
    m = re.search(r'class="tgme_page_extra"[^>]*>([^<]+)<', html)
    if m:
        text = m.group(1)
        for segment in text.split(","):
            count = _parse_number(segment)
            if count is not None and ("subscriber" in segment.lower() or "member" in segment.lower()):
                return count

    m = re.search(r"([\d\s\xa0]+)\s+(?:subscribers?|members?)", html, re.IGNORECASE)
    if m:
        return _parse_number(m.group(1))
    return None


def _extract_handle(url: str) -> str:
    s = (url or "").strip().rstrip("/")
    if "t.me/" in s:
        s = s.split("t.me/")[1]
    elif "telegram.me/" in s:
        s = s.split("telegram.me/")[1]
    return s.split("/")[0].split("?")[0].lstrip("@")


def _parse_number(s: str) -> int | None:
    digits = re.sub(r"[^\d]", "", s)
    return int(digits) if digits else None
