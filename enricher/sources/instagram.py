from __future__ import annotations
import time
import requests
from config import APIFY_TOKEN

RUN_URL = "https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/run-sync-get-dataset-items"


def search(person: dict) -> list[dict]:
    """Return up to 3 candidate Instagram profiles via Apify."""
    if not APIFY_TOKEN:
        return []

    try:
        resp = requests.post(
            RUN_URL,
            params={"token": APIFY_TOKEN, "timeout": 60},
            json={
                "searchType": "user",
                "searchLimit": 3,
                "search": person["name"],
                "resultsLimit": 3,
            },
            timeout=90,
        )
        resp.raise_for_status()
        items = resp.json()
    except Exception as e:
        print(f"  [instagram] Apify error: {e}")
        # retry once
        try:
            time.sleep(5)
            resp = requests.post(
                RUN_URL,
                params={"token": APIFY_TOKEN, "timeout": 60},
                json={
                    "searchType": "user",
                    "searchLimit": 3,
                    "search": person["name"],
                    "resultsLimit": 3,
                },
                timeout=90,
            )
            resp.raise_for_status()
            items = resp.json()
        except Exception as e2:
            print(f"  [instagram] retry failed: {e2}")
            return []

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
