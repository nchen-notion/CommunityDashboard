from __future__ import annotations
import pandas as pd
from notion_client import Client
from config import NOTION_TOKEN, NOTION_DATABASE_ID

PLATFORM_COLUMNS = {
    "youtube": ("youtube_handle", "youtube_confidence"),
    "instagram": ("instagram_handle", "instagram_confidence"),
    "reddit": ("reddit_username", "reddit_confidence"),
    "notion_mp": ("notion_marketplace_url", "notion_confidence"),
    "connpass": ("connpass_url", "connpass_confidence"),
}


def write_csv(rows: list[dict], path: str):
    df = pd.DataFrame(rows)
    df.to_csv(path, index=False)
    print(f"Wrote {len(rows)} rows to {path}")


def write_notion(rows: list[dict]):
    if not NOTION_TOKEN or not NOTION_DATABASE_ID:
        print("Notion token or database ID not configured, skipping Notion write.")
        return

    notion = Client(auth=NOTION_TOKEN)
    for row in rows:
        props = _build_notion_properties(row)
        try:
            notion.pages.create(
                parent={"database_id": NOTION_DATABASE_ID},
                properties=props,
            )
        except Exception as e:
            print(f"  [notion output] failed for {row.get('name', '?')}: {e}")

    print(f"Wrote {len(rows)} rows to Notion database {NOTION_DATABASE_ID}")


def _build_notion_properties(row: dict) -> dict:
    def text_prop(val):
        return {"rich_text": [{"text": {"content": str(val or "")}}]}

    def title_prop(val):
        return {"title": [{"text": {"content": str(val or "")}}]}

    def select_prop(val):
        if not val or val == "none":
            return {"select": None}
        return {"select": {"name": str(val)}}

    def checkbox_prop(val):
        return {"checkbox": bool(val)}

    props = {
        "Name": title_prop(row.get("name", "")),
        "Email": text_prop(row.get("email", "")),
        "YouTube Handle": text_prop(row.get("youtube_handle", "")),
        "YouTube Confidence": select_prop(row.get("youtube_confidence", "")),
        "Instagram Handle": text_prop(row.get("instagram_handle", "")),
        "Instagram Confidence": select_prop(row.get("instagram_confidence", "")),
"Notion Marketplace URL": text_prop(row.get("notion_marketplace_url", "")),
        "Notion Confidence": select_prop(row.get("notion_confidence", "")),
"Needs Review": checkbox_prop(row.get("needs_review", False)),
        "Notes": text_prop(row.get("notes", "")),
    }
    return props
