from __future__ import annotations
import time
import requests
from config import APIFY_TOKEN

RUN_URL = "https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/run-sync-get-dataset-items"


def _apify_search(query: str) -> list[dict]:
    for attempt in range(2):
        try:
            resp = requests.post(
                RUN_URL,
                params={"token": APIFY_TOKEN, "timeout": 60},
                json={"searchType": "user", "searchLimit": 3, "search": query, "resultsLimit": 3},
                timeout=90,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            if attempt == 0:
                print(f"  [instagram] error, retrying: {e}")
                time.sleep(5)
            else:
                print(f"  [instagram] retry failed: {e}")
    return []



def _parse_items(items: list) -> list[dict]:
    results = []
    for item in items[:3]:
        username = item.get("username", "")
        if not username:
            continue
        results.append({
            "url": f"https://www.instagram.com/{username}/",
            "username": username,
            "full_name": item.get("fullName", ""),
            "biography": item.get("biography", ""),
            "website": item.get("externalUrl", ""),
            "followers": item.get("followersCount", 0),
        })
    return results


def search(person: dict) -> list[dict]:
    """Return up to 3 candidate Instagram profiles."""
    if not APIFY_TOKEN:
        return []

    candidates = []

    # 1. Try YouTube handle as a direct Apify lookup (gets real followers)
    youtube_handle = person.get("youtube_handle", "")
    if youtube_handle:
        yt_username = youtube_handle.rstrip("/").split("/")[-1].lstrip("@")
        if yt_username:
            items = _apify_search(yt_username)
            # only keep exact username match
            for item in items:
                if item.get("username", "").lower() == yt_username.lower():
                    candidates.extend(_parse_items([item]))
                    break

    # 2. Search by full name
    items = _apify_search(person["name"])
    candidates.extend(_parse_items(items))

    # 3. Fallback: search by email prefix if name search returned nothing
    if not candidates:
        email = person.get("email", "")
        if "@" in email:
            prefix = email.split("@")[0].replace(".", "").replace("_", "")
            items = _apify_search(prefix)
            candidates.extend(_parse_items(items))

    return candidates[:3]
