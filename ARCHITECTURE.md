# Redditscan — Architecture

## System Overview

```
+--------------------------------------------------+
|                   FRONTEND                        |
|              React + Vite + Tailwind              |
|                                                   |
|  +------------+    +---------------------------+  |
|  | SearchBar  |    |      ResultsTabs          |  |
|  | [product]  |--->| Pricing | Complaints |    |  |
|  | [Search]   |    | Comparisons | Quotes |    |  |
|  +------------+    +---------------------------+  |
|        |                      ^                   |
+--------|----------------------|-------------------+
         | POST /search         | JSON response
         v                      |
+--------|----------------------|-------------------+
|        |              BACKEND                     |
|        |         FastAPI (Python)                 |
|        v                                          |
|  +------------------+                             |
|  |   /search        |  Synchronous endpoint       |
|  |   handler        |  (v1: no background tasks)  |
|  +--------+---------+                             |
|           |                                       |
|           v                                       |
|  +------------------+                             |
|  |   Crawler        |  httpx async                |
|  |   (crawler.py)   |  reddit.com/search.json     |
|  +--------+---------+                             |
|           |                                       |
|           | Raw Reddit posts + comments           |
|           v                                       |
|  +------------------+                             |
|  |   Extractors     |  Pure regex, no LLM         |
|  |  (extractors.py) |                             |
|  |                  |                             |
|  |  - pricing()     |  "$49/mo", "costs $X"       |
|  |  - complaints()  |  "slow", "switched away"    |
|  |  - comparisons() |  "vs", "chose X over Y"     |
|  |  - quotes()      |  Top-scored raw comments     |
|  +--------+---------+                             |
|           |                                       |
|           | Structured intel                      |
|           v                                       |
|  +------------------+                             |
|  |   Response       |  JSON → frontend            |
|  |   { pricing,     |                             |
|  |     complaints,  |                             |
|  |     comparisons, |                             |
|  |     quotes }     |                             |
|  +------------------+                             |
+---------------------------------------------------+
         |
         | HTTP GET (with User-Agent header)
         v
+---------------------------------------------------+
|              REDDIT PUBLIC API                     |
|                                                    |
|  reddit.com/search.json?q={query}&sort=top         |
|  reddit.com/r/{sub}/search.json?restrict_sr=1      |
|                                                    |
|  Rate limit: 1 req/sec, valid User-Agent required  |
|  Format: python:redditscan:v0.1 (by /u/username)   |
+----------------------------------------------------+
```

## Data Flow

```
User types "Notion"
       |
       v
[POST /search { query: "Notion" }]
       |
       v
[Crawler hits Reddit .json endpoints]
  - /search.json?q=Notion&sort=top&limit=100
  - /r/SaaS/search.json?q=Notion&restrict_sr=1&sort=top
  - /r/entrepreneur/search.json?q=Notion&restrict_sr=1&sort=top
  - /r/productivity/search.json?q=Notion&restrict_sr=1&sort=top
       |
       v
[Raw posts + comments collected]
       |
       +---> pricing_extractor()
       |       regex: \$\d+[\/per\s]*(mo|month|year|seat|user)
       |       output: [{ text, source_url, reddit_score }]
       |
       +---> complaint_extractor()
       |       keywords: slow, bug, issue, switched, cancelled, worst
       |       output: [{ text, category, reddit_score }]
       |
       +---> comparison_extractor()
       |       patterns: "vs", "compared to", "better than", "chose X over"
       |       output: [{ text, reddit_score }]
       |
       +---> quote_ranker()
               sort by reddit_score, dedup
               output: [{ text, reddit_score, subreddit }]
       |
       v
[Structured JSON response → Frontend]
```

## File Structure

```
Redditscan/
  backend/
    main.py              # FastAPI app + /search endpoint
    crawler.py           # httpx async Reddit crawler
    extractors.py        # pricing, complaints, comparisons, quotes
    requirements.txt     # fastapi, uvicorn, httpx

  frontend/
    src/
      App.tsx            # Search bar + results display
      components/
        SearchBar.tsx
        ResultsTabs.tsx
        PricingCard.tsx
        ComplaintList.tsx
        QuoteCard.tsx
    package.json
    vite.config.ts
    tailwind.config.js

  README.md
  ARCHITECTURE.md
```

## API Contract

```
POST /search
  Request:  { "query": "Notion" }
  Response: {
    "query": "Notion",
    "crawled_at": "2026-05-30T14:00:00Z",
    "subreddits_searched": ["SaaS", "entrepreneur", "productivity", "startups"],
    "pricing": [
      { "text": "I pay $16/mo for plus", "source_url": "https://reddit.com/...", "reddit_score": 847 }
    ],
    "complaints": [
      { "text": "support takes 3+ days", "category": "support", "reddit_score": 312 }
    ],
    "comparisons": [
      { "text": "chose Notion over Coda because...", "reddit_score": 201 }
    ],
    "quotes": [
      { "text": "been using Notion for 2 years...", "reddit_score": 1204, "subreddit": "r/SaaS" }
    ]
  }
```

## v2 Additions (not in 1-hour build)

```
+------------------+
|   SQLite Cache   |  24hr TTL, keyed by (query, date)
+------------------+

+------------------+
|  Background      |  FastAPI BackgroundTasks
|  Crawl + Poll    |  Frontend polls GET /results/{id}
+------------------+

+------------------+
|  Drafting Pad    |  Side-by-side: Reddit intel + post editor
+------------------+
```
