from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crawler import crawl_reddit
from extractors import extract_intel
from generator import draft_post, draft_comment
import os, httpx
from dotenv import load_dotenv
load_dotenv()

ZERNIO_API_KEY = os.getenv("ZERNIO_API_KEY")
ZERNIO_REDDIT_ACCOUNT_ID = os.getenv("ZERNIO_REDDIT_ACCOUNT_ID")

app = FastAPI(title="Redditscan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://redditscan.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str
    subreddits: List[str] = ["SaaS", "entrepreneur", "productivity", "startups"]
    expand: bool = False  # run extra Serper queries for broader coverage


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/search")
async def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    posts = await crawl_reddit(req.query, req.subreddits, expand=req.expand)

    if not posts:
        raise HTTPException(status_code=404, detail="No Reddit posts found")

    intel = extract_intel(posts, req.query)
    intel["query"] = req.query
    intel["subreddits_searched"] = req.subreddits
    intel["total_posts_scanned"] = len(posts)
    intel["expanded"] = req.expand

    return intel


class DraftRequest(BaseModel):
    idea: str
    context_snippets: Optional[List[str]] = None  # optional Reddit quotes for tone


@app.post("/draft")
def draft(req: DraftRequest):
    if not req.idea.strip():
        raise HTTPException(status_code=400, detail="Idea cannot be empty")
    try:
        return draft_post(req.idea, req.context_snippets)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Draft failed: {e}")


class CommentRequest(BaseModel):
    post: str    # the Reddit post being replied to
    intent: str  # what the user wants to say


@app.post("/comment")
def comment(req: CommentRequest):
    if not req.post.strip() or not req.intent.strip():
        raise HTTPException(status_code=400, detail="Post and intent cannot be empty")
    try:
        return draft_comment(req.post, req.intent)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comment draft failed: {e}")


class ScheduleRequest(BaseModel):
    content: str
    subreddit: str
    title: Optional[str] = None
    scheduled_for: Optional[str] = None  # ISO 8601, e.g. "2026-06-02T09:00:00.000Z"


@app.post("/schedule")
async def schedule(req: ScheduleRequest):
    if not ZERNIO_API_KEY or not ZERNIO_REDDIT_ACCOUNT_ID:
        raise HTTPException(status_code=500, detail="Zernio not configured")
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    payload = {
        "content": req.content,
        "platforms": [{
            "platform": "reddit",
            "accountId": ZERNIO_REDDIT_ACCOUNT_ID,
            "options": {
                "subreddit": req.subreddit.lstrip("r/"),
                "title": req.title or req.content[:100],
            }
        }],
    }
    if req.scheduled_for:
        payload["scheduledFor"] = req.scheduled_for

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://zernio.com/api/v1/posts",
            json=payload,
            headers={
                "Authorization": f"Bearer {ZERNIO_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )

    if res.status_code not in (200, 201):
        raise HTTPException(status_code=res.status_code, detail=res.text)

    data = res.json()
    post = data.get("post", data)
    return {
        "post_id": post.get("_id") or post.get("id", ""),
        "status": post.get("status", "scheduled"),
        "scheduled_for": req.scheduled_for,
        "subreddit": req.subreddit,
    }
