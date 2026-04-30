from __future__ import annotations
import requests
from config import NOTION_TOKEN

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

URL_FIELDS = {
    "youtube": "Youtube",
    "instagram": "Instagram",
    "notion_templates": "Notion Templates",
    "twitter": "Twitter",
    "tiktok": "TikTok",
}

COUNT_FIELDS = {
    "youtube": "Youtube Followers",
    "instagram": "Instagram Followers",
    "notion_templates": "Templates Made",
    "twitter": "Twitter Followers",
    "tiktok": "TikTok Followers",
}


def fetch_people(database_id: str) -> list[dict]:
    people = []
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
            person = _parse_page(page)
            if not person.get("name"):
                continue
            people.append(person)
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return people


def _parse_page(page: dict) -> dict:
    props = page["properties"]

    def get_title(key):
        items = props.get(key, {}).get("title", [])
        return "".join(t.get("plain_text", "") for t in items).strip()

    def get_url(key):
        return props.get(key, {}).get("url", "") or ""

    def get_number(key):
        return props.get(key, {}).get("number")

    person = {
        "page_id": page["id"],
        "name": get_title("Name"),
    }
    for platform, field in URL_FIELDS.items():
        person[f"{platform}_url"] = get_url(field)
    for platform, field in COUNT_FIELDS.items():
        person[f"{platform}_count"] = get_number(field)
    return person


def update_page(page_id: str, counts: dict[str, int | None]):
    """counts maps platform key -> count (or None to clear). Only platforms in dict are written."""
    properties = {}
    for platform, count in counts.items():
        field = COUNT_FIELDS[platform]
        properties[field] = {"number": count if count is not None else None}
    if not properties:
        return
    resp = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=HEADERS,
        json={"properties": properties},
    )
    if not resp.ok:
        print(f"  [notion update] failed: {resp.status_code} {resp.text[:200]}")
