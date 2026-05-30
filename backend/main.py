from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crawler import crawl_reddit
from extractors import extract_intel

app = FastAPI(title="Redditscan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str
    subreddits: list[str] = ["SaaS", "entrepreneur", "productivity", "startups"]
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
