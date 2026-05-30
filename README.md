# Redditscan

> Reddit is the last place where people tell the truth about software.

Mine competitor pricing, complaints, and comparisons from Reddit — the intel G2, Gartner, and Trustpilot don't have.

```
Search "Notion" →
  Pricing:     "I pay $16/mo for plus" (847 upvotes, r/SaaS)
  Complaints:  "support takes 3+ days to respond" (312 upvotes)
  Comparisons: "chose Notion over Coda because offline mode" (201 upvotes)
```

## Why

Review sites are sanitized. Vendor pages lie. Reddit says it raw — real pricing, honest complaints, switching reasons. No sales team can edit it.

This tool crawls Reddit and structures that signal for you.

## Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: FastAPI (Python)
- **Crawler**: httpx → Reddit public JSON API (no API key needed)
- **Extraction**: pure regex — no LLM, no cost

## Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, search any product name.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system diagram and data flow.

## What it extracts

| Signal | Example |
|--------|---------|
| Pricing | "$49/mo per seat", "costs $8/user/month" |
| Complaints | "slow on large databases", "cancelled after support ghosted me" |
| Comparisons | "switched from X to Y because...", "chose X over Y" |
| Quotes | Top-scored comments mentioning the product |

## Roadmap

- [ ] v1 — live crawl, structured output, React UI
- [ ] v1.1 — SQLite cache (24hr TTL), subreddit filter
- [ ] v2 — drafting pad: research + write Reddit posts side by side

## Contributing

PRs welcome. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pieces fit.

## License

MIT
