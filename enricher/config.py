import os
from pathlib import Path
from dotenv import load_dotenv

_root = Path(__file__).parent.parent  # scraper/
load_dotenv(dotenv_path=_root / ".env.local", override=True)
load_dotenv(dotenv_path=_root / ".env", override=False)

APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")
NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "")

# Apify actor slugs — override via env if you want to swap actors.
APIFY_ACTOR_INSTAGRAM = os.getenv("APIFY_ACTOR_INSTAGRAM", "apify/instagram-profile-scraper")
APIFY_ACTOR_TIKTOK = os.getenv("APIFY_ACTOR_TIKTOK", "clockworks/tiktok-profile-scraper")
APIFY_ACTOR_TWITTER = os.getenv("APIFY_ACTOR_TWITTER", "apidojo/twitter-scraper-lite")

MISSING = [k for k, v in {
    "APIFY_TOKEN": APIFY_TOKEN,
    "NOTION_TOKEN": NOTION_TOKEN,
}.items() if not v]
