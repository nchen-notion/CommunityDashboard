from __future__ import annotations
import time
import requests
from config import APIFY_TOKEN


def run(slug: str, run_input: dict, kind: str = "task", timeout: int = 180) -> list[dict]:
    """Run an Apify actor or task synchronously and return its dataset items.

    kind="task"  → calls /v2/actor-tasks/{slug}
    kind="actor" → calls /v2/acts/{slug}
    slug uses "user/name" — converted to URL form "user~name".
    """
    if not APIFY_TOKEN:
        return []
    path = slug.replace("/", "~")
    base = "actor-tasks" if kind == "task" else "acts"
    url = f"https://api.apify.com/v2/{base}/{path}/run-sync-get-dataset-items"
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
                print(f"    apify {kind} error ({slug}): {e}")
    return []


# Convenience aliases.
def run_task(slug: str, run_input: dict, timeout: int = 180) -> list[dict]:
    return run(slug, run_input, kind="task", timeout=timeout)


def run_actor(slug: str, run_input: dict, timeout: int = 180) -> list[dict]:
    return run(slug, run_input, kind="actor", timeout=timeout)
