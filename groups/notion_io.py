from __future__ import annotations
import requests
from config import NOTION_TOKEN

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

NAME_FIELD = "Name"
PLATFORM_FIELD = "Platform"
URL_FIELD = "Link"
COUNT_FIELD = "Followers"


def fetch_groups(database_id: str) -> list[dict]:
    rows = []
    cursor = None
    while True:
        body = {"page_size": 100}
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
            row = _parse_page(page)
            if row.get("name"):
                rows.append(row)
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return rows


def _parse_page(page: dict) -> dict:
    props = page["properties"]

    def title(key):
        return "".join(t.get("plain_text", "") for t in props.get(key, {}).get("title", [])).strip()

    def url(key):
        return props.get(key, {}).get("url", "") or ""

    def number(key):
        return props.get(key, {}).get("number")

    def select(key):
        sel = props.get(key, {}).get("select")
        return (sel or {}).get("name", "") or ""

    return {
        "page_id": page["id"],
        "name": title(NAME_FIELD),
        "platform": select(PLATFORM_FIELD),
        "url": url(URL_FIELD),
        "count": number(COUNT_FIELD),
    }


def update_count(page_id: str, count: int | None):
    if count is None:
        return
    resp = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=HEADERS,
        json={"properties": {COUNT_FIELD: {"number": int(count)}}},
    )
    if not resp.ok:
        print(f"  [notion update] failed: {resp.status_code} {resp.text[:200]}")
