from __future__ import annotations
import json
import anthropic
from config import ANTHROPIC_API_KEY

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """You are a researcher verifying whether a social media profile belongs to a specific person.
Given a person's known details and a candidate profile, assess the likelihood they match.

Respond ONLY with valid JSON in this exact format:
{"confidence": "high|medium|low", "reasoning": "one sentence explanation"}

Confidence levels:
- high: name matches AND at least one corroborating signal (company, email domain, website, location)
- medium: name matches but no corroborating signals
- low: partial name match, common name with no signals, or ambiguous"""


def score_match(person: dict, platform: str, candidate: dict) -> dict:
    """Ask Claude to score whether candidate profile matches person. Returns confidence + reasoning."""
    if not ANTHROPIC_API_KEY:
        return {"confidence": "low", "reasoning": "No Anthropic API key configured"}

    email_domain = person.get("email", "").split("@")[-1] if "@" in person.get("email", "") else ""

    person_context = {
        "name": person.get("name", ""),
        "email_domain": email_domain,
        "company": person.get("company", ""),
        "location": person.get("location", ""),
        "website": person.get("website", ""),
    }

    user_message = f"""Platform: {platform}

Person we're looking for:
{json.dumps(person_context, indent=2)}

Candidate profile found:
{json.dumps(candidate, indent=2)}

Does this profile belong to the same person? Respond with JSON only."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        text = message.content[0].text.strip()
        return json.loads(text)
    except json.JSONDecodeError:
        return {"confidence": "low", "reasoning": "Failed to parse Claude response"}
    except Exception as e:
        return {"confidence": "low", "reasoning": f"Claude API error: {e}"}


def score_candidates(person: dict, platform: str, candidates: list[dict]) -> tuple[dict | None, str, str]:
    """
    Score all candidates and return (best_candidate, confidence, reasoning).
    Returns (None, 'none', '') if no candidates.
    """
    if not candidates:
        return None, "none", ""

    best = None
    best_score = -1
    best_reasoning = ""
    best_confidence = "none"

    rank = {"high": 2, "medium": 1, "low": 0, "none": -1}

    for candidate in candidates:
        result = score_match(person, platform, candidate)
        confidence = result.get("confidence", "low")
        reasoning = result.get("reasoning", "")
        if rank.get(confidence, -1) > best_score:
            best_score = rank[confidence]
            best = candidate
            best_confidence = confidence
            best_reasoning = reasoning

    return best, best_confidence, best_reasoning
