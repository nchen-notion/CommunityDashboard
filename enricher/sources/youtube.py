from __future__ import annotations
import requests
from config import YOUTUBE_API_KEY

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"


def search(person: dict) -> list[dict]:
    """Return up to 3 candidate YouTube channels for a person."""
    if not YOUTUBE_API_KEY:
        return []

    query_parts = [f'"{person["name"]}"']
    if person.get("company"):
        query_parts.append(f'"{person["company"]}"')

    try:
        resp = requests.get(SEARCH_URL, params={
            "part": "snippet",
            "q": " ".join(query_parts),
            "type": "channel",
            "maxResults": 3,
            "key": YOUTUBE_API_KEY,
        }, timeout=10)
        resp.raise_for_status()
        items = resp.json().get("items", [])
    except Exception as e:
        print(f"  [youtube] search error: {e}")
        return []

    channel_ids = [item["id"]["channelId"] for item in items]
    if not channel_ids:
        return []

    try:
        detail_resp = requests.get(CHANNELS_URL, params={
            "part": "snippet,brandingSettings",
            "id": ",".join(channel_ids),
            "key": YOUTUBE_API_KEY,
        }, timeout=10)
        detail_resp.raise_for_status()
        channels = detail_resp.json().get("items", [])
    except Exception as e:
        print(f"  [youtube] channel detail error: {e}")
        return []

    results = []
    for ch in channels:
        snippet = ch.get("snippet", {})
        results.append({
            "url": f"https://www.youtube.com/channel/{ch['id']}",
            "handle": snippet.get("customUrl", ""),
            "name": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "country": snippet.get("country", ""),
        })
    return results
