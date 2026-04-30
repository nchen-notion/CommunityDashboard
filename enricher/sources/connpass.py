from __future__ import annotations
import time
import requests
from config import APIFY_TOKEN

RUN_URL = "https://api.apify.com/v2/acts/nFJndFXA5zjCTuudP/run-sync-get-dataset-items"


def search(person: dict) -> list[dict]:
    """Find Connpass profiles via Google Search via Apify."""
    if not APIFY_TOKEN:
        return []

    query = f'"{person["name"]}" site:connpass.com'

    try:
        resp = requests.post(
            RUN_URL,
            params={"token": APIFY_TOKEN, "timeout": 60},
            json={"queries": query, "resultsPerPage": 3, "maxPagesPerQuery": 1},
            timeout=90,
        )
        resp.raise_for_status()
        items = resp.json()
    except Exception as e:
        print(f"  [connpass] Apify error: {e}")
        try:
            time.sleep(5)
            resp = requests.post(
                RUN_URL,
                params={"token": APIFY_TOKEN, "timeout": 60},
                json={"queries": query, "resultsPerPage": 3, "maxPagesPerQuery": 1},
                timeout=90,
            )
            resp.raise_for_status()
            items = resp.json()
        except Exception as e2:
            print(f"  [connpass] retry failed: {e2}")
            return []

    results = []
    for item in items[:3]:
        organic = item.get("organicResults", [])
        for r in organic[:3]:
            url = r.get("url", "")
            if "connpass.com" in url:
                results.append({
                    "url": url,
                    "title": r.get("title", ""),
                    "description": r.get("description", ""),
                })
    return results[:3]
