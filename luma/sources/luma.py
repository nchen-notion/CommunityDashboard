from __future__ import annotations
import requests
from config import LUMA_API_KEY

_BASE = "https://api.lu.ma/public/v1"
_HEADERS = {"x-luma-api-key": LUMA_API_KEY, "accept": "application/json"}


def list_calendar_events(calendar_id: str) -> list[dict]:
    events = []
    cursor = None
    while True:
        params: dict = {"calendar_api_id": calendar_id, "pagination_limit": 100}
        if cursor:
            params["pagination_cursor"] = cursor
        resp = requests.get(f"{_BASE}/calendar/list-events", headers=_HEADERS, params=params)
        resp.raise_for_status()
        data = resp.json()
        for entry in data.get("entries", []):
            event = entry.get("event", {})
            if event.get("api_id"):
                events.append(event)
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return events


def get_rsvp_count(event_id: str) -> int:
    total = 0
    cursor = None
    while True:
        params: dict = {"event_api_id": event_id, "pagination_limit": 100}
        if cursor:
            params["pagination_cursor"] = cursor
        resp = requests.get(f"{_BASE}/event/get-guests", headers=_HEADERS, params=params)
        resp.raise_for_status()
        data = resp.json()
        total += len(data.get("entries", []))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return total
