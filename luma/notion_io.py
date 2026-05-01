from __future__ import annotations
import requests
from config import NOTION_TOKEN

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}


def fetch_existing_event_urls(database_id: str) -> set[str]:
    """Return set of lu.ma event URLs already in the Notion database (used for deduplication)."""
    urls: set[str] = set()
    cursor = None
    while True:
        body: dict = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        resp = requests.post(
            f"https://api.notion.com/v1/databases/{database_id}/query",
            headers=HEADERS,
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()
        for page in data.get("results", []):
            url = page["properties"].get("Link to Event", {}).get("url") or ""
            if url:
                urls.add(url)
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return urls


def create_event_row(database_id: str, event: dict, rsvp_count: int):
    name = event.get("name", "Untitled Event")
    start_at = event.get("start_at", "")
    url = event.get("url", "")

    host_names = ", ".join(
        h.get("name", "") for h in (event.get("hosts") or []) if h.get("name")
    )
    location = (
        (event.get("geo_address_info") or {}).get("full_address", "")
        or (event.get("geo_address_info") or {}).get("address", "")
        or ""
    )

    properties: dict = {
        "Name": {"title": [{"text": {"content": name}}]},
        "RSVP Count": {"number": rsvp_count},
    }
    if start_at:
        properties["Date"] = {"date": {"start": start_at[:10]}}
    if url:
        properties["Link to Event"] = {"url": url}
    if host_names:
        properties["Host"] = {"rich_text": [{"text": {"content": host_names}}]}
    if location:
        properties["Location"] = {"rich_text": [{"text": {"content": location}}]}

    resp = requests.post(
        "https://api.notion.com/v1/pages",
        headers=HEADERS,
        json={"parent": {"database_id": database_id}, "properties": properties},
    )
    if not resp.ok:
        print(f"  [notion] failed to create '{name}': {resp.status_code} {resp.text[:200]}")
