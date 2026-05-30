import httpx
import os
from dotenv import load_dotenv

load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")
SERPER_URL = "https://google.serper.dev/search"


async def search_reddit(client: httpx.AsyncClient, query: str) -> list[dict]:
    if not SERPER_API_KEY:
        raise ValueError("SERPER_API_KEY not set in .env")

    payload = {
        "q": f"{query} reddit",
        "num": 20,
    }
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
    }

    resp = await client.post(SERPER_URL, json=payload, headers=headers, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    posts = []
    import re
    for item in data.get("organic", []):
        url = item.get("link", "")
        # Only keep reddit.com results
        if "reddit.com" not in url:
            continue
        sub_match = re.search(r"reddit\.com/r/([^/]+)", url)
        subreddit = f"r/{sub_match.group(1)}" if sub_match else "r/unknown"

        posts.append({
            "title": item.get("title", ""),
            "selftext": item.get("snippet", ""),
            "score": 0,
            "permalink": url,
            "subreddit_name_prefixed": subreddit,
            "url": url,
        })

    return posts


async def crawl_reddit(query: str, subreddits: list[str]) -> list[dict]:
    all_posts = []
    seen_urls = set()

    async with httpx.AsyncClient() as client:
        # Broad search
        posts = await search_reddit(client, query)
        for p in posts:
            if p["url"] not in seen_urls:
                seen_urls.add(p["url"])
                all_posts.append(p)

        # Targeted search: pricing/complaints/comparisons
        for extra in ["pricing review", "complaint alternative switched"]:
            posts = await search_reddit(client, f"{query} {extra}")
            for p in posts:
                if p["url"] not in seen_urls:
                    seen_urls.add(p["url"])
                    all_posts.append(p)

    return all_posts
