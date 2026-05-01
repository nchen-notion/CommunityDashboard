from __future__ import annotations
import re
from . import _firecrawl


def get_count(url: str) -> int | None:
    """Connpass group member count.

    The group landing page doesn't show a member total — we hit the
    /participation/ subpage and sum the section headers like
    "Organizers (3)" + "Other Members (183)".
    """
    if not url:
        return None
    sub = url.rstrip("/") + "/participation/"
    md = _firecrawl.scrape(sub)
    if not md:
        return None

    # Section headers: "### Organizers (3)", "### Other Members (183)",
    # "### Participants (N)" — sum every "<Header> (N)" we find.
    total = 0
    found = False
    for m in re.finditer(
        r"###\s+(?:Organizers|Other Members|Participants|Members)\s*\((\d[\d,]*)\)",
        md,
    ):
        total += int(m.group(1).replace(",", ""))
        found = True
    if found:
        return total
    return None
