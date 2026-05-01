import os
from pathlib import Path
from dotenv import load_dotenv

_root = Path(__file__).parent.parent
load_dotenv(dotenv_path=_root / ".env.local", override=True)
load_dotenv(dotenv_path=_root / ".env", override=False)

LUMA_API_KEY = os.getenv("LUMA_API_KEY", "")
LUMA_CALENDAR_ID = os.getenv("LUMA_CALENDAR_ID", "")
NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
NOTION_LUMA_DATABASE_ID = os.getenv("NOTION_LUMA_EVENTS_DATABASE", "")

MISSING = [k for k, v in {
    "LUMA_API_KEY": LUMA_API_KEY,
    "LUMA_CALENDAR_ID": LUMA_CALENDAR_ID,
    "NOTION_TOKEN": NOTION_TOKEN,
    "NOTION_LUMA_EVENTS_DATABASE": NOTION_LUMA_DATABASE_ID,
}.items() if not v]
