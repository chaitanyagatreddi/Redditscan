"""
Reddit post drafter — takes a 2-line idea, generates a draft post that fits Reddit.
Uses OpenAI gpt-4o-mini (cheap, fast).
"""
import os
from typing import Optional, List
from openai import OpenAI

_client = None

def get_client() -> OpenAI:
    global _client
    if _client is None:
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY not set in environment")
        _client = OpenAI(api_key=key)
    return _client

SYSTEM_PROMPT = """You write Reddit posts that sound human and don't get flagged as AI.

Rules:
- Casual tone, lowercase ok, no emoji unless natural
- No marketing speak, no "I am excited to announce"
- Short paragraphs, 80-200 words total
- First sentence is a hook — a question, a confession, or a strong opinion
- End with a real question to invite comments (not a CTA)
- Use contractions ("I've", "don't")
- Sound like a real person typing on their phone

Output ONLY the post body. No title, no preamble, no markdown."""


def draft_post(idea: str, context_snippets: Optional[List[str]] = None) -> dict:
    """
    idea: 2-line user input (what they want to say)
    context_snippets: optional list of related Reddit quotes for tone matching
    Returns: { draft, word_count, tone }
    """
    context = ""
    if context_snippets:
        context = "\n\nFor tone reference, here's how Reddit posts on this topic usually sound:\n"
        context += "\n".join(f"- {s}" for s in context_snippets[:5])

    user_prompt = f"Idea:\n{idea}{context}\n\nWrite the post."

    resp = get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.8,
        max_tokens=400,
    )
    draft = resp.choices[0].message.content.strip()
    word_count = len(draft.split())
    tone = detect_tone(draft)
    return {"draft": draft, "word_count": word_count, "tone": tone}


def detect_tone(text: str) -> str:
    """Cheap heuristic tone detector — no LLM call."""
    t = text.lower()
    if any(w in t for w in ["amazing", "love", "awesome", "fantastic", "game changer"]):
        return "enthusiastic"
    if any(w in t for w in ["frustrated", "annoyed", "hate", "broken", "terrible"]):
        return "frustrated"
    if any(w in t for w in ["thinking about", "considering", "wondering", "anyone else"]):
        return "thoughtful"
    if "?" in text and text.count("?") >= 2:
        return "questioning"
    return "casual"
