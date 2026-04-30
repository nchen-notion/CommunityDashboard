from __future__ import annotations
import time
import requests
from config import APIFY_TOKEN

RUN_URL = "https://api.apify.com/v2/acts/h7sDV53CddomktSi5/run-sync-get-dataset-items"


def search(person: dict) -> list[dict]:
    """Return up to 3 candidate YouTube channels via Apify YouTube Scraper."""
    if not APIFY_TOKEN:
        return []

    query_parts = [person["name"]]
    if person.get("company"):
        query_parts.append(person["company"])
    query = " ".join(query_parts)

    try:
        resp = requests.post(
            RUN_URL,
            params={"token": APIFY_TOKEN, "timeout": 60},
            json={"searchKeywords": query, "maxResults": 9},
            timeout=90,
        )
        resp.raise_for_status()
        items = resp.json()
    except Exception as e:
        print(f"  [youtube] Apify error: {e}")
        try:
            time.sleep(5)
            resp = requests.post(
                RUN_URL,
                params={"token": APIFY_TOKEN, "timeout": 60},
                json={"searchKeywords": query, "maxResults": 9},
                timeout=90,
            )
            resp.raise_for_status()
            items = resp.json()
        except Exception as e2:
            print(f"  [youtube] retry failed: {e2}")
            return []

    # deduplicate by channelId, keep top 3 unique channels
    seen = {}
    for item in items:
        channel_id = item.get("channelId", "")
        if channel_id and channel_id not in seen:
            seen[channel_id] = {
                "url": item.get("channelUrl", f"https://www.youtube.com/channel/{channel_id}"),
                "handle": item.get("channelUsername", ""),
                "name": item.get("channelName", ""),
                "subscribers": item.get("numberOfSubscribers", 0),
            }
        if len(seen) >= 3:
            break

    return list(seen.values())
