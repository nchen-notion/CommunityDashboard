from __future__ import annotations
import re
import requests

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def get_count(url: str) -> int | None:
    """Fetch a Notion creator page (e.g. notion.com/@vaniadev) and count their templates."""
    if not url:
        return None
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        print(f"    notion templates fetch error: {e}")
        return None

    html = resp.text

    # Preferred: an explicit count rendered on the page, e.g. "12 templates".
    m = re.search(r'(\d+)\s+templates?\b', html, re.IGNORECASE)
    if m:
        return int(m.group(1))

    # Fallback: count unique template paths referenced on the profile page.
    paths = set(re.findall(r'/templates/[A-Za-z0-9][\w\-]*', html))
    if paths:
        return len(paths)

    return None
