#!/usr/bin/env python3
"""PDL email-keyed enrichment probe for the Campus Leaders DB.

Reads N rows from the Campus Leaders Notion DB, calls PDL's
person/enrich endpoint for each email, prints what came back, and
writes any IG / TikTok / YouTube URLs back to Notion. Used to gauge
PDL's hit rate on student emails before scaling up.

Usage:
  python3 probe.py --limit 20            # default
  python3 probe.py --limit 50 --dry-run  # don't write to Notion
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load env from scraper/.env.local
_root = Path(__file__).parent.parent
load_dotenv(_root / ".env.local", override=True)

NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
DB_ID = os.getenv("NOTION_CAMPUS_LEADERS_DATABASE_ID", "")
PDL_KEY = os.getenv("PDL_API_KEY", "")

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

# Map PDL profile network → Notion URL property name
PROFILE_FIELDS = {
    "instagram": "Instagram",
    "tiktok": "TikTok",
    "youtube": "Youtube",
}


def fetch_rows(limit: int) -> list[dict]:
    rows = []
    cursor = None
    while len(rows) < limit:
        body = {"page_size": min(100, limit - len(rows))}
        if cursor:
            body["start_cursor"] = cursor
        r = requests.post(
            f"https://api.notion.com/v1/databases/{DB_ID}/query",
            headers=NOTION_HEADERS, json=body,
        )
        r.raise_for_status()
        data = r.json()
        for page in data.get("results", []):
            rows.append(_parse(page))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return rows[:limit]


def _parse(page: dict) -> dict:
    p = page["properties"]

    def title(k):
        return "".join(t.get("plain_text", "") for t in p.get(k, {}).get("title", [])).strip()

    def email(k):
        # "email" type properties expose value at .email; rich_text holds value at .rich_text[].plain_text
        v = p.get(k, {})
        if v.get("type") == "email":
            return v.get("email") or ""
        return "".join(t.get("plain_text", "") for t in v.get("rich_text", [])).strip()

    def url(k):
        return p.get(k, {}).get("url")

    return {
        "page_id": page["id"],
        "name": title("Name"),
        "workspace_email": email("Workspace email"),
        "school_email": email("School email"),
        "personal_email": email("Email"),
        "instagram": url("Instagram"),
        "tiktok": url("TikTok"),
        "youtube": url("Youtube"),
    }


def best_email(row: dict) -> str:
    # Workspace > Personal > School (workspace is most often the gmail)
    for k in ("workspace_email", "personal_email", "school_email"):
        v = (row.get(k) or "").strip()
        if v:
            return v
    return ""


def pdl_enrich(email: str) -> dict | None:
    """Hit PDL Person Enrichment. Returns the data dict or None if not found."""
    r = requests.get(
        "https://api.peopledatalabs.com/v5/person/enrich",
        headers={"X-Api-Key": PDL_KEY},
        params={"email": email, "min_likelihood": 6},
    )
    if r.status_code == 404:
        return None
    if not r.ok:
        print(f"    PDL error {r.status_code}: {r.text[:200]}")
        return None
    body = r.json()
    if body.get("status") != 200:
        return None
    return body.get("data")


def extract_handles(data: dict) -> dict:
    """Pull instagram/tiktok/youtube/twitter URLs out of PDL profiles list."""
    out = {}
    for prof in data.get("profiles") or []:
        net = (prof.get("network") or "").lower()
        url = prof.get("url")
        if not url:
            continue
        # PDL sometimes lists multiple profiles per network — keep the first.
        if net not in out:
            out[net] = url
    return out


def update_notion(page_id: str, found: dict, existing: dict) -> list[str]:
    """Write IG/TikTok/YouTube URLs to Notion. Returns list of fields written."""
    properties = {}
    written = []
    for net, field in PROFILE_FIELDS.items():
        url = found.get(net)
        if url and not existing.get(net):  # don't overwrite existing values
            properties[field] = {"url": url}
            written.append(field)
    if not properties:
        return []
    r = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=NOTION_HEADERS, json={"properties": properties},
    )
    if not r.ok:
        print(f"    Notion update failed: {r.status_code} {r.text[:200]}")
        return []
    return written


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--dry-run", action="store_true", help="Don't write to Notion")
    args = parser.parse_args()

    if not (NOTION_TOKEN and DB_ID and PDL_KEY):
        print("Missing one of: NOTION_TOKEN, NOTION_CAMPUS_LEADERS_DATABASE_ID, PDL_API_KEY")
        sys.exit(1)

    rows = fetch_rows(args.limit)
    print(f"Fetched {len(rows)} rows from Campus Leaders DB.\n")

    hits = 0
    by_net = {"instagram": 0, "tiktok": 0, "youtube": 0, "twitter": 0}
    no_email = 0

    for i, row in enumerate(rows, 1):
        email = best_email(row)
        prefix = f"[{i}/{len(rows)}] {row['name']}"
        if not email:
            print(f"{prefix} — no email, skipping")
            no_email += 1
            continue

        data = pdl_enrich(email)
        if not data:
            print(f"{prefix} <{email}> → PDL: no match")
            continue

        handles = extract_handles(data)
        relevant = {k: v for k, v in handles.items() if k in {"instagram", "tiktok", "youtube", "twitter"}}
        if not relevant:
            print(f"{prefix} <{email}> → PDL match but no IG/TikTok/YT/Twitter")
            continue

        hits += 1
        for net in relevant:
            by_net[net] = by_net.get(net, 0) + 1
        summary = ", ".join(f"{k}={v}" for k, v in relevant.items())
        print(f"{prefix} <{email}> → {summary}")

        if not args.dry_run:
            written = update_notion(row["page_id"], relevant, row)
            if written:
                print(f"    wrote: {', '.join(written)}")

    print()
    print(f"Done. {hits}/{len(rows)} rows had at least one social handle.")
    print(f"  {no_email} skipped (no email)")
    print(f"  by platform: {by_net}")


if __name__ == "__main__":
    main()
