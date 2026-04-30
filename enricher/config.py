import os
from pathlib import Path
from dotenv import load_dotenv

_root = Path(__file__).parent.parent  # scraper/
load_dotenv(dotenv_path=_root / ".env.local", override=True)
load_dotenv(dotenv_path=_root / ".env", override=False)

APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "")

MISSING = [k for k, v in {
    "APIFY_TOKEN": APIFY_TOKEN,
    "ANTHROPIC_API_KEY": ANTHROPIC_API_KEY,
}.items() if not v]
