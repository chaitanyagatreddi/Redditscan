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

- **Frontend**: React + Vite + Tailwind v4
- **Backend**: FastAPI (Python)
- **Crawler**: httpx → [Serper.dev](https://serper.dev) (Google Search API, 2500 free searches)
- **Extraction**: pure regex — pricing, complaints, comparisons, quotes

## Quick start

**Prereqs:** Python 3.10+, Node 18+, and a free [Serper.dev](https://serper.dev) API key (sign in with Google).

```bash
git clone https://github.com/chaitanyagatreddi/Redditscan.git
cd Redditscan
```

**1. Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# open .env and paste your SERPER_API_KEY
uvicorn main:app --reload --port 8000
```

**2. Frontend** (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and search a product (e.g. `Notion`, `Linear`, `Salesforce`).

Share a result by clicking **Share results ↗** — the URL includes `?q=<product>` and auto-runs the search when opened.

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
