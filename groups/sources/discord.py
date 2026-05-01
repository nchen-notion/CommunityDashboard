from __future__ import annotations
import re
from . import _http


def get_count(url: str) -> int | None:
    """Discord server size via the public invite API.

    Works for any URL like discord.gg/CODE or discord.com/invite/CODE.
    """
    code = _extract_invite(url)
    if not code:
        return None
    try:
        resp = _http.get(
            f"https://discord.com/api/v9/invites/{code}",
            params={"with_counts": "true"},
            timeout=20,
        )
        if not resp.ok:
            print(f"    discord error {resp.status_code} on {code}: {resp.text[:200]}")
            return None
    except Exception as e:
        print(f"    discord fetch error: {e}")
        return None
    return resp.json().get("approximate_member_count")


def _extract_invite(url: str) -> str:
    s = (url or "").strip().rstrip("/")
    m = re.search(r"(?:discord\.gg|discord(?:app)?\.com/invite)/([A-Za-z0-9-]+)", s)
    return m.group(1) if m else ""
