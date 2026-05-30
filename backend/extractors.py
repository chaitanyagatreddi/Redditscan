import re

# --- Pricing ---
PRICE_PATTERNS = [
    r'\$\s*\d+[\.,]?\d*\s*(\/|\bper\b)?\s*(mo|month|yr|year|seat|user|month)',
    r'\d+\s*(dollars?|usd)\s*(\/|\bper\b)?\s*(mo|month|yr|year|seat|user)',
    r'costs?\s+\$\s*\d+',
    r'pay\w*\s+\$\s*\d+',
    r'pricing\s+is\s+\$\s*\d+',
    r'plan\s+is\s+\$\s*\d+',
    r'free\s+tier|free\s+plan|freemium',
]

# --- Complaints ---
COMPLAINT_KEYWORDS = {
    "performance": ["slow", "laggy", "crashes", "freezes", "buggy", "unreliable", "unstable"],
    "support":     ["support", "customer service", "response time", "ghosted", "no reply", "useless support"],
    "pricing":     ["expensive", "overpriced", "price hike", "raised prices", "too costly", "not worth"],
    "features":    ["missing", "lack", "doesn't have", "no feature", "wish it had", "needs", "limited"],
    "switching":   ["switched away", "cancelled", "left", "moved to", "migrated from", "stopped using", "churned"],
}

# --- Comparisons ---
COMPARISON_PATTERNS = [
    r'\b(vs\.?|versus)\b',
    r'\bcompared?\s+to\b',
    r'\bbetter\s+than\b',
    r'\bworse\s+than\b',
    r'\bchose\b.{0,30}\bover\b',
    r'\bswitched\s+(from|to)\b',
    r'\bmoved\s+(from|to)\b',
    r'\balternative\s+to\b',
]


def extract_sentences(text: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def score_post(post: dict) -> int:
    return int(post.get("score", 0))


def get_text(post: dict) -> str:
    title = post.get("title", "")
    body = post.get("selftext", "")
    return f"{title} {body}".lower()


def extract_pricing(posts: list[dict], query: str) -> list[dict]:
    results = []
    q = query.lower()
    for post in posts:
        text = get_text(post)
        if q not in text:
            continue
        for pattern in PRICE_PATTERNS:
            matches = re.findall(r'.{0,60}(?:' + pattern + r').{0,60}', text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = ' '.join(m for m in match if m)
                results.append({
                    "text": match.strip(),
                    "source_url": f"https://reddit.com{post.get('permalink', '')}",
                    "reddit_score": score_post(post),
                    "subreddit": post.get("subreddit_name_prefixed", ""),
                })
    results.sort(key=lambda x: x["reddit_score"], reverse=True)
    return results[:10]


def extract_complaints(posts: list[dict], query: str) -> list[dict]:
    results = []
    q = query.lower()
    for post in posts:
        text = get_text(post)
        if q not in text:
            continue
        for category, keywords in COMPLAINT_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    sentences = extract_sentences(get_text(post))
                    for s in sentences:
                        if kw in s:
                            results.append({
                                "text": s,
                                "category": category,
                                "source_url": f"https://reddit.com{post.get('permalink', '')}",
                                "reddit_score": score_post(post),
                                "subreddit": post.get("subreddit_name_prefixed", ""),
                            })
                            break
    results.sort(key=lambda x: x["reddit_score"], reverse=True)
    # Deduplicate by text similarity (simple: exact match)
    seen = set()
    unique = []
    for r in results:
        if r["text"] not in seen:
            seen.add(r["text"])
            unique.append(r)
    return unique[:10]


def extract_comparisons(posts: list[dict], query: str) -> list[dict]:
    results = []
    q = query.lower()
    for post in posts:
        text = get_text(post)
        if q not in text:
            continue
        sentences = extract_sentences(text)
        for s in sentences:
            for pattern in COMPARISON_PATTERNS:
                if re.search(pattern, s, re.IGNORECASE):
                    results.append({
                        "text": s,
                        "source_url": f"https://reddit.com{post.get('permalink', '')}",
                        "reddit_score": score_post(post),
                        "subreddit": post.get("subreddit_name_prefixed", ""),
                    })
                    break
    results.sort(key=lambda x: x["reddit_score"], reverse=True)
    seen = set()
    unique = []
    for r in results:
        if r["text"] not in seen:
            seen.add(r["text"])
            unique.append(r)
    return unique[:10]


def extract_quotes(posts: list[dict], query: str) -> list[dict]:
    results = []
    q = query.lower()
    for post in posts:
        text = get_text(post)
        if q not in text:
            continue
        title = post.get("title", "").strip()
        if title and len(title) > 20:
            results.append({
                "text": title,
                "source_url": f"https://reddit.com{post.get('permalink', '')}",
                "reddit_score": score_post(post),
                "subreddit": post.get("subreddit_name_prefixed", ""),
            })
    results.sort(key=lambda x: x["reddit_score"], reverse=True)
    return results[:10]


def extract_intel(posts: list[dict], query: str) -> dict:
    return {
        "pricing":     extract_pricing(posts, query),
        "complaints":  extract_complaints(posts, query),
        "comparisons": extract_comparisons(posts, query),
        "quotes":      extract_quotes(posts, query),
    }
