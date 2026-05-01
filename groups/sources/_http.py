"""Shared HTTP helper for direct page scrapes."""
from __future__ import annotations
import requests

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)
HEADERS = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}


def get(url: str, timeout: int = 30, **kwargs):
    return requests.get(url, headers=HEADERS, timeout=timeout, **kwargs)
