from __future__ import annotations
import json
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

    # Primary: parse ytInitialData and navigate to the channel header renderer.
    # Scoped to the channel's own header so featured channels ("Channels I Love")
    # in the page body can never be returned.
    count = _from_yt_initial_data(html)
    if count is not None:
        return count

    # Fallback: compact-JSON regex anchored to the same header renderers.
    return _from_compact_regex(html)


def _from_yt_initial_data(html: str) -> int | None:
    """Parse the ytInitialData JSON blob and read subscriber count from the channel header."""
    m = re.search(r"var ytInitialData\s*=\s*(\{)", html)
    if not m:
        return None

    # Walk forward counting braces to find the full JSON object.
    start = m.start(1)
    depth, end = 0, start
    for i, ch in enumerate(html[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break

    try:
        data = json.loads(html[start : end + 1])
    except (json.JSONDecodeError, ValueError):
        return None

    header = data.get("header", {})

    # New schema (2024+): pageHeaderRenderer → pageHeaderViewModel → metadata rows
    phr = header.get("pageHeaderRenderer", {})
    if phr:
        rows = (
            phr.get("content", {})
            .get("pageHeaderViewModel", {})
            .get("metadata", {})
            .get("contentMetadataViewModel", {})
            .get("metadataRows", [])
        )
        for row in rows:
            for part in row.get("metadataParts", []):
                text = part.get("text", {}).get("content", "")
                if "subscriber" in text.lower():
                    return _parse_count(text)

    # Legacy schema: c4TabbedHeaderRenderer → subscriberCountText
    c4 = header.get("c4TabbedHeaderRenderer", {})
    if c4:
        sub = c4.get("subscriberCountText", {})
        if sub:
            text = sub.get("simpleText", "")
            if not text:
                runs = sub.get("runs", [])
                text = runs[0].get("text", "") if runs else ""
            if text:
                return _parse_count(text)

    return None


def _from_compact_regex(html: str) -> int | None:
    """Regex fallback for minified ytInitialData when JSON parsing fails."""
    # New schema: subscriber count appears as a metadata part content value
    m = re.search(r'"content":"(\d[\d.,]*[KMBkmb]?\s*subscribers?)"', html, re.IGNORECASE)
    if not m:
        # Legacy schema: subscriberCountText with simpleText
        m = re.search(r'"subscriberCountText":\{"simpleText":"([^"]+)"', html)
    if not m:
        m = re.search(r'"subscriberCountText":\{"runs":\[\{"text":"([^"]+)"', html)
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
