from __future__ import annotations
import re
from . import _firecrawl


def get_count(url: str) -> int | None:
    """Meetup group size — page is JS-rendered, so we go through Firecrawl."""
    if not url:
        return None
    md = _firecrawl.scrape(url)
    if not md:
        return None

    m = re.search(r'([\d,]+)\s+(?:members|Mitglieder|membres|miembros|Mitgliedern)', md, re.IGNORECASE)
    if m:
        return int(m.group(1).replace(",", ""))
    return None
