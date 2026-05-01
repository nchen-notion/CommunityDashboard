import os
from pathlib import Path
from dotenv import load_dotenv

_root = Path(__file__).parent.parent  # scraper/
load_dotenv(dotenv_path=_root / ".env.local", override=True)
load_dotenv(dotenv_path=_root / ".env", override=False)

APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")
NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
NOTION_GROUPS_DATABASE_ID = os.getenv("NOTION_GROUPS_DATABASE_ID", "")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")

# Apify task slug for Facebook groups (a saved task on the user's account).
APIFY_TASK_FACEBOOK = os.getenv("APIFY_TASK_FACEBOOK", "nancy_notion/facebook-groups-scraper-task")

MISSING = [k for k, v in {
    "APIFY_TOKEN": APIFY_TOKEN,
    "NOTION_TOKEN": NOTION_TOKEN,
}.items() if not v]
