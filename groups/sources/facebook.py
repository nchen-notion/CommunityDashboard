from __future__ import annotations
import re
from . import _firecrawl


def get_count(url: str) -> int | None:
    """Facebook group member count via Firecrawl on the /about page.

    The logged-out About page renders the member count as plain text
    (e.g. "10,946 total members" or "10.9K members"). Apify's
    facebook-groups-scraper actor is misleadingly named — it scrapes
    posts and never returns a member count, so we don't use it.
    """
    if not url:
        return None
    md = _firecrawl.scrape(_about_url(url))
    if not md:
        return None

    # Prefer the exact "X total members" form over the abbreviated header.
    m = re.search(r"([\d,]+)\s+total\s+members?", md, re.IGNORECASE)
    if m:
        return int(m.group(1).replace(",", ""))

    # "10.9K members" / "1.2M members" / "523 members" / "1 member"
    m = re.search(r"([\d,]+(?:\.\d+)?)\s*([KMB]?)\s+members?", md, re.IGNORECASE)
    if m:
        num = float(m.group(1).replace(",", ""))
        suffix = (m.group(2) or "").upper()
        mult = {"": 1, "K": 1_000, "M": 1_000_000, "B": 1_000_000_000}[suffix]
        return int(num * mult)
    return None


def _about_url(url: str) -> str:
    """Normalize to the /about variant — that page reliably exposes the count."""
    s = url.split("?")[0].rstrip("/")
    if s.endswith("/about"):
        return s
    return s + "/about"
