# Redditscan

> Draft Reddit posts and comments that actually fit — without AI-generated slop that gets flagged.

Redditscan crawls a subreddit, shows you what's working (top posts, tone, format), and gives you a drafting pad to write your own post alongside the research.

No AI writes your post. You do. That's the point — authentic posts don't get banned.

```
Target: r/SaaS  →  Topic: "launched my indie app"
Left panel:  Top posts in r/SaaS this week (tone, format, what scored)
Right panel: Your draft — write something that fits
```

## Why not just use ChatGPT?

AI-written Reddit posts get flagged, downvoted, and banned. Redditors can smell them. This tool gives you the research so you write something that sounds human — because it is.

## Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: FastAPI (Python)
- **Crawler**: httpx → Reddit public JSON API (no API key needed)
- **Extraction**: pure regex — pricing, complaints, comparisons from threads

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

Open `http://localhost:5173`, pick a subreddit and topic.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system diagram.

## Features

| Feature | What it does |
|---------|-------------|
| Subreddit feed | Top posts from your target sub — tone, format, score |
| Intel extraction | Pricing, complaints, comparisons from threads |
| Drafting pad | Write your post alongside the research |
| No AI writing | You write. Tool just gives you context. |

## Roadmap

- [ ] v1 — subreddit crawler + drafting pad side by side
- [ ] v1.1 — intel extraction (pricing, complaints, comparisons)
- [ ] v2 — comment drafter: find relevant threads, draft a reply

## Contributing

PRs welcome. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pieces fit.

## License

MIT
