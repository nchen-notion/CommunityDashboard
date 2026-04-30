from __future__ import annotations
import time
import requests
from config import APIFY_TOKEN


def run_actor(actor_slug: str, run_input: dict, timeout: int = 120) -> list[dict]:
    """Run an Apify actor synchronously and return its dataset items.

    actor_slug is "user/name" — we convert to the URL form "user~name".
    Returns [] on failure (after one retry).
    """
    if not APIFY_TOKEN:
        return []
    actor_path = actor_slug.replace("/", "~")
    url = f"https://api.apify.com/v2/acts/{actor_path}/run-sync-get-dataset-items"
    for attempt in range(2):
        try:
            resp = requests.post(
                url,
                params={"token": APIFY_TOKEN, "timeout": timeout},
                json=run_input,
                timeout=timeout + 30,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            if attempt == 0:
                time.sleep(5)
            else:
                print(f"    apify error ({actor_slug}): {e}")
    return []
