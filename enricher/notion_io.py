from __future__ import annotations
import requests
from config import NOTION_TOKEN

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}


def fetch_people(database_id: str) -> list[dict]:
    """Fetch all rows from a Notion database and return as person dicts with page_id."""
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
            if person.get("name"):
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

    def get_text(key):
        items = props.get(key, {}).get("rich_text", [])
        return "".join(t.get("plain_text", "") for t in items).strip()

    def get_email(key):
        return props.get(key, {}).get("email", "") or ""

    def get_url(key):
        return props.get(key, {}).get("url", "") or ""

    return {
        "page_id": page["id"],
        "name": get_title("Name"),
        "email": get_email("Email"),
        "company": "",
        "location": f"{get_text('City')}, {get_text('Country')}".strip(", "),
        "website": get_url("Website"),
        "linkedin_url": get_text("LinkedIn URL"),
    }


def update_page(page_id: str, result: dict):
    """Write enrichment results back to a Notion page."""

    def text_prop(val):
        return {"rich_text": [{"text": {"content": str(val or "")[:2000]}}]}

    def select_prop(val):
        if not val or val == "none":
            return {"select": None}
        return {"select": {"name": str(val)}}

    def checkbox_prop(val):
        return {"checkbox": bool(val)}

    properties = {
        "Youtube Handle": text_prop(result.get("youtube_handle", "")),
        "YouTube Confidence": select_prop(result.get("youtube_confidence", "")),
        "Instagram Handle": text_prop(result.get("instagram_handle", "")),
        "Instagram Confidence": select_prop(result.get("instagram_confidence", "")),
        "Instagram Followers": {"number": result.get("instagram_followers") or None},
        "Notion Marketplace URL": text_prop(result.get("notion_marketplace_url", "")),
        "Notion Confidence": select_prop(result.get("notion_confidence", "")),
        "Needs Review": checkbox_prop(result.get("needs_review", False)),
        "Notes": text_prop(result.get("notes", "")),
    }

    resp = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=HEADERS,
        json={"properties": properties},
    )
    if not resp.ok:
        print(f"  [notion update] failed: {resp.status_code} {resp.text[:200]}")
