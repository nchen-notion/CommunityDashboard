from __future__ import annotations
import time
import requests

SEARCH_URL = "https://www.reddit.com/search.json"
HEADERS = {"User-Agent": "social-enricher/1.0"}


def search(person: dict) -> list[dict]:
    """Return up to 3 candidate Reddit user profiles."""
    try:
        resp = requests.get(SEARCH_URL, params={
            "q": person["name"],
            "type": "user",
            "limit": 3,
        }, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        children = resp.json().get("data", {}).get("children", [])
        time.sleep(1)  # be polite
    except Exception as e:
        print(f"  [reddit] search error: {e}")
        return []

    results = []
    for child in children:
        data = child.get("data", {})
        username = data.get("name", "")
        if not username:
            continue
        results.append({
            "url": f"https://www.reddit.com/user/{username}",
            "username": username,
            "icon_img": data.get("icon_img", ""),
            "created_utc": data.get("created_utc", 0),
            "link_karma": data.get("link_karma", 0),
            "comment_karma": data.get("comment_karma", 0),
        })
    return results
