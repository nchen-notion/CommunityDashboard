# Social Handle Enricher — PRD

## Overview
A Python CLI tool that takes a CSV of names and emails and automatically finds and verifies their social media handles across multiple platforms. Outputs enriched results with confidence scores to CSV or Notion.

## Problem
Given a list of people (name + email), we need to find their presence across niche and mainstream social platforms. Clay handles mainstream enrichment (LinkedIn, company info) but cannot reliably find YouTube handles, Instagram, Notion Marketplace profiles, Connpass, or Reddit usernames.

## Goals
- Automate social handle discovery for a list of people
- Cross-reference multiple signals to reduce false positives
- Flag low-confidence matches for manual review
- Output results in a structured, reusable format

## Non-Goals
- Real-time lookup (batch processing is fine)
- Production SaaS (internal tool only)
- Handling private/locked profiles

---

## Input
A CSV file with at minimum:
- `name` (full name)
- `email`

Optional additional columns that improve match accuracy:
- `company`
- `location`
- `website`
- `linkedin_url`

---

## Output
A CSV (and optionally a Notion database write) with the original columns plus:

| Column | Description |
|---|---|
| `youtube_handle` | YouTube channel URL or handle |
| `youtube_confidence` | high / medium / low |
| `instagram_handle` | Instagram username |
| `instagram_confidence` | high / medium / low |
| `reddit_username` | Reddit u/ handle |
| `reddit_confidence` | high / medium / low |
| `notion_marketplace_url` | Notion marketplace profile URL |
| `notion_confidence` | high / medium / low |
| `connpass_url` | Connpass profile URL |
| `connpass_confidence` | high / medium / low |
| `needs_review` | true if any confidence is low |
| `notes` | Claude reasoning for match decisions |

---

## Architecture

```
enricher/
├── main.py           # CLI entry point
├── sources/
│   ├── youtube.py    # YouTube Data API v3 search + bio verification
│   ├── instagram.py  # Apify Instagram scraper actor
│   ├── reddit.py     # Reddit public API (/search.json)
│   ├── notion_mp.py  # Apify generic web scraper, Google search site:notion.so/marketplace
│   └── connpass.py   # Apify generic web scraper, Google search site:connpass.com
├── verify.py         # Claude API (claude-sonnet-4-20250514) to score match confidence
├── output.py         # CSV writer + optional Notion DB writer
└── config.py         # API key management via .env
```

---

## Platform-by-Platform Strategy

### YouTube
- Use YouTube Data API v3 (free, 10k units/day quota)
- Search query: `"{name}" "{company if available}"`
- Pull top 3 candidate channels
- Pass channel name, description, and about page to Claude to verify match against known email domain / company

### Instagram
- Use Apify Instagram scraper actor (`apify/instagram-scraper`)
- Search by name keyword
- Claude verifies by cross-referencing bio keywords, website links, and location

### Reddit
- Use Reddit public API: `https://www.reddit.com/search.json?q={name}&type=user`
- No auth required for public search
- Claude verifies by checking post history topics and account age

### Notion Marketplace
- Use Apify generic Web Scraper or Google Search Actor
- Query: `"{name}" site:notion.so/marketplace`
- Extract first matching URL
- Claude verifies by checking creator name on the profile page

### Connpass
- Use Apify generic Web Scraper or Google Search Actor
- Query: `"{name}" site:connpass.com`
- Extract profile URL
- Claude verifies by checking name and associated events

---

## Confidence Scoring (via Claude)

For each platform match, pass Claude:
- The person's name, email domain, company, location (from input)
- The candidate profile's name, bio, website, location (from scrape)

Claude returns:
```json
{
  "confidence": "high|medium|low",
  "reasoning": "Name exact match, bio mentions same company domain"
}
```

Confidence thresholds:
- **High**: name matches + at least one corroborating signal (company, domain, location)
- **Medium**: name matches but no corroborating signals
- **Low**: partial name match or ambiguous

---

## Tech Stack
- **Language**: Python 3.11+
- **APIs**: YouTube Data API v3, Reddit public API, Apify API, Claude API (`claude-sonnet-4-20250514`)
- **Apify actors**: `apify/web-scraper` for Notion marketplace + Connpass; `apify/instagram-scraper` for Instagram
- **Output**: CSV via pandas; optional Notion write via `notion-client`
- **Config**: `.env` file with `YOUTUBE_API_KEY`, `APIFY_TOKEN`, `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`

---

## CLI Usage

```bash
# Basic usage
python main.py --input people.csv --output results.csv

# With Notion output
python main.py --input people.csv --output results.csv --notion

# Run specific platforms only
python main.py --input people.csv --platforms youtube,instagram,reddit

# Skip Claude verification (faster, less accurate)
python main.py --input people.csv --no-verify
```

---

## Rate Limiting & Cost Estimates
- YouTube API: free up to 10k units/day (~100 searches)
- Reddit API: free, be polite (1 req/sec)
- Apify: ~$0.35 per 1,000 runs on free $5/mo tier
- Claude API: ~$0.003 per person verified (sonnet pricing)
- **Estimated total cost for 100 people: ~$0.50–$1.00**

---

## Error Handling
- If an API call fails, log the error and mark that platform as `null` with confidence `none`
- Retry failed Apify runs once after 5 seconds
- Never block the full pipeline on a single person or platform failure

---

## Future Enhancements (out of scope for v1)
- Meetup.com profile discovery
- Circle.so community profiles
- Scheduled runs with delta detection (only process new rows)
- Web UI for manual review queue
