from __future__ import annotations
import re
from . import _http


def get_count(url: str) -> int | None:
    if not url:
        return None
    try:
        resp = _http.get(url, timeout=30, allow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        print(f"    clubhouse fetch error: {e}")
        return None
    html = resp.text

    # Try common patterns: "X members", "X followers", or embedded JSON num_members.
    m = re.search(r'"num_members":\s*(\d+)', html)
    if m:
        return int(m.group(1))
    m = re.search(r'"member_count":\s*(\d+)', html)
    if m:
        return int(m.group(1))
    m = re.search(r"([\d,]+)\s+(?:members|followers)", html, re.IGNORECASE)
    if m:
        return int(m.group(1).replace(",", ""))
    return None
