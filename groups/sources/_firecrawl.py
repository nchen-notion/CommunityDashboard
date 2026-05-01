"""Firecrawl helper — fetches a URL and returns its JS-rendered markdown."""
from __future__ import annotations
import requests
from config import FIRECRAWL_API_KEY


def scrape(url: str, timeout: int = 60) -> str:
    """Return rendered markdown for `url`, or empty string on failure."""
    if not FIRECRAWL_API_KEY:
        print("    firecrawl: FIRECRAWL_API_KEY not set, skipping")
        return ""
    try:
        resp = requests.post(
            "https://api.firecrawl.dev/v2/scrape",
            headers={
                "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"url": url, "formats": ["markdown"]},
            timeout=timeout,
        )
        if not resp.ok:
            print(f"    firecrawl error {resp.status_code} on {url}: {resp.text[:200]}")
            return ""
        body = resp.json()
        if not body.get("success"):
            print(f"    firecrawl returned success=False on {url}: {body}")
            return ""
        return (body.get("data") or {}).get("markdown") or ""
    except Exception as e:
        print(f"    firecrawl fetch error: {e}")
        return ""
