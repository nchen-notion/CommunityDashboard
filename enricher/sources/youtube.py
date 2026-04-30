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
    """Fetch a YouTube channel page and extract subscriber count from embedded JSON."""
    if not url:
        return None
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"    youtube fetch error: {e}")
        return None

    html = resp.text

    # Preferred: ytInitialData carries an exact subscriber count for channel pages.
    m = re.search(r'"subscriberCountText":\s*\{[^}]*?"simpleText":\s*"([^"]+)"', html)
    if not m:
        m = re.search(
            r'"subscriberCountText":\s*\{[^}]*?"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"',
            html,
        )
    if not m:
        # Newer schema sometimes uses "content" inside "metadataParts"
        m = re.search(r'"(\d[\d.,KMB\s]*subscribers?)"', html, re.IGNORECASE)
    if not m:
        return None

    return _parse_count(m.group(1))


def _parse_count(text: str) -> int | None:
    """Parse strings like '1.2M subscribers', '345K', '12,345 subscribers'."""
    s = text.strip().lower().replace("subscribers", "").replace("subscriber", "").strip()
    s = s.replace(",", "")
    if not s:
        return None
    multiplier = 1
    if s.endswith("k"):
        multiplier = 1_000
        s = s[:-1]
    elif s.endswith("m"):
        multiplier = 1_000_000
        s = s[:-1]
    elif s.endswith("b"):
        multiplier = 1_000_000_000
        s = s[:-1]
    try:
        return int(float(s.strip()) * multiplier)
    except ValueError:
        return None
